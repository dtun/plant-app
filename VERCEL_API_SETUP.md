# KeepTend Vercel API Setup Guide

## Overview

This document outlines the implementation plan for the KeepTend serverless API hosted on Vercel. The API provides AI-powered plant identification and name generation with device-based rate limiting and optional premium tier support.

**Domain**: `keeptend.com`
**API Base URL**: `https://api.keeptend.com` or `https://keeptend.com/api`

---

## Architecture

### Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Hosting**: Vercel Edge Functions
- **Rate Limiting**: Vercel KV (Redis) + `@upstash/ratelimit`
- **Database**: Vercel Postgres (optional, for analytics)
- **AI Providers**: OpenAI API, Anthropic API

### Core Features

1. Anonymous device-based authentication
2. Rate limiting (free tier)
3. Premium tier via in-app purchase receipt validation
4. AI provider proxying (OpenAI, Anthropic)
5. Usage tracking and analytics

---

## API Endpoints

### `POST /api/ai/analyze`

Analyzes plant photos using vision-capable AI models.

**Request:**
```json
{
  "provider": "openai" | "anthropic",
  "image": "base64_encoded_image_data",
  "prompt": "Identify this plant and provide care instructions"
}
```

**Headers:**
```
X-Device-ID: <uuid>
X-Receipt: <base64_receipt> (optional, for premium users)
```

**Response (Success):**
```json
{
  "result": {
    "species": "Monstera deliciosa",
    "commonName": "Swiss Cheese Plant",
    "careInstructions": "...",
    "confidence": 0.95
  },
  "remaining": 8,
  "isPremium": false
}
```

**Response (Rate Limited):**
```json
{
  "error": "Free limit reached",
  "remaining": 0,
  "upgradeRequired": true,
  "resetDate": "2025-11-07T00:00:00Z"
}
```
Status: `402 Payment Required`

---

### `POST /api/ai/generate-name`

Generates creative plant names using lightweight AI models.

**Request:**
```json
{
  "provider": "openai" | "anthropic",
  "species": "Monstera deliciosa",
  "characteristics": "large leaves, variegated",
  "style": "whimsical" | "classic" | "punny"
}
```

**Headers:**
```
X-Device-ID: <uuid>
X-Receipt: <base64_receipt> (optional)
```

**Response:**
```json
{
  "result": {
    "names": [
      "Montague the Magnificent",
      "Cheese Louise",
      "Sir Splits-a-Lot"
    ]
  },
  "remaining": 7,
  "isPremium": false
}
```

---

### `GET /api/user/quota`

Check remaining quota for device.

**Headers:**
```
X-Device-ID: <uuid>
```

**Response:**
```json
{
  "remaining": 8,
  "limit": 10,
  "resetDate": "2025-11-07T00:00:00Z",
  "isPremium": false
}
```

---

### `POST /api/premium/validate`

Validate in-app purchase receipt and unlock premium.

**Request:**
```json
{
  "receipt": "base64_encoded_receipt_data",
  "platform": "ios" | "android"
}
```

**Headers:**
```
X-Device-ID: <uuid>
```

**Response:**
```json
{
  "valid": true,
  "isPremium": true,
  "expiryDate": "2026-10-07T00:00:00Z" // for subscriptions
}
```

---

## Implementation Details

### 1. Project Setup

```bash
# Create Next.js project
npx create-next-app@latest keeptend-api --app --typescript

# Install dependencies
npm install @upstash/ratelimit @vercel/kv ai openai @anthropic-ai/sdk
npm install @apple/app-store-server-api google-play-billing-validator
```

### 2. Environment Variables

Create `.env.local`:

```env
# AI Provider Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Vercel KV (auto-populated by Vercel)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# Apple/Google IAP Validation
APPLE_SHARED_SECRET=...
GOOGLE_SERVICE_ACCOUNT_KEY=...

# App Security
APP_SECRET=<random_string_for_request_signing>

# Rate Limits (requests per period)
FREE_TIER_LIMIT=10
FREE_TIER_WINDOW=30d
```

### 3. Rate Limiting Implementation

**`lib/ratelimit.ts`:**
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";

export const freeTierLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(
    parseInt(process.env.FREE_TIER_LIMIT || "10"),
    process.env.FREE_TIER_WINDOW || "30 d"
  ),
  analytics: true,
  prefix: "ratelimit:free",
});

export async function checkPremiumStatus(deviceId: string): Promise<boolean> {
  const premium = await kv.get<boolean>(`premium:${deviceId}`);
  return premium || false;
}

export async function setPremiumStatus(
  deviceId: string,
  expiryTimestamp?: number
): Promise<void> {
  if (expiryTimestamp) {
    const ttl = Math.floor((expiryTimestamp - Date.now()) / 1000);
    await kv.set(`premium:${deviceId}`, true, { ex: ttl });
  } else {
    // Lifetime premium (1 year cache, renewable)
    await kv.set(`premium:${deviceId}`, true, { ex: 31536000 });
  }
}
```

### 4. Receipt Validation

**`lib/receipt-validation.ts`:**
```typescript
import { verifyReceipt as verifyAppleReceipt } from "@apple/app-store-server-api";
import { GooglePlayValidator } from "google-play-billing-validator";

export async function validateReceipt(
  receipt: string,
  platform: "ios" | "android"
): Promise<{ valid: boolean; expiryDate?: string }> {
  if (platform === "ios") {
    // Apple receipt validation
    const result = await verifyAppleReceipt({
      receipt,
      password: process.env.APPLE_SHARED_SECRET!,
      production: true,
    });

    if (result.status === 0) {
      // Check for active subscription or lifetime purchase
      const latestReceipt = result.latest_receipt_info?.[0];
      return {
        valid: true,
        expiryDate: latestReceipt?.expires_date,
      };
    }
  } else {
    // Google Play receipt validation
    const validator = new GooglePlayValidator({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY!,
    });

    const receiptData = JSON.parse(
      Buffer.from(receipt, "base64").toString()
    );

    const result = await validator.verifyINAPP(receiptData);
    return {
      valid: result.isSuccessful,
      expiryDate: result.expiryTimeMillis
        ? new Date(parseInt(result.expiryTimeMillis)).toISOString()
        : undefined,
    };
  }

  return { valid: false };
}
```

### 5. AI Provider Proxy

**`lib/ai-service.ts`:**
```typescript
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function analyzePlant(
  provider: "openai" | "anthropic",
  imageBase64: string,
  prompt: string
) {
  const model =
    provider === "openai"
      ? openai("gpt-4o")
      : anthropic("claude-3-5-sonnet-20241022");

  const result = await generateText({
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image", image: imageBase64 },
        ],
      },
    ],
  });

  return result.text;
}

export async function generatePlantName(
  provider: "openai" | "anthropic",
  species: string,
  characteristics: string,
  style: string
) {
  const model =
    provider === "openai"
      ? openai("gpt-4o-mini")
      : anthropic("claude-3-haiku-20240307");

  const prompt = `Generate 3 creative ${style} names for a ${species} plant with these characteristics: ${characteristics}. Return as JSON array of strings.`;

  const result = await generateText({
    model,
    messages: [{ role: "user", content: prompt }],
  });

  return JSON.parse(result.text);
}
```

### 6. API Route Implementation

**`app/api/ai/analyze/route.ts`:**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { freeTierLimit, checkPremiumStatus, setPremiumStatus } from "@/lib/ratelimit";
import { validateReceipt } from "@/lib/receipt-validation";
import { analyzePlant } from "@/lib/ai-service";

export async function POST(request: NextRequest) {
  try {
    // Extract headers
    const deviceId = request.headers.get("X-Device-ID");
    const receipt = request.headers.get("X-Receipt");

    if (!deviceId) {
      return NextResponse.json(
        { error: "Device ID required" },
        { status: 400 }
      );
    }

    // Check premium status
    let isPremium = await checkPremiumStatus(deviceId);

    // Validate receipt if provided
    if (receipt && !isPremium) {
      const body = await request.json();
      const platform = body.platform || "ios";
      const validation = await validateReceipt(receipt, platform);

      if (validation.valid) {
        const expiryTimestamp = validation.expiryDate
          ? new Date(validation.expiryDate).getTime()
          : undefined;
        await setPremiumStatus(deviceId, expiryTimestamp);
        isPremium = true;
      }
    }

    // Rate limiting for free tier
    if (!isPremium) {
      const { success, remaining, reset } = await freeTierLimit.limit(
        `free:${deviceId}`
      );

      if (!success) {
        return NextResponse.json(
          {
            error: "Free limit reached",
            remaining: 0,
            upgradeRequired: true,
            resetDate: new Date(reset).toISOString(),
          },
          { status: 402 }
        );
      }

      // Return remaining quota in response
      const body = await request.json();
      const result = await analyzePlant(
        body.provider,
        body.image,
        body.prompt
      );

      return NextResponse.json({
        result: JSON.parse(result),
        remaining,
        isPremium: false,
      });
    }

    // Premium: no limits
    const body = await request.json();
    const result = await analyzePlant(body.provider, body.image, body.prompt);

    return NextResponse.json({
      result: JSON.parse(result),
      isPremium: true,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

Similar implementations for:
- `app/api/ai/generate-name/route.ts`
- `app/api/user/quota/route.ts`
- `app/api/premium/validate/route.ts`

---

## Deployment

### Vercel Setup

1. **Create Vercel project**: Connect GitHub repo
2. **Add domain**: `api.keeptend.com` → Vercel project
3. **Add KV Storage**: Dashboard → Storage → Create KV
4. **Set environment variables**: All keys from `.env.local`
5. **Deploy**: `vercel --prod`

### Domain Configuration

**Option A: Subdomain**
```
api.keeptend.com → Vercel project
```

**Option B: Path**
```
keeptend.com/api/* → Vercel project (rewrite rule)
```

### Security

- Enable Vercel firewall
- Set spending limits in dashboard
- Monitor usage analytics
- Enable CORS for app domain only:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && !origin.includes("keeptend.com")) {
    return new NextResponse(null, { status: 403 });
  }
}
```

---

## Freemium Model

### Tier Structure

| Tier | Limit | Price |
|------|-------|-------|
| Free | 10 AI requests/month | $0 |
| Premium | Unlimited | $4.99 one-time |

### Alternative: Subscription

- **Monthly**: $0.99/month
- **Yearly**: $9.99/year (2 months free)

### Premium Features (Future)

- Unlimited AI analyses
- Priority support
- Plant care reminders (push notifications)
- Multi-device sync (requires accounts)

---

## Analytics & Monitoring

### Metrics to Track

1. **Usage**:
   - Total API requests
   - Requests by tier (free vs. premium)
   - Provider distribution (OpenAI vs. Anthropic)

2. **Conversion**:
   - Free users hitting limits
   - Premium conversion rate
   - Churn rate

3. **Performance**:
   - API latency (p50, p95, p99)
   - Error rates
   - AI provider costs

### Implementation

**Vercel Analytics**: Built-in
**Custom Events**: Vercel KV for storage

```typescript
// Track usage
await kv.hincrby("analytics:daily", new Date().toISOString().split("T")[0], 1);
await kv.hincrby("analytics:provider", provider, 1);
```

---

## Cost Estimation

### Vercel Costs

- **Hobby Plan**: $0 (up to 100GB bandwidth)
- **Pro Plan**: $20/month (includes KV, more bandwidth)

### AI Costs (per 1000 requests)

- **GPT-4o Vision**: ~$5-10 (depends on image size)
- **GPT-4o-mini**: ~$0.15
- **Claude-3.5-Sonnet**: ~$3
- **Claude-3-Haiku**: ~$0.25

### Break-even Analysis

At 1000 free users (10 requests/month each):
- 10,000 requests/month
- ~$50-100 AI costs
- Need ~10-20 premium purchases/month to break even

---

## Mobile App Integration

### Changes Required in Plant App

1. **Add Device ID Generation**:
   ```typescript
   import * as Application from 'expo-application';
   import AsyncStorage from '@react-native-async-storage/async-storage';

   async function getDeviceId() {
     let deviceId = await AsyncStorage.getItem('deviceId');
     if (!deviceId) {
       deviceId = Application.androidId || await Application.getIosIdForVendorAsync();
       await AsyncStorage.setItem('deviceId', deviceId);
     }
     return deviceId;
   }
   ```

2. **Update AI Service Client**:
   ```typescript
   // services/ai-service.ts
   const API_BASE_URL = 'https://api.keeptend.com';

   async function analyzePhoto(imageUri: string, provider: string) {
     const deviceId = await getDeviceId();
     const receipt = await AsyncStorage.getItem('premiumReceipt');

     const response = await fetch(`${API_BASE_URL}/api/ai/analyze`, {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'X-Device-ID': deviceId,
         ...(receipt && { 'X-Receipt': receipt }),
       },
       body: JSON.stringify({
         provider,
         image: imageBase64,
         prompt: 'Identify this plant...',
       }),
     });

     if (response.status === 402) {
       // Show paywall
       showUpgradeModal();
       return null;
     }

     const data = await response.json();
     return data.result;
   }
   ```

3. **Add In-App Purchases**:
   ```bash
   npx expo install expo-store-review expo-in-app-purchases
   ```

4. **Implement Paywall UI**: Modal showing benefits and purchase button

5. **Remove Local API Keys**: Delete localStorage API key management

---

## Testing Plan

### Local Development

```bash
# Use Vercel CLI for local testing with KV
vercel dev
```

### Test Cases

1. **Free tier limits**: Make 11 requests, expect 402 on 11th
2. **Premium unlock**: Submit valid receipt, verify unlimited access
3. **Rate limit reset**: Wait 30 days or manually reset KV key
4. **Provider failover**: Test OpenAI and Anthropic
5. **Invalid receipts**: Expect rejection
6. **Missing headers**: Expect 400 errors

---

## Launch Checklist

- [ ] Vercel project created and deployed
- [ ] Domain `api.keeptend.com` configured
- [ ] Environment variables set
- [ ] KV storage provisioned
- [ ] Rate limiting tested
- [ ] Receipt validation working (iOS + Android)
- [ ] AI providers responding correctly
- [ ] Error handling and logging
- [ ] CORS configured
- [ ] Spending limits set
- [ ] Mobile app updated with new API client
- [ ] TestFlight build submitted
- [ ] Analytics dashboard monitoring

---

## Future Enhancements

1. **User Accounts**: Optional email login for multi-device sync
2. **Webhooks**: Real-time notifications for subscriptions
3. **Admin Dashboard**: Monitor usage, ban abusive devices
4. **GraphQL API**: More efficient data fetching
5. **Caching**: Cache common plant identifications
6. **Image Optimization**: Compress images before AI processing
7. **A/B Testing**: Test different pricing tiers

---

## Support & Maintenance

- **Monitor Vercel dashboard** daily for errors/anomalies
- **Review costs** weekly (AI provider bills)
- **Update dependencies** monthly
- **Backup KV data** (premium user list) weekly

---

## Contact

For questions or issues with this setup, contact the development team.
