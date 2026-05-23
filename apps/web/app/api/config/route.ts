import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  let apiKey = process.env.NEXT_PUBLIC_API_KEY;
  // Default to Anthropic — claude-haiku for text and claude-sonnet for vision
  // are ~95% cheaper than gpt-4o while providing equivalent quality for plant care.
  let provider = process.env.NEXT_PUBLIC_PROVIDER ?? "Anthropic";

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Missing environment variable",
        details: "NEXT_PUBLIC_API_KEY must be set",
      },
      { status: 500 }
    );
  }

  let response = NextResponse.json({
    apiKey,
    provider,
  });

  // Add CORS headers to allow mobile app requests
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");

  return response;
}

// Handle preflight OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  let response = new NextResponse(null, { status: 204 });

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");

  return response;
}
