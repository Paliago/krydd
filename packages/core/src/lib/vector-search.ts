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

// Bedrock client - cross-region inference enabled
const bedrock = new BedrockRuntimeClient({ maxAttempts: 3 });
const s3 = new S3Client({});

// Titan Embed Text v2 configuration
const EMBEDDING_MODEL_ID = "amazon.titan-embed-text-v2:0";
const EMBEDDING_DIMENSIONS = 1024;

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
  ingredients: Array<{ name: string }>;
}): Promise<number[]> {
  const text = [
    `Recipe: ${recipe.title}`,
    recipe.description && `Description: ${recipe.description}`,
    `Ingredients: ${recipe.ingredients.map((i) => i.name).join(", ")}`,
  ]
    .filter(Boolean)
    .join(". ");

  return createEmbedding(text);
}

// Store a recipe embedding in S3
export async function storeRecipeEmbedding(
  recipeId: string,
  embedding: number[]
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: Resource.VectorBucket.name,
    Key: `embeddings/${recipeId}.json`,
    Body: JSON.stringify({
      recipeId,
      embedding,
      createdAt: new Date().toISOString(),
    }),
    ContentType: "application/json",
  });

  await s3.send(command);
}

// Get a recipe embedding from S3
export async function getRecipeEmbedding(
  recipeId: string
): Promise<number[] | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: Resource.VectorBucket.name,
      Key: `embeddings/${recipeId}.json`,
    });

    const response = await s3.send(command);
    const body = JSON.parse(
      new TextDecoder().decode(await response.Body?.transformToByteArray())
    );

    return body.embedding || null;
  } catch (error) {
    // If file doesn't exist, return null
    return null;
  }
}

// List all stored embeddings
export async function listRecipeEmbeddings(): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: Resource.VectorBucket.name,
    Prefix: "embeddings/",
  });

  const response = await s3.send(command);

  return (
    response.Contents?.map((item) =>
      item.Key?.replace("embeddings/", "").replace(".json", "")
    ).filter(Boolean) || []
  );
}

// Calculate cosine similarity between two vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
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
