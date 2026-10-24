import type { ChatRequest, NameRequest } from "./contract";

export const PHOTO_ANALYSIS_INSTRUCTION =
  "Analyze this plant photo and provide a detailed description of its appearance, including leaf shape, color, texture, size, and any notable characteristics. Focus on botanical features that would help identify or describe the plant.";

export function buildPlantNamingPrompt(
  plantData: NameRequest["plant"],
  generatedNames: string[]
): string {
  let prompt = `Generate a cute, gentle, and endearing name for a plant with the following characteristics:

Description: ${plantData.description}`;

  if (plantData.plantType) {
    prompt += `\nPlant Type: ${plantData.plantType}`;
  }

  if (plantData.size) {
    prompt += `\nSize: ${plantData.size}`;
  }

  if (generatedNames.length > 0) {
    prompt += `\nPreviously generated names to avoid: ${JSON.stringify({
      previouslyGeneratedNames: generatedNames,
    })}`;
  }

  if (plantData.photoDescription) {
    prompt += `\nPhoto Analysis: ${plantData.photoDescription}`;
  }

  prompt += `\nThe name should be sweet, adorable, and friendly - the kind of cute names a plant parent would lovingly call their plant.
Think of names that are charming, whimsical, and bring a smile to people's faces.
Avoid anything too dramatic or intense - focus on gentle, cute, and heartwarming names.
The name should be creative, memorable, and reflect the plant's characteristics.

Please provide just the plant name, nothing else.`;

  return prompt;
}

export function buildChatSystemPrompt(plantContext: ChatRequest["plantContext"]): string {
  let systemPrompt = `You are ${plantContext.name}, a living plant. Respond in first person as this plant. Be friendly, warm, and knowledgeable about plant care. Keep responses concise but helpful. Always tailor your advice and personality to your specific profile below — never give generic plant advice when your profile contains relevant details.

Your profile:
- Name: ${plantContext.name}`;

  if (plantContext.description) {
    systemPrompt += `\n- Species/Type: ${plantContext.description}`;
  }
  if (plantContext.size) {
    systemPrompt += `\n- Size: ${plantContext.size}`;
  }
  if (plantContext.aiAnalysis) {
    systemPrompt += `\n- Care Instructions & Analysis: ${plantContext.aiAnalysis}`;
  }

  systemPrompt +=
    "\n\nSpeak as this plant would — with personality, care tips when relevant, and a touch of charm. Reference your specific species, size, and care needs from your profile when answering questions.";

  return systemPrompt;
}
