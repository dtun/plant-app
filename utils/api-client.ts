import { getDeviceId } from "./device-id";

const API_BASE_URL = "https://www.keeptend.com/api";

type AIProvider = "openai" | "anthropic";

interface PlantAnalysisResult {
  species: string;
  commonName?: string;
  confidence: number;
  careInstructions?: string;
}

interface PlantNameResult {
  names: string[];
}

interface APIResponse<T> {
  result: T;
  remaining?: number;
  isPremium: boolean;
}

interface APIError {
  error: string;
  remaining?: number;
  upgradeRequired?: boolean;
  resetDate?: string;
}

export interface QuotaResponse {
  remaining?: number;
  limit?: number;
  resetDate?: string;
  isPremium: boolean;
}

export async function analyzePhoto(
  provider: AIProvider,
  imageBase64: string,
  prompt: string
): Promise<APIResponse<PlantAnalysisResult>> {
  const deviceId = await getDeviceId();

  const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-ID": deviceId,
    },
    body: JSON.stringify({
      provider,
      image: imageBase64,
      prompt,
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as APIError;
    const error = new Error(errorData.error || `HTTP ${response.status}`);
    Object.assign(error, errorData); // Attach error details
    throw error;
  }

  const data = (await response.json()) as APIResponse<PlantAnalysisResult>;
  return data;
}

export async function generatePlantNameAPI(
  provider: AIProvider,
  species: string,
  characteristics: string,
  style: string
): Promise<APIResponse<PlantNameResult>> {
  const deviceId = await getDeviceId();

  const response = await fetch(`${API_BASE_URL}/ai/generate-name`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-ID": deviceId,
    },
    body: JSON.stringify({
      provider,
      species,
      characteristics,
      style,
    }),
  });

  if (!response.ok) {
    const errorData = (await response.json()) as APIError;
    const error = new Error(errorData.error || `HTTP ${response.status}`);
    Object.assign(error, errorData);
    throw error;
  }

  const data = (await response.json()) as APIResponse<PlantNameResult>;
  return data;
}

export async function checkQuota(): Promise<QuotaResponse> {
  const deviceId = await getDeviceId();

  const response = await fetch(`${API_BASE_URL}/user/quota`, {
    method: "GET",
    headers: {
      "X-Device-ID": deviceId,
    },
  });

  if (!response.ok) {
    const errorData = (await response.json()) as APIError;
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  const data = (await response.json()) as QuotaResponse;
  return data;
}
