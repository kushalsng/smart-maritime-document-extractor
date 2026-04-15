# Architecture Decision Record (ADR)

## Question 1: Sync vs Async

**Which mode should be the default and why?**
In a production environment, `?mode=async` must be the default for the following reasons:
*   **Unpredictable Execution Times:** The core operation involves external Large Language Models (LLMs), which can take anywhere from 5 to over 30 seconds for complex vision-based extractions.
*   **Resource Protection:** Synchronous operations hold HTTP connections open, leading to a high risk of gateway timeouts and server thread exhaustion.
*   **Improved User Experience:** An async-first queue mechanism ensures the API responds immediately (HTTP 202 Accepted), allowing the server to manage throughput predictably without dropping connections.

**At what file size or concurrency threshold would you force async?**
I would force async regardless of the `?mode` parameter under these conditions:
*   **Large File Size/Complexity:** The uploaded file exceeds 2MB or a multi-page PDF exceeds 3 pages, as these drastically increase token processing latency.
*   **High Concurrency Threshold:** The server is handling more than 5-10 concurrent synchronous extractions. Exceeding this limit inevitably leads to compounding delays and cascading failures due to provider rate limits and worker scaling constraints.

---

## Question 2: Queue Choice

**What queue mechanism did you use and why?**
The service uses **pg-boss**, a job queue built on top of PostgreSQL.
*   **Zero Additional Infra:** The application already requires a PostgreSQL database to persist extractions. `pg-boss` eliminates the need to introduce and host an external broker like Redis.
*   **Reliability:** It leverages Postgres's atomicity and transactional guarantees to ensure jobs are never lost.

**What would you migrate to at 500 concurrent extractions per minute?**
At 500 extractions/minute, the database could experience severe IO and lock contention from constant polling. To resolve this, I would migrate to:
*   **AWS SQS** or a Redis-based queue like **BullMQ**.
*   These are designed explicitly for ephemeral high-volume message passing and decouple the queuing load from the primary persistent data store.

**What are the failure modes of the current approach?**
*   **Database Contention:** Queue polling competes with standard read/write queries for connections, potentially degrading overall API performance.
*   **Stalled Jobs:** If a worker crashes mid-extraction, the job remains invisibly locked until the visibility timeout expires, delaying retries.
*   **Table Bloat:** High job churn leads to Postgres dead tuples if autovacuum isn't aggressively tuned for the `pg-boss` tables.

---

## Question 3: LLM Provider Abstraction

**Did you build a provider interface or implement against one directly?**
Yes, a strict provider abstraction was built via the `LLMProvider` interface.

**Justify the decision:**
Abstracting the provider mitigates the massive risk of vendor lock-in, providing the following benefits:
*   **High Availability:** Instantly route around outages (e.g., failover from Anthropic to OpenAI).
*   **Cost Optimization:** Route requests dynamically based on cost/performance tradeoffs.
*   **Flexibility:** Easily integrate local offline models (like Ollama) for sensitive data or local development.

**Interface Description (`src/services/llm/llm.interface.ts`):**
*   `extract(base64: string, mimeType: string, prompt: string): Promise<string>`: Handles multi-modal inputs (images/PDFs) and instructions for structural extraction.
*   `generateText(prompt: string): Promise<string>`: Handles standard text-only reasoning and validation steps.

---

## Question 4: Schema Design

**What are the risks of using JSONB/TEXT columns at scale?**
The schema relies on `JSONB` columns to store dynamic extracted data, introducing several risks at scale:
*   **Storage Bloat:** Large payloads push data to TOAST tables, heavily degrading read performance during sequential scans.
*   **Index Overhead:** Querying deep or unpredictable keys via GIN indexes is CPU-intensive and can result in poorly optimized query plans.
*   **Data Integrity:** JSON properties circumvent strict relational constraints, making schema evolution and data consistency hard to enforce.

**What would you change to support full-text search or cross-document queries?**
To safely support queries like "all sessions where any document has an expired COC", I would:
*   **Normalize Core Fields:** Create strongly-typed, indexed relational tables for frequently searched properties (e.g., `document_type`, `expiry_date`).
*   **Implement EAV Tables:** Create an `extraction_fields` table to allow standard B-tree indexing across all extracted dynamic values.
*   **Add a Dedicated Search Index:** Mirror the data into **Elasticsearch** (or use heavily optimized Postgres `tsvector` columns) for true full-text search capabilities.

---

## Question 5: What You Skipped

**List at least three things deliberately not implemented:**

*   **Authentication and Authorization (API Keys/JWT)**
    *   *Reasoning:* Skipped to focus entirely on LLM-based extraction logic. In production, this is mandatory to protect sensitive documents and prevent unauthorized API usage.
*   **Circuit Breakers and Deep Failover Logic**
    *   *Reasoning:* Deprioritized for velocity. In production, an LLM outage without a circuit breaker exhausts worker threads and burns rate limits. Failover logic is necessary for high availability.
*   **Comprehensive Observability and Token Tracking**
    *   *Reasoning:* Skipped to limit boilerplate. Production pipelines require OpenTelemetry traces to monitor token usage, model latency, and debug hallucinations at scale.
*   **Robust Rate Limiting / DoS Protection**
    *   *Reasoning:* Deployment context is assumed local. Exposing expensive OCR/LLM endpoints requires aggressive IP/User-based rate limiting via Redis to prevent denial of service and massive billing spikes.