"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [session, setSession] = useState(null); // { sessionId, fileName, pages, chunks }
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [messages, setMessages] = useState([]); // { role, content, citations? }
  const [input, setInput] = useState("");
  const [asking, setAsking] = useState(false);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, asking]);

  useEffect(() => {
  const savedSession = localStorage.getItem("notebook-session");

  if (savedSession) {
    setSession(JSON.parse(savedSession));
  }

  const savedMessages = localStorage.getItem("notebook-messages");

  if (savedMessages) {
    setMessages(JSON.parse(savedMessages));
  }
}, []);

useEffect(() => {
  if (session) {
    localStorage.setItem(
      "notebook-session",
      JSON.stringify(session)
    );
  }
}, [session]);

useEffect(() => {
  localStorage.setItem(
    "notebook-messages",
    JSON.stringify(messages)
  );
}, [messages]);

  async function handleUpload(file) {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    setMessages([]);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ingest", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setSession(data);
    } catch (err) {
      setUploadError(err.message);
      setSession(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleAsk(e) {
    e.preventDefault();
    const q = input.trim();
    if (!q || !session || asking) return;
    setInput("");
    const next = [...messages, { role: "user", content: q }];
    setMessages(next);
    setAsking(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.sessionId,
          question: q,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get answer");
      setMessages([
        ...next,
        {
          role: "assistant",
          content: data.answer,
          citations: data.citations,
          rag: data.rag,
        },
      ]);
    } catch (err) {
      setMessages([
        ...next,
        { role: "assistant", content: `Error: ${err.message}`, error: true },
      ]);
    } finally {
      setAsking(false);
    }
  }

function reset() {
  setSession(null);
  setMessages([]);
  setUploadError("");

  localStorage.removeItem("notebook-session");
  localStorage.removeItem("notebook-messages");

  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }
}

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">NotebookLM Lite</h1>
          <p className="text-xs text-zinc-500">RAG-powered Q&A grounded in your document</p>
        </div>
        {session && (
          <button
            onClick={reset}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline"
          >
            Upload a different document
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-6">
        {!session ? (
          <UploadPanel
            uploading={uploading}
            error={uploadError}
            onUpload={handleUpload}
            inputRef={fileInputRef}
          />
        ) : (
          <>
            <SessionBanner session={session} />
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto space-y-4 py-4"
            >
              {messages.length === 0 && <EmptyChatHint fileName={session.fileName} />}
              {messages.map((m, i) => (
                <Message key={i} message={m} />
              ))}
              {asking && (
                <div className="text-sm text-zinc-500 italic">Thinking…</div>
              )}
            </div>
            <form
              onSubmit={handleAsk}
              className="flex gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your document…"
                className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={asking}
              />
              <button
                type="submit"
                disabled={asking || !input.trim()}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white text-sm font-medium px-4 py-2"
              >
                Ask
              </button>
            </form>
          </>
        )}
      </main>

      <footer className="text-center text-xs text-zinc-400 py-4">
        Built with Next.js · OpenAI · Qdrant
      </footer>
    </div>
  );
}

function UploadPanel({ uploading, error, onUpload, inputRef }) {
  const [dragActive, setDragActive] = useState(false);
  return (
    <div className="flex-1 flex items-center justify-center">
      <div
        className={`w-full max-w-lg rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onUpload(file);
        }}
      >
        <h2 className="text-xl font-semibold mb-2">Upload a document</h2>
        <p className="text-sm text-zinc-500 mb-6">
          Drop a PDF or .txt file here, or click below. Up to 15&nbsp;MB.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          className="hidden"
          onChange={(e) => onUpload(e.target.files?.[0])}
          disabled={uploading}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white text-sm font-medium px-5 py-2.5"
        >
          {uploading ? "Indexing… this can take ~30s" : "Choose file"}
        </button>
        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}

function SessionBanner({ session }) {
  return (
    <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm flex items-center justify-between">
      <div className="truncate">
        <span className="font-medium">{session.fileName}</span>
        <span className="text-zinc-500 ml-2">
          {session.pages} {session.pages === 1 ? "page" : "pages"} · {session.chunks} chunks
        </span>
      </div>
    </div>
  );
}

function EmptyChatHint({ fileName }) {
  return (
    <div className="text-sm text-zinc-500 py-8 text-center">
      Ask a question about <span className="font-medium">{fileName}</span> to get started.
    </div>
  );
}

function Message({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
          isUser
            ? "bg-blue-600 text-white"
            : message.error
            ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900"
            : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
        }`}
      >
        <div>{message.content}</div>
        {!isUser && message.rag && <RagBadges rag={message.rag} />}
        {!isUser && message.citations?.length > 0 && (
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
              Sources ({message.citations.length})
            </summary>
            <div className="mt-2 space-y-2">
              {message.citations.map((c, i) => (
                <div
                  key={i}
                  className="rounded-md bg-zinc-50 dark:bg-zinc-800 p-2 border border-zinc-200 dark:border-zinc-700"
                >
                  <div className="text-zinc-500 mb-1">
                    Page {c.page ?? "?"}
                  </div>
                  <div className="text-zinc-700 dark:text-zinc-300 line-clamp-3">
                    {c.snippet}…
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

function RagBadges({ rag }) {
  const rewritten =
    rag.rewrittenQuery &&
    rag.originalQuery &&
    rag.rewrittenQuery.trim().toLowerCase() !==
      rag.originalQuery.trim().toLowerCase();

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
      {rewritten && (
        <span
          className="rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-0.5"
          title={`Original: ${rag.originalQuery}`}
        >
          rewritten → “{rag.rewrittenQuery}”
        </span>
      )}
      {Array.isArray(rag.variants) && rag.variants.length > 0 && (
        <span
          className="rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5"
          title={rag.variants.join(" · ")}
        >
          +{rag.variants.length} query variants
        </span>
      )}
      {typeof rag.retrieved === "number" && (
        <span className="rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5">
          judge kept {rag.kept}/{rag.retrieved} chunks
        </span>
      )}
    </div>
  );
}
