# NotebookLM Lite

A RAG-powered "chat with your document" app — upload a PDF or text file and ask grounded questions about it. Built as Assignment 03 (GenAI cohort).

- **Live demo:** _add your Vercel URL here_
- **Stack:** Next.js (App Router) · OpenAI (`text-embedding-3-large`, `gpt-4.1-mini`) · Qdrant Cloud · LangChain

## How it works (RAG pipeline)

```
Upload  ─►  Parse        ─►  Chunk                   ─►  Embed                   ─►  Store
            (WebPDFLoader     (RecursiveCharacter         (OpenAI                     (Qdrant Cloud
             / text())        TextSplitter)               text-embedding-3-large)     fresh collection
                                                                                       per upload)

Question ─► Embed ─► Top-k similarity search (Qdrant) ─► Build grounded prompt ─► gpt-4.1-mini ─► Answer + citations
```

### Chunking strategy

We use LangChain's `RecursiveCharacterTextSplitter` with:

| Parameter      | Value                              | Why                                                                          |
| -------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| `chunkSize`    | `1000` characters                  | Big enough to hold a coherent paragraph, small enough that the LLM can fit several retrieved chunks in context. |
| `chunkOverlap` | `200` characters                   | Prevents information loss at chunk boundaries — a sentence split across chunks still appears in at least one. |
| `separators`   | `["\n\n", "\n", ". ", " ", ""]`    | Splits on paragraph → line → sentence → word → character, in that order, so chunk boundaries respect natural prose structure. |

Page numbers from the PDF parser are preserved in chunk metadata so the UI can show citations.

### Document scoping

Every upload creates its own Qdrant collection (`doc_<nanoid>`). The frontend tracks the returned `sessionId` and passes it on every chat call. This keeps documents isolated — no cross-contamination between users.

### Grounding

The system prompt is strict: answer **only** from the retrieved excerpts, and reply "I couldn't find that in the document" if the answer isn't present. `temperature` is set to `0.1`. Retrieved chunks are shown to the user as sources (with page numbers) under each answer.

## API

| Route          | Method | Body                                                                  | Returns                                       |
| -------------- | ------ | --------------------------------------------------------------------- | --------------------------------------------- |
| `/api/ingest`  | POST   | `multipart/form-data` with field `file` (PDF or TXT, ≤ 15 MB)         | `{ sessionId, fileName, pages, chunks }`      |
| `/api/chat`    | POST   | JSON `{ sessionId, question, history? }`                              | `{ answer, citations: [{ page, snippet }] }`  |

## Local development

1. **Clone and install**
   ```bash
   npm install
   ```
2. **Set up Qdrant Cloud** — create a free cluster at [cloud.qdrant.io](https://cloud.qdrant.io), grab the cluster URL and API key.
3. **Configure env vars** — copy `.env.example` to `.env.local` and fill in:
   ```
   OPENAI_API_KEY=sk-...
   QDRANT_URL=https://your-cluster-id.qdrant.io
   QDRANT_API_KEY=your-qdrant-cloud-api-key
   ```
4. **Run**
   ```bash
   npm run dev
   ```
   Open <http://localhost:3000>.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Add `OPENAI_API_KEY`, `QDRANT_URL`, `QDRANT_API_KEY` as environment variables.
4. Deploy. The free tier handles the 60-second `maxDuration` on both API routes.

## Project structure

```
app/
  page.js              # Single-page UI (upload + chat)
  layout.js
  api/
    ingest/route.js    # Upload → parse → chunk → embed → index
    chat/route.js      # Retrieve top-k → grounded LLM call
lib/
  rag.js               # Shared OpenAI/Qdrant helpers
```
