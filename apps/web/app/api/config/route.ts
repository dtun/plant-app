import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get environment variables
  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const provider = process.env.NEXT_PUBLIC_PROVIDER;

  // Check if environment variables are set
  if (!apiKey || !provider) {
    return NextResponse.json(
      {
        error: "Missing environment variables",
        details: "NEXT_PUBLIC_API_KEY and NEXT_PUBLIC_PROVIDER must be set",
      },
      { status: 500 }
    );
  }

  // Return the configuration
  const response = NextResponse.json({
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
  const response = new NextResponse(null, { status: 204 });

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");

  return response;
}
