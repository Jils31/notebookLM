import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { QdrantVectorStore } from "@langchain/qdrant";

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;

export function getEmbeddings() {
  return new HuggingFaceTransformersEmbeddings({
    model: "Xenova/all-MiniLM-L6-v2",
  });
}

export function qdrantConfig(collectionName) {
  return {
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
    collectionName,
  };
}

export async function indexDocuments(docs, collectionName) {
  return QdrantVectorStore.fromDocuments(
    docs,
    getEmbeddings(),
    qdrantConfig(collectionName),
  );
}

export async function getRetriever(collectionName, k = 4) {
  const store = await QdrantVectorStore.fromExistingCollection(
    getEmbeddings(),
    qdrantConfig(collectionName),
  );

  return store.asRetriever({ k });
}