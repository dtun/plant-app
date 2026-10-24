import { getAIHandlers } from "@/src/ai/server-deps";

export async function POST(request: Request) {
  return getAIHandlers().chat(request);
}
