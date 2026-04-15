# 🚢 Smart Maritime Document Extractor

A backend service to extract, validate, and analyze maritime documents using LLMs.

---

## ⚡ Setup in 3 Commands (Under 5 Minutes)

### 1. Install dependencies

```bash
npm install
```

### 2. Start PostgreSQL (Docker)

```bash
docker-compose up
```

### 3. Run the server

```bash
npm run dev
```

---

## 🧪 Verify Setup

```bash
GET http://localhost:3000/api/health
```

Response:

```json
{ "status": "OK" }
```

---
## ⚙️ Environment Variables

Create a `.env` file:

```env
PORT=3000

LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.0-flash
LLM_API_KEY=api-key-here

DB_USER=postgres
DB_PASSWORD=password
DB_NAME=smde-service
DB_PORT=5433
DB_HOST=localhost


WEBHOOK_SECRET='webhook-secret-here'
```

---

## 📦 Features

* 📄 Document extraction (PDF, images, text)
* ⚡ Sync & async processing (pg-boss queue)
* 🔁 Retry + job tracking
* 🧠 LLM abstraction (Gemini, Groq, Mistral, Ollama)
* 🛡️ JSON repair + LLM reliability handling
* 🔍 Cross-document validation
* 📊 Session-level reporting
* 🌐 Webhook support (async completion)
* 🧾 Prompt versioning (hash-based)

---

## 🔌 API Overview

### Extract Document

```http
POST /api/extract?mode=sync | async
```

* `multipart/form-data`
* field: `document`
* optional: `sessionId`, `webhookUrl`

---

### Get Job Status

```http
GET /api/jobs/:jobId
```

---

### Validate Session

```http
POST /api/sessions/:sessionId/validate
```

---

### Get Report

```http
GET /api/sessions/:sessionId/report
```

---

## 🧠 LLM Providers

Provider is configurable via env:

| Provider           | Model                        |
| ------------------ | ---------------------------- |
| Google Gemini      | gemini-2.0-flash             |
| Groq               | llama-3.2-11b-vision-preview |
| Mistral            | pixtral-12b-2409             |
| Ollama             | llava (local)                |
| Anthropic Claude   | claude-haiku-4-5-20251001    |
| OpenAI             | gpt-4o-mini                  |

---

## 🧪 Testing

Run tests:

```bash
npm test
```

Includes:

* ✅ JSON repair unit tests

---

## 🗂️ Project Structure

```text
src/
  config/
  controllers/
  middleware/
  providers/
  services/
  repositories/
  queue/
  util/
  types/
  tests/
```

---

## ⚠️ Notes

* Docker is required for PostgreSQL
* LLM provider must be configured via `.env`
* Uploaded files are cleaned up after processing
* No credentials are stored in the repository

---

## 🚀 Design Highlights

* Async processing via pg-boss queue
* Idempotent extraction using file hash
* LLM abstraction for provider swapping
* Prompt versioning via SHA hash
* Robust JSON parsing with retry + repair

