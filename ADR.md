# Architecture Decision Record (ADR)

## Overview

This system is designed to extract, validate, and analyze maritime documents using LLMs with support for both synchronous and asynchronous processing. The architecture prioritizes reliability, modularity, and extensibility while keeping operational complexity low for the scope of this assignment.

---

## Question 1 — Sync vs Async

In production, **async processing should be the default**.

While synchronous mode provides a better user experience for small, single-document uploads, it does not scale well due to the unpredictable latency of LLM calls. Async processing decouples request handling from execution, prevents request timeouts, and allows better control over retries and failures.

**Default Decision:**

* Default: `async`
* Allow `sync` only for small files and low concurrency scenarios

**Thresholds to force async:**

* File size > **5 MB**
* Concurrent requests > **5–10 active extractions**
* Any request involving multi-document validation

Beyond these thresholds, forcing async ensures system stability and prevents blocking the API layer.

---

## Question 2 — Queue Choice

The system uses **pg-boss**, a PostgreSQL-backed job queue.

**Why pg-boss:**

* No additional infrastructure required (leverages existing PostgreSQL)
* Reliable job persistence
* Simple integration with transactional workflows
* Suitable for moderate workloads

**Limitations:**

* Throughput is constrained by database performance
* Polling-based workers introduce latency
* Not ideal for high-frequency job dispatching

**If scaling to ~500 concurrent extractions/minute:**
I would migrate to **Redis-based queues (e.g., BullMQ)** or a distributed system like **Kafka**.

**Failure modes of current approach:**

* DB connection saturation under load
* Jobs stuck in `PROCESSING` if worker crashes mid-task
* Increased latency due to polling
* Limited horizontal scalability

---

## Question 3 — LLM Provider Abstraction

A **provider abstraction layer was implemented** to support multiple LLM providers without code changes.

**Design:**
A factory-based pattern selects the provider based on environment variables:

```ts
LLM_PROVIDER=gemini | mistral | groq | ollama | openai
```

**Interface:**

```ts
interface LLMProvider {
  extract(base64: string, mimeType: string, prompt: string): Promise<string>;
  generateText(prompt: string): Promise<string>;
}
```

**Why this approach:**

* Enables switching providers without code changes
* Supports fallback strategies in future
* Allows benchmarking across providers
* Keeps business logic independent of vendor APIs

This abstraction is critical because LLM APIs evolve rapidly and vendor lock-in is a major risk.

---

## Question 4 — Schema Design

The schema uses **JSON fields (`fields_json`, `validity_json`, etc.)** to store dynamic extraction results.

**Advantages:**

* Flexible schema for varying document types
* Faster development without rigid normalization

**Risks at scale:**

* Poor query performance on nested JSON
* Difficult indexing for frequently queried fields
* Limited support for analytical queries
* Harder to enforce data consistency

**Improvements for production:**

* Extract key fields into structured columns (e.g., `date_of_expiry`, `document_type`)
* Add indexes on frequently queried fields:

  * `session_id`
  * `status`
  * `date_of_expiry`
* Use **GIN indexes** for JSON where necessary
* Introduce a separate `document_fields` table for normalized querying

**Example query requirement:**

> “All sessions where any document has an expired COC”

This becomes inefficient with JSON and should instead rely on indexed columns like:

```sql
WHERE document_type = 'COC' AND date_of_expiry < NOW()
```

---

## Question 5 — What Was Skipped

The following production-level features were intentionally not implemented:

1. **Distributed Rate Limiting (Redis-based)**

   * Used in-memory rate limiting instead
   * Reason: Simpler setup, sufficient for single-instance deployment

2. **Database Migrations Framework**

   * No Prisma/Flyway setup
   * Reason: Schema is small and manageable for assignment scope

3. **Robust Observability (Logs, Metrics, Tracing)**

   * No structured logging or monitoring system
   * Reason: Focus was on core functionality over operational tooling

4. **Worker Fault Recovery / Dead Letter Queue**

   * No DLQ for failed jobs
   * Reason: pg-boss retry + failure handling was sufficient for scope

5. **Authentication & Authorization**

   * APIs are open
   * Reason: Not required for assignment

---

## Provider Benchmark

The same document was tested across two providers:

| Provider                  | Accuracy | Speed        | Cost         |
| ------------------------- | -------- | ------------ | ------------ |
| Gemini (gemini-2.0-flash) | High     | Fast (~2–4s) | Free tier    |
| Mistral (pixtral-12b)     | Medium   | Moderate     | Credit-based |

**Conclusion:**
Gemini was selected as the default due to better accuracy and lower cost. The abstraction layer allows switching providers if needed.

---

## Prompt Versioning

Prompt versioning is implemented using a **hash of the prompt content** stored per extraction.

**Why it matters:**

* Ensures reproducibility of results
* Enables debugging when outputs change
* Supports A/B testing of prompt improvements
* Prevents silent regressions in extraction quality

Unlike static versioning, hash-based versioning guarantees that each extraction is tied to the exact prompt used.

---

## Summary

The system balances simplicity and scalability by:

* Using async processing as the default
* Leveraging PostgreSQL for both storage and queuing
* Abstracting LLM providers for flexibility
* Using JSON for rapid development while acknowledging its limitations

The design is suitable for moderate workloads and can evolve toward a more distributed architecture as scale increases.
