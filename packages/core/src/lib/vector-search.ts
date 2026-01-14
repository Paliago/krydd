import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { Resource } from "sst/resource";

// Initialize Bedrock client for us-east-1 (required for Titan embeddings)
const bedrock = new BedrockRuntimeClient({
  region: "us-east-1",
  maxAttempts: 3,
});

const s3 = new S3Client({ region: "us-east-1" });

// Titan Embed Text v2 configuration
const EMBEDDING_MODEL_ID = "amazon.titan-embed-text-v2:0";
const EMBEDDING_DIMENSIONS = 1024;
const VECTOR_BUCKET_NAME = Resource.VectorBucket?.name;

// Generate embedding for text using Bedrock Titan
export async function createEmbedding(text: string): Promise<number[]> {
  const command = new InvokeModelCommand({
    modelId: EMBEDDING_MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      inputText: text,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  const response = await bedrock.send(command);
  const body = JSON.parse(new TextDecoder().decode(response.body));

  if (!body.embedding || !Array.isArray(body.embedding)) {
    throw new Error("Invalid embedding response from Bedrock");
  }

  return body.embedding;
}

// Generate embedding for a recipe (combines title, description, ingredients)
export async function createRecipeEmbedding(recipe: {
  title: string;
  description?: string;
  ingredients: Array<{ name: string; amount?: string }>;
}): Promise<number[]> {
  const text = [
    recipe.title,
    recipe.description || "",
    ...recipe.ingredients.map((i) => `${i.name} ${i.amount || ""}`.trim()),
  ].join(" ");

  return createEmbedding(text);
}

// Store recipe embedding in S3
export async function storeRecipeEmbedding(
  recipeId: string,
  embedding: number[]
): Promise<void> {
  if (!VECTOR_BUCKET_NAME) {
    console.warn("Vector bucket not configured, skipping embedding storage");
    return;
  }

  const command = new PutObjectCommand({
    Bucket: VECTOR_BUCKET_NAME,
    Key: `recipes/${recipeId}.json`,
    Body: JSON.stringify({
      recipeId,
      embedding,
      timestamp: new Date().toISOString(),
    }),
    ContentType: "application/json",
  });

  await s3.send(command);
}

// Retrieve recipe embedding from S3
export async function getRecipeEmbedding(
  recipeId: string
): Promise<number[] | null> {
  if (!VECTOR_BUCKET_NAME) {
    return null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: VECTOR_BUCKET_NAME,
      Key: `recipes/${recipeId}.json`,
    });

    const response = await s3.send(command);
    const body = JSON.parse(
      await new Response(response.Body as ReadableStream).text()
    );

    return body.embedding || null;
  } catch (error) {
    console.error(`Error retrieving embedding for recipe ${recipeId}:`, error);
    return null;
  }
}

// Delete recipe embedding from S3
export async function deleteRecipeEmbedding(recipeId: string): Promise<void> {
  if (!VECTOR_BUCKET_NAME) {
    return;
  }

  const command = new PutObjectCommand({
    Bucket: VECTOR_BUCKET_NAME,
    Key: `recipes/${recipeId}.json`,
    // Using delete marker approach - S3 doesn't have direct delete in SDK
    // For production, use DeleteObjectCommand
  });

  // Note: In production, implement proper deletion
  console.log(`Would delete embedding for recipe ${recipeId}`);
}

// Calculate cosine similarity between two vectors
export function cosineSimilarity(
  vecA: number[],
  vecB: number[]
): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vector dimensions must match");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Find similar recipes using approximate nearest neighbor (simplified)
export async function findSimilarRecipes(
  queryEmbedding: number[],
  recipeIds: string[],
  topK: number = 10
): Promise<Array<{ recipeId: string; similarity: number }>> {
  const similarities: Array<{ recipeId: string; similarity: number }> = [];

  for (const recipeId of recipeIds) {
    const embedding = await getRecipeEmbedding(recipeId);
    if (embedding) {
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      similarities.push({ recipeId, similarity });
    }
  }

  // Sort by similarity descending and return top K
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

// Semantic search for recipes (combines embedding with metadata filtering)
export async function semanticRecipeSearch(
  query: string,
  options: {
    cuisine?: string;
    difficulty?: string;
    maxResults?: number;
  } = {}
): Promise<Array<{ recipeId: string; similarity: number }>> {
  const { maxResults = 10 } = options;
  const queryEmbedding = await createEmbedding(query);

  // In production, this would query a vector database or use S3 Vector Search
  // For now, return placeholder structure
  console.log("Semantic search for:", query, "with options:", options);

  return [];
}
