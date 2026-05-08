# NotebookLM Lite

NotebookLM Lite is a Retrieval-Augmented Generation (RAG) application that enables users to upload documents and interact with them conversationally. Instead of functioning as a generic chatbot, the system grounds its responses in the uploaded document itself, making it useful for research, studying, technical reading, and document exploration.

The project was built to explore practical GenAI system design using modern RAG architecture, vector databases, semantic retrieval, and grounded language model generation.

Users can upload PDFs or text documents, ask questions in natural language, and receive context-aware answers backed by retrieved excerpts from the document.

---

# Live Demo

Add your deployment URL here.

```text
https://your-vercel-app.vercel.app
```

---

# Features

## Document Upload

- Upload PDF documents
- Upload plain text files
- Drag-and-drop support
- File validation and size limits
- Automatic document parsing

---

## Retrieval-Augmented Generation (RAG)

- Semantic chunk retrieval
- Vector similarity search
- Context-grounded responses
- Source-aware answers
- Reduced hallucinations

---

## Conversational Document Chat

- Multi-turn conversations
- Chat history support
- Persistent document context
- NotebookLM-inspired interaction style

---

## Source Citations

Each response includes:

- Retrieved supporting excerpts
- Page references
- Source snippets

This improves answer transparency and helps users verify generated responses.

---

## Session Persistence

The application preserves:

- Uploaded document session
- Chat history
- File metadata
- Retrieval context

Sessions remain available even after page refreshes using local storage.

---

# Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js App Router, React, Tailwind CSS |
| Backend | Next.js API Routes |
| Vector Database | Qdrant Cloud |
| Embeddings | HuggingFace Transformers |
| Embedding Model | Xenova/all-MiniLM-L6-v2 |
| LLM Provider | OpenRouter |
| Language Models | Mistral Nemo / Llama 3.1 |
| RAG Framework | LangChain |
| PDF Parsing | LangChain WebPDFLoader |
| Session Persistence | localStorage |

---

# Project Goal

The primary goal of this project was to build a production-style RAG pipeline capable of:

- understanding uploaded documents
- retrieving relevant semantic context
- generating grounded answers
- reducing hallucinations
- supporting conversational exploration of long-form content

The system was intentionally designed to mimic the behavior of tools like NotebookLM while remaining lightweight and fully customizable.

---

# System Architecture

## High-Level Architecture

```text
                ┌────────────────────┐
                │   User Uploads     │
                │ PDF / TXT Document │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │ Document Parsing   │
                │ WebPDFLoader       │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │ Text Chunking      │
                │ Recursive Splitter │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │ Embedding Creation │
                │ HuggingFace Model  │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │ Qdrant Vector DB   │
                │ Semantic Storage   │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │ User Question      │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │ Similarity Search  │
                │ Top-K Retrieval    │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │ Prompt Construction│
                │ Context Injection  │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │ OpenRouter LLM     │
                │ Response Generation│
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │ Final Answer +     │
                │ Citations          │
                └────────────────────┘
```

---

# RAG Pipeline Breakdown

# 1. Document Upload

The application accepts:

- PDF files
- TXT files

Maximum supported size:

```text
15 MB
```

When a file is uploaded:

1. The file is validated
2. PDF pages are parsed
3. Raw text is extracted
4. Documents are converted into LangChain document objects

PDFs are parsed using:

```text
WebPDFLoader
```

TXT files are converted into a single document with metadata.

---

# 2. Chunking Strategy

After extraction, the text is split into smaller semantic chunks.

The application uses:

```text
RecursiveCharacterTextSplitter
```

## Configuration

| Parameter | Value |
|---|---|
| chunkSize | 1000 |
| chunkOverlap | 200 |
| separators | ["\n\n", "\n", ". ", " ", ""] |

---

## Why Chunking Matters

Language models cannot process entire large documents efficiently within context windows.

Chunking helps by:

- reducing token load
- improving retrieval quality
- preserving semantic meaning
- enabling scalable search

---

## Why This Specific Strategy?

### chunkSize = 1000

Large enough to:

- preserve coherent thoughts
- retain paragraph-level meaning
- improve retrieval accuracy

Small enough to:

- fit multiple chunks into prompt context
- avoid unnecessary token usage

---

### chunkOverlap = 200

Overlap prevents information loss between chunk boundaries.

For example:

- if a sentence spans two chunks
- overlapping ensures at least one chunk still contains complete context

This significantly improves retrieval consistency.

---

### Separator Hierarchy

The splitter prioritizes:

```text
Paragraph → Line → Sentence → Word → Character
```

This preserves natural text structure as much as possible.

---

# 3. Embedding Generation

Each chunk is converted into a vector embedding.

The project uses:

```text
Xenova/all-MiniLM-L6-v2
```

through HuggingFace Transformers.

---

## Why Local Embeddings?

Initially, external embedding APIs were considered.

The system was later migrated to local HuggingFace embeddings because they provide:

- no API cost
- no rate limits
- better development stability
- faster iteration
- offline capability

---

## Embedding Dimensions

The model generates:

```text
384-dimensional vectors
```

These vectors are optimized for semantic similarity search.

---

# 4. Vector Database

The generated embeddings are stored in:

```text
Qdrant Cloud
```

Qdrant is used because it provides:

- fast vector similarity search
- scalable retrieval
- cloud-hosted persistence
- simple API integration
- excellent LangChain compatibility

---

## Collection Design

Each uploaded document gets its own isolated collection.

Example:

```text
doc_x82Ka91
```

This design prevents:

- cross-document contamination
- retrieval leakage
- mixed-context answers

and makes session-level retrieval clean and predictable.

---

# 5. Semantic Retrieval

When a user asks a question:

1. The query is embedded
2. Qdrant performs vector similarity search
3. Relevant chunks are retrieved
4. Retrieved context is injected into the prompt

The retriever currently uses:

```text
Top 8 chunks
```

instead of smaller retrieval depth.

---

## Why Increase Retrieval Depth?

Using more retrieved chunks improves:

- summarization
- broad context understanding
- conceptual synthesis
- document-wide reasoning
- multi-section question answering

This creates a more NotebookLM-like interaction style.

---

# 6. Prompt Engineering

The prompting strategy is designed to balance:

```text
Grounding + intelligent synthesis
```

instead of behaving like a rigid extractive QA system.

---

## Prompt Responsibilities

The assistant is instructed to:

- answer using retrieved context
- summarize information
- explain concepts
- synthesize across excerpts
- infer carefully when strongly supported
- avoid unsupported hallucinations

---

## Prompt Philosophy

The system intentionally avoids:

```text
answer ONLY from context
```

because that creates overly robotic behavior.

Instead, it behaves more like:

```text
an intelligent research assistant grounded in the document
```

This produces significantly better user experience.

---

# 7. Language Model Layer

The application uses:

```text
OpenRouter
```

as the inference provider.

---

## Why OpenRouter?

OpenRouter was chosen because it provides:

- OpenAI-compatible APIs
- access to multiple models
- provider flexibility
- easy experimentation
- lower integration overhead

---

## Current Recommended Models

### Mistral Nemo

```text
mistralai/mistral-nemo
```

Used for:

- fast inference
- stable responses
- strong RAG performance
- long-context handling

---

### Llama 3.1 70B

```text
meta-llama/llama-3.1-70b-instruct
```

Used when:

- higher reasoning quality is required
- latency is less important
- synthesis quality matters more

---

# Session Persistence

Initially, refreshing the browser caused:

- uploaded documents to disappear
- chat history to reset
- session IDs to be lost

This problem was solved using:

```text
localStorage
```

---

## Persisted State

The frontend now stores:

- session metadata
- uploaded file information
- conversation history
- retrieval context references

This allows users to refresh the browser without losing progress.

---

# API Design

# /api/ingest

## Method

```http
POST
```

## Input

```text
multipart/form-data
```

Field:

```text
file
```

Supported:

- PDF
- TXT

---

## Responsibilities

The route performs:

1. file validation
2. parsing
3. chunking
4. embedding generation
5. vector indexing
6. session creation

---

## Response

```json
{
  "sessionId": "abc123",
  "fileName": "paper.pdf",
  "pages": 12,
  "chunks": 42
}
```

---

# /api/chat

## Method

```http
POST
```

## Input

```json
{
  "sessionId": "abc123",
  "question": "What is this paper about?",
  "history": []
}
```

---

## Responsibilities

The route performs:

1. vector retrieval
2. prompt construction
3. grounded generation
4. citation preparation
5. answer delivery

---

## Response

```json
{
  "answer": "The paper discusses...",
  "citations": [
    {
      "page": 2,
      "snippet": "..."
    }
  ]
}
```

---

# Frontend Experience

The frontend was designed to remain minimal and document-focused.

---

## Current Features

- drag-and-drop uploads
- conversational interface
- citation rendering
- responsive layout
- loading indicators
- error handling
- session persistence
- auto-scrolling chat

---

# Project Structure

```text
app/
  page.js
  layout.js

  api/
    ingest/
      route.js

    chat/
      route.js

lib/
  rag.js
```

---

# Environment Variables

Create:

```text
.env.local
```

Add:

```env
OPENROUTER_API_KEY=your_openrouter_key

QDRANT_URL=https://your-cluster.qdrant.io

QDRANT_API_KEY=your_qdrant_api_key
```

---

# Local Development

# 1. Install Dependencies

```bash
npm install
```

---

# 2. Run Development Server

```bash
npm run dev
```

---

# 3. Open Application

```text
http://localhost:3000
```

---

# Deployment

The project can be deployed directly to Vercel.

---

## Deployment Steps

1. Push repository to GitHub
2. Import repository into Vercel
3. Add environment variables
4. Deploy application

---

# Challenges Faced During Development

## 1. Gemini API Access Issues

Initially, the project used Gemini APIs.

Several issues appeared:

- unsupported model access
- API permission errors
- provider restrictions
- unstable embedding endpoints

The architecture was later migrated to:

- OpenRouter for generation
- local HuggingFace embeddings

which significantly improved stability.

---

## 2. Retrieval Quality

Early retrieval quality was inconsistent because:

- retrieval depth was low
- prompts were too restrictive

Increasing retrieval depth and redesigning the system prompt improved:

- summarization quality
- conversational flow
- contextual synthesis

---

## 3. Session Persistence

Refreshing the page initially cleared:

- document state
- chat history
- retrieval session

This was solved using localStorage persistence.

---

# Future Improvements

Potential upgrades planned for the system:

- URL-based notebook routing
- streaming responses
- hybrid retrieval
- keyword + semantic search
- OCR support
- multi-document chat
- citation highlighting
- PDF preview integration
- memory optimization
- agentic retrieval workflows
- document summarization mode
- collaborative notebooks

---

# Learning Outcomes

This project provided hands-on experience with:

- Retrieval-Augmented Generation
- vector databases
- semantic embeddings
- prompt engineering
- LangChain workflows
- production-style GenAI architecture
- conversational AI systems
- grounded response generation
- session persistence design
- scalable retrieval pipelines

---

# Conclusion

NotebookLM Lite demonstrates how modern GenAI systems can move beyond generic chatbot behavior and become document-aware research assistants.

The project combines:

- semantic retrieval
- vector search
- grounded prompting
- conversational interfaces
- persistent context

to create an experience centered around understanding and interacting with knowledge.

Rather than treating the language model as the source of truth, the architecture treats the uploaded document as the primary knowledge source and uses the model as a reasoning and explanation layer on top of retrieved context.

This grounding-first approach significantly improves reliability, explainability, and user trust in generated responses.

