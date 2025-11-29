# In-App Purchase Implementation Guide

## Overview

This guide explains how to add Apple Pay / Google Pay purchases to your app so users can upgrade to premium.

**You don't deal with credit cards directly** - Apple and Google handle all payment processing.

---

## 📱 How It Works (User Perspective)

1. User hits their free limit (10 requests)
2. Paywall modal appears: "Upgrade for $4.99"
3. User taps "Upgrade Now"
4. **Apple Payment Sheet** appears (Face ID / Touch ID)
5. User confirms with Apple Pay (or saved card)
6. Payment succeeds → Receipt generated
7. Your app validates receipt with backend
8. Backend grants premium access
9. User now has unlimited requests ✅

**Payment Methods Supported:**
- Apple Pay
- Credit/debit cards saved to Apple ID
- Apple Account balance

---

## 🏗️ Implementation Steps

### Step 1: App Store Connect Setup (15 minutes)

#### Create Product

1. Go to https://appstoreconnect.apple.com
2. **Apps** → **KeepTend** → **In-App Purchases**
3. Click **+** to create new product
4. Choose **Non-Consumable** (one-time purchase, permanent)
5. Fill in:

```
Product ID: com.paperstreetapp.keeptend.premium
Reference Name: Premium Unlock
Price: Tier 5 ($4.99)

Display Name (English):
  Premium Access

Description (English):
  Unlock unlimited AI plant analysis and name generation. One-time purchase, yours forever.
```

6. Add screenshot (can be simple text graphic)
7. Click **Save**
8. **Submit for Review** (Apple must approve it)

#### Get Shared Secret

1. Still in App Store Connect
2. **Apps** → **KeepTend** → **In-App Purchases**
3. Click **App-Specific Shared Secret**
4. Click **Generate**
5. **Copy this secret** - you'll need it for backend

---

### Step 2: Mobile App Setup (30 minutes)

#### Install Dependencies

```bash
cd /Users/dtun/Developer/plant-app
npm install react-native-iap
```

#### Initialize IAP in App

In your root layout or App.tsx:

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { iapService } from '@/utils/iap';

export default function RootLayout() {
  useEffect(() => {
    // Initialize IAP when app starts
    iapService.initialize();

    return () => {
      // Cleanup when app closes
      iapService.disconnect();
    };
  }, []);

  return (
    // ... your existing layout
  );
}
```

#### Use IAP Paywall Modal

Replace the old paywall with the new one:

```typescript
// In your component that shows the paywall
import PaywallModalWithIAP from '@/components/paywall-modal-with-iap';

const [showPaywall, setShowPaywall] = useState(false);
const [isPremium, setIsPremium] = useState(false);

// Check if user already has premium
useEffect(() => {
  iapService.hasPremium().then(setIsPremium);
}, []);

// When API returns 402 (rate limited)
const handlePhotoAnalysis = async () => {
  try {
    const result = await analyzePhoto('openai', image, prompt);
  } catch (error: any) {
    if (error.message.includes('Free limit reached')) {
      setShowPaywall(true);
    }
  }
};

return (
  <>
    {/* Your UI */}

    <PaywallModalWithIAP
      visible={showPaywall}
      onClose={() => setShowPaywall(false)}
      onSuccess={() => {
        setIsPremium(true);
        // Refresh quota, etc.
      }}
    />
  </>
);
```

---

### Step 3: Backend Setup (10 minutes)

#### Add Apple Shared Secret to Vercel

1. Go to Vercel dashboard
2. **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `APPLE_SHARED_SECRET`
   - **Value**: The secret you copied from App Store Connect
   - **Environments**: Production, Preview, Development
4. Click **Save**
5. **Redeploy** your app

The backend is already set up! The validation code is in:
- `lib/receipt-validation.ts` - Validates with Apple
- `app/api/premium/validate/route.ts` - Grants premium access

---

### Step 4: Testing (Before Launch)

#### Test in Sandbox Mode

1. **Create Sandbox Tester**:
   - App Store Connect → **Users and Access** → **Sandbox Testers**
   - Click **+** and create test account
   - Use fake email: `test@example.com`

2. **Sign Out of Real Apple ID on Device**:
   - Settings → App Store → Sign Out

3. **Run Your App**:
   ```bash
   npx expo run:ios
   ```

4. **Trigger Paywall**:
   - Make 10+ AI requests
   - Paywall should appear

5. **Test Purchase**:
   - Tap "Upgrade Now"
   - Apple payment sheet appears
   - Sign in with **sandbox tester email**
   - **No real money charged!**
   - Confirm purchase

6. **Verify**:
   - Should say "Premium unlocked!"
   - Make another AI request (should work, no limit)
   - Check Vercel KV dashboard - should see `premium:device-123 = true`

#### Test Restore Purchases

1. Delete app
2. Reinstall
3. Make 10+ requests (hit limit)
4. Tap "Restore Purchases"
5. Should unlock premium again

---

### Step 5: Production Launch

#### Submit App for Review

When you submit your app to App Store review:

1. Include test instructions:
   ```
   To test premium purchase:
   1. Make 10 AI requests (analyze plants or generate names)
   2. On 11th request, paywall appears
   3. Tap "Upgrade Now"
   4. Use sandbox tester account: test@example.com
   5. Confirm purchase
   6. Premium should unlock
   ```

2. Apple will verify:
   - IAP integration works correctly
   - Purchase flow is smooth
   - Receipt validation works
   - "Restore Purchases" works

#### After Approval

1. Your IAP product goes live
2. Real users can purchase with real money
3. You get paid: Apple takes 30%, you get 70%
   - $4.99 purchase = $3.49 to you

---

## 💰 Revenue & Payout

### How You Get Paid

1. Users purchase premium
2. Money goes to **Apple first**
3. Apple holds for ~60 days (refund window)
4. Apple pays you monthly
5. **Setup required**: Bank account in App Store Connect

### Setup Bank Account

1. App Store Connect → **Agreements, Tax, and Banking**
2. **Banking** → Add your bank details
3. **Tax Forms** → Fill out W-9 (US) or equivalent
4. Wait for Apple approval (~1-2 weeks)

### Tracking Revenue

App Store Connect shows:
- Total sales
- Number of purchases
- Revenue by country
- Daily/weekly/monthly trends

---

## 🧪 Testing Checklist

Before launching:

- [ ] Sandbox purchase works
- [ ] Receipt validation succeeds
- [ ] Premium access granted in backend
- [ ] Unlimited API requests work
- [ ] "Restore Purchases" works
- [ ] User can purchase on multiple devices
- [ ] Analytics track purchases
- [ ] Apple payment sheet appears correctly
- [ ] Error handling works (user cancels, payment fails)
- [ ] Sandbox tester account created

---

## 🐛 Common Issues & Solutions

### "Cannot connect to iTunes Store"
**Fix:** Make sure you're signed out of real Apple ID, signed in with sandbox tester

### "Product not found"
**Fix:**
1. Wait 2-24 hours after creating product in App Store Connect
2. Make sure Product ID matches exactly
3. Verify product is approved

### Payment succeeds but premium not granted
**Fix:**
1. Check Vercel logs for validation errors
2. Verify `APPLE_SHARED_SECRET` is set correctly
3. Check receipt format is correct

### "This is not a test user account"
**Fix:** You're using a real Apple ID. Must use sandbox tester account for testing.

---

## 📊 Advanced: Subscription Model (Optional)

If you want monthly/yearly subscriptions instead:

### Changes Needed:

1. **App Store Connect**:
   - Create **Auto-Renewable Subscription** instead of Non-Consumable
   - Choose duration: Monthly ($0.99) or Yearly ($9.99)

2. **Mobile App**:
   - Same code works! Just different product ID
   - Subscriptions auto-renew until canceled

3. **Backend**:
   - Use `expiryDate` from validation
   - Set premium status with expiry timestamp
   - Premium expires automatically after `expiryDate`

4. **Webhooks** (Advanced):
   - Apple sends notifications when subscription renews/cancels
   - Update backend accordingly

---

## 🎯 Summary

1. **App Store Connect**: Create product, get shared secret (15 min)
2. **Mobile App**: Use `iapService` and `PaywallModalWithIAP` (30 min)
3. **Backend**: Add `APPLE_SHARED_SECRET` to Vercel (5 min)
4. **Testing**: Sandbox purchase flow (20 min)
5. **Launch**: Submit to App Store review

**Total time**: ~2 hours to implement fully

**The code is already written** - you just need to configure App Store Connect and test!

---

## Need Help?

- Apple IAP Documentation: https://developer.apple.com/in-app-purchase/
- react-native-iap Docs: https://react-native-iap.dooboolab.com/
- Expo IAP Guide: https://docs.expo.dev/guides/in-app-purchases/

---

## Example Revenue Math

**Scenario**: 1000 users, 100 convert to premium

- 100 purchases × $4.99 = $499 gross revenue
- Apple takes 30% = $150
- **You get 70% = $349**
- AI costs for those 100 users ≈ $50/month
- **Net profit = $299/month** 🎉

With good conversion rate (10%+), IAP can be very profitable!
