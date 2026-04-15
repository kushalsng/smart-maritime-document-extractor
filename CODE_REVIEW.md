# Code Review: feat: add document extraction endpoint

Hey, nice work getting this wired up end-to-end so quickly. Getting the file into Claude and returning structured data is a solid first milestone. I pulled it locally and the basic flow works fine for a single request.

Before we merge this, there are a few important things we should address: mainly around security, scalability, and error handling. I’ve called them out below with fixes.

---

## Event loop and synchronous I/O

The biggest issue here is using `fs.readFileSync` and `fs.copyFileSync`.

Node runs on a single thread. Async operations allow it to keep serving other requests while waiting. Sync methods block everything: so while a file is being read or copied, no other request gets processed.

Even one slow file operation can impact all users.

**Fix:** use async versions from `fs/promises`, for example:

```ts
await fs.promises.readFile(file.path)
```

---

## Line-by-Line Review

```typescript
const client = new Anthropic({ apiKey: 'sk-ant-REDACTED' });
```

**High Priority / Security**
We shouldn’t hardcode API keys. If this gets pushed, the key will get exposed.

**Fix:** move it to env:

```ts
apiKey: process.env.ANTHROPIC_API_KEY
```

---

```typescript
const savedPath = path.join('./uploads', file.originalname);
fs.copyFileSync(file.path, savedPath);
```

**High Priority / Security**
Using `file.originalname` directly can lead to directory traversal issues. Someone could upload a file with a path like `../../../something`.

Also, saving files permanently without cleanup will eventually fill disk.

**Fixes:**

* generate a safe filename (UUID or sanitized name)
* don’t trust `originalname`
* clean up temp files or move to proper storage (like S3)

---

```typescript
const response = await client.messages.create({
  model: 'claude-opus-4-6',
```

**Note**
Opus is powerful but slow and expensive. It’s worth trying `claude-3-5-sonnet-latest`: usually faster and cheaper with similar results.

---

```typescript
text: 'Extract all information from this maritime document and return as JSON.',
```

**Bug Risk**
LLMs don’t always return clean JSON. You’ll often get something like text + ```json blocks, which breaks `JSON.parse()`.

**Fix:**

* define a strict schema in the prompt
* use JSON mode / tool use if available
* make sure output is always parseable

---

```typescript
global.extractions = global.extractions || [];
global.extractions.push(result);
```

**High Priority / Memory**
This will grow forever and eventually crash the server.

**Fix:** remove this and just return the result. If we need storage, use a database.

---

## Next steps

Let’s fix:

* blocking file operations
* file handling security

Happy to pair on this if you want to walk through it. Good start overall: just needs a bit of hardening before it’s production-ready.
