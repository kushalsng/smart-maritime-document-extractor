# Architecture Decision Record (ADR)

## Question 1 — Sync vs Async

**Which mode should be the default and why?**
In a production environment, `?mode=async` must be the default. The core operation of this service involves processing files and orchestrating calls to external Large Language Models (LLMs). LLM execution times are inherently unpredictable, often taking anywhere from 5 to over 30 seconds for complex vision-based extractions. Running these operations synchronously holds open HTTP connections for extended periods, leading to a high risk of gateway timeouts, server thread exhaustion, and poor user experience. An async-first approach (using the queue mechanism) ensures the API responds immediately (HTTP 202 Accepted) and allows the server to manage throughput predictably without dropping connections.

**At what file size or concurrency threshold would you force async?**
Synchronous requests should be strictly bounded. I would force async regardless of the `?mode` parameter if:
1. **File Size/Complexity**: The uploaded file exceeds 2MB or a multi-page PDF exceeds 3 pages. Large files require more token processing and drastically increase latency.
2. **Concurrency**: The server is currently handling more than 5-10 concurrent synchronous extractions (depending on the provider's rate limits and our worker scaling). Accepting more sync requests during high load will inevitably lead to compounding delays and cascading failures.

---

## Question 2 — Queue Choice

**What queue mechanism did you use and why?**
The service uses **pg-boss**, a job queue built on top of PostgreSQL. Since the application already requires a PostgreSQL database to persist sessions, extractions, and validations, using `pg-boss` eliminates the need to introduce, host, and monitor an additional piece of infrastructure (like Redis). It leverages Postgres's atomicity and transactional guarantees to ensure jobs are not lost. 

**What would you migrate to at 500 concurrent extractions per minute?**
At a high theoretical throughput of 500 extractions/minute, the database could experience significant IO contention and lock contention as `pg-boss` constantly polls and updates row states. At that scale, I would migrate to a dedicated, high-throughput message broker such as **AWS SQS** or a Redis-based queue like **BullMQ**. These systems are designed explicitly for ephemeral high-volume message passing and decouple the queuing load from our primary persistent data store.

**What are the failure modes of the current approach?**
1. **Database Contention**: Under heavy load, queue polling competes with standard read/write queries for database connections and CPU, potentially degrading API performance.
2. **Stalled Jobs**: If a worker crashes mid-extraction (e.g., during a long LLM call), the job remains in an invisible locked state until the visibility timeout expires, delaying retries.
3. **Bloat**: High job churn can lead to Postgres table bloat (dead tuples) if autovacuum isn't aggressively tuned for the `pg-boss` tables.

---

## Question 3 — LLM Provider Abstraction

**Did you build a provider interface or implement against one directly?**
Yes, a strict provider abstraction was built via the `LLMProvider` interface. 

**Justify the decision:**
Vendor lock-in is a massive risk in the rapidly evolving generative AI space. LLM providers frequently experience downtime, alter pricing structures, or deprecate models. By abstracting the provider, we gain the flexibility to:
- Instantly route around outages (e.g., failover from Anthropic to OpenAI).
- Route requests based on cost/performance tradeoffs.
- Easily integrate local offline models (like Ollama) for sensitive data or development.

**Interface Description:**
The interface (`src/services/llm/llm.interface.ts`) is minimalistic to ensure broad compatibility:
- `extract(base64: string, mimeType: string, prompt: string): Promise<string>`: A unified way to pass multi-modal inputs (images/PDFs) and instructions for structural extraction.
- `generateText(prompt: string): Promise<string>`: For standard text-only reasoning or validation steps.

---

## Question 4 — Schema Design

**What are the risks of using JSONB/TEXT columns at scale?**
The schema relies heavily on `JSONB` columns (`fields_json`, `validity_json`, `medical_data_json`, `flags_json`) to store dynamic extracted data. 
- **Storage Bloat**: JSONB payload sizes can grow large, causing Postgres to push data to TOAST tables. This significantly impacts read performance when performing sequential scans.
- **Index Overhead**: While Postgres allows JSONB indexing (GIN indexes), querying deep or unpredictable keys within large JSON fields is CPU-intensive and can result in poorly optimized query plans.
- **Data Integrity**: JSON properties circumvent strict relational constraints, making it harder to enforce data consistency.

**What would you change to support full-text search or cross-document queries?**
If the product required querying "all sessions where any document has an expired COC", the current schema would perform poorly. To safely support complex queries, I would:
1. **Normalize Core Fields**: Create strongly-typed, indexed relational tables for critical properties that are frequently searched (e.g., `document_type`, `expiry_date`, `holder_name`).
2. **EAV or Granular Tables**: Create a table like `extraction_fields (extraction_id, field_key, field_value_text, status)` which allows standard B-tree indexing across all field values.
3. **Dedicated Search Index**: For true full-text search across all extracted data, I would mirror the data into a search engine like **Elasticsearch** or use heavily optimized Postgres `tsvector` columns rather than ad-hoc JSONB path queries.

---

## Question 5 — What You Skipped

**List at least three things deliberately not implemented:**

1. **Authentication and Authorization (API Keys/JWT)**
   *Reasoning:* Skipped to focus entirely on the core business logic of LLM-based extraction. In production, this service would be entirely unusable without robust identity verification to protect sensitive user documents and prevent unauthorized API usage.
   
2. **Circuit Breakers and Deep Failover Logic**
   *Reasoning:* While basic retries exist, the system lacks a Circuit Breaker (e.g., `Opossum`). Deprioritized for velocity. In production, if an LLM API goes down, continuing to send requests exhausts our own worker threads and burns rate limits. A circuit breaker combined with multi-provider failover is mandatory for high availability.

3. **Comprehensive Observability and Token Tracking**
   *Reasoning:* Skipped to limit boilerplate. In a production AI pipeline, every request needs OpenTelemetry traces to monitor token usage, latency per model, and exact prompt/response pairs. Without this, calculating unit economics (cost per extraction) and debugging hallucinations at scale is impossible.

4. **Robust Rate Limiting / DoS Protection**
   *Reasoning:* Skipped because the deployment context is assumed local/testing. Production endpoints exposing expensive and slow operations (like submitting files for OCR/LLM) require aggressive IP/User-based rate limiting via Redis to prevent intentional or accidental denial of service (and massive LLM billing spikes).
