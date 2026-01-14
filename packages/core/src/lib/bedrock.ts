import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

// Bedrock client - cross-region inference enabled in eu-central-1 (Frankfurt)
export const bedrock = new BedrockRuntimeClient({
  maxAttempts: 3,
});

// Claude 4.5 Sonnet model ID
export const CLAUDE_4_5_SONNET = "anthropic.claude-sonnet-4-2025-02-19";

// Invoke Claude 4.5 model with a prompt
export async function invokeClaude(
  prompt: string,
  options: {
    modelId?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  } = {}
): Promise<string> {
  const {
    modelId = CLAUDE_4_5_SONNET,
    maxTokens = 4096,
    temperature = 0.7,
    systemPrompt,
  } = options;

  const messages = [{ role: "user", content: prompt }];

  const body: Record<string, unknown> = {
    anthropic_version: "bedrock-2025-02-19",
    max_tokens: maxTokens,
    temperature,
    messages,
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(body),
  });

  const response = await bedrock.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  // Extract the text content from Claude's response
  const content = responseBody.content;
  if (Array.isArray(content)) {
    const textBlock = content.find((block: { type: string }) => block.type === "text");
    return textBlock?.text || "";
  }

  return responseBody.completion || responseBody.text || "";
}

// Invoke Claude with tools (for structured outputs)
export async function invokeClaudeWithTools(
  prompt: string,
  tools: Array<{
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
  }>,
  options: {
    modelId?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  } = {}
): Promise<{
  text: string;
  toolCalls?: Array<{ name: string; input: Record<string, unknown> }>;
}> {
  const {
    modelId = CLAUDE_4_5_SONNET,
    maxTokens = 4096,
    temperature = 0.7,
    systemPrompt,
  } = options;

  const messages = [{ role: "user", content: prompt }];

  const body: Record<string, unknown> = {
    anthropic_version: "bedrock-2025-02-19",
    max_tokens: maxTokens,
    temperature,
    messages,
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    })),
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(body),
  });

  const response = await bedrock.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));

  const content = responseBody.content || [];
  
  let text = "";
  const toolCalls: Array<{ name: string; input: Record<string, unknown> }> = [];

  if (Array.isArray(content)) {
    for (const block of content) {
      if (block.type === "text") {
        text += block.text;
      } else if (block.type === "tool_use") {
        toolCalls.push({
          name: block.name,
          input: block.input,
        });
      }
    }
  }

  return { text, toolCalls };
}

// Generate a recipe suggestion based on ingredients
export async function suggestRecipesFromIngredients(
  ingredients: string[],
  preferences?: {
    cuisine?: string;
    difficulty?: string;
    dietaryRestrictions?: string[];
  }
): Promise<string> {
  const prompt = `Suggest 5 recipes that can be made with these ingredients: ${ingredients.join(", ")}.`;
  
  const systemPrompt = `You are Krydd, a helpful recipe assistant. 
    Provide recipe suggestions with:
    - Recipe name
    - Brief description
    - Key ingredients needed (besides the ones listed)
    - Estimated cooking time
    - Difficulty level
    
    Format as a numbered list with clear sections.`;

  return invokeClaude(prompt, { systemPrompt });
}

// Generate a meal plan for a week
export async function generateWeeklyMealPlan(
  preferences: {
    cuisines?: string[];
    dietaryRestrictions?: string[];
    caloriesPerDay?: number;
    mealsPerDay?: number;
  }
): Promise<string> {
  const prompt = `Generate a weekly meal plan with ${preferences.mealsPerDay || 3} meals per day.
    Preferences:
    - Cuisines: ${preferences.cuisines?.join(", ") || "any"}
    - Dietary restrictions: ${preferences.dietaryRestrictions?.join(", ") || "none"}
    - Target calories: ${preferences.caloriesPerDay || "not specified"} per day`;

  const systemPrompt = `You are Krydd, a meal planning assistant.
    Create a diverse weekly meal plan that:
    - Varies cuisine types throughout the week
    - Considers dietary restrictions
    - Balances nutrition
    - Includes breakfast, lunch, dinner (and snacks if 4+ meals)
    
    Format by day with meal names and brief descriptions.`;

  return invokeClaude(prompt, { systemPrompt });
}

// Provide ingredient substitutions
export async function suggestSubstitutions(
  ingredient: string,
  dietaryRestriction?: string
): Promise<string> {
  const prompt = `Suggest substitutions for "${ingredient}"${dietaryRestriction ? ` for ${dietaryRestriction} diet` : ""}.`;

  const systemPrompt = `You are Krydd, a recipe assistant.
    Provide 3-5 substitution options with:
    - The substitute ingredient
    - Conversion ratio
    - When it works best
    
    Format as a concise list.`;

  return invokeClaude(prompt, { systemPrompt });
}
