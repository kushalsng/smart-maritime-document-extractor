# 🚢 Smart Maritime Document Extractor

#### A backend service to extract, validate, and analyze maritime documents using LLMs.
It supports processing documents such as certificates, medical records, and identification files by converting unstructured inputs (PDFs, images, text) into structured, machine-readable data. The system enables both real-time (sync) and scalable background (async) processing, ensures reliability through JSON repair and retry mechanisms, and performs cross-document validation to detect inconsistencies or compliance issues. Designed with modular LLM integration, the service allows seamless switching between providers while maintaining consistent output formats.

---

## ⚡ Setup in 3 Commands (Under 5 Minutes)

### 0. Create a `.env` file:

```env
PORT=3000

LLM_PROVIDER=gemini # you can set the provider dynamically (available LLM providers mentioned below 👇)
LLM_MODEL=gemini-2.0-flash # set LLM model
LLM_API_KEY=api-key-here  # set your LLM's API key here (if aplicable)

DB_USER=postgres
DB_PASSWORD=password
DB_NAME=smde-service
DB_PORT=5433
DB_HOST=localhost


WEBHOOK_SECRET='webhook-secret-here'  #optional
```

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
npm run start
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

## 🧠 LLM Providers

Provider is configurable via env file (provider and model names are CASE SENSITIVE)

| Provider           | Model                        |
| ------------------ | ---------------------------- |
| gemini             | gemini-2.0-flash             |
| groq               | llama-3.2-11b-vision-preview |
| mistral            | pixtral-12b-2409             |
| ollama             | llava (local)                |
| anthropic          | claude-haiku-4-5-20251001    |
| openai             | gpt-4o-mini                  |

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

## 🧪 Testing

Run tests:

```bash
npm test
```

Includes:

* ✅ JSON repair unit tests


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
* Robust JSON parsing with retry + repair

