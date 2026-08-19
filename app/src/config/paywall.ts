export const PAYWALL_ENABLED = process.env.EXPO_PUBLIC_PAYWALL_ENABLED === "true";
export const BILLING_ENABLED = process.env.EXPO_PUBLIC_BILLING_ENABLED === "true";

// Premium features only lock when the app is *actually* selling — i.e. the paywall
// is shown AND billing can charge. Until both flags flip on (which needs a build
// with live RevenueCat keys), every user keeps full access, so no existing user
// loses anything on update and the app stays fully usable in guest/offline mode.
export const PREMIUM_GATING_ENABLED = PAYWALL_ENABLED && BILLING_ENABLED;

export const REVENUECAT_CONFIG = {
  androidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
  iosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
  entitlementId: process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? "premium",
  offeringId: process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID ?? "default",
  monthlyPackageId: process.env.EXPO_PUBLIC_REVENUECAT_MONTHLY_PACKAGE_ID ?? "$rc_monthly"
} as const;

// Displayed price. This is fallback copy only — the real charged amount comes from
// the store product. Keep this string matching the product you create in Google
// Play / App Store Connect so users never see a mismatch before checkout opens.
export const MONTHLY_PRICE = "EUR 9.99";

export const PAYWALL_COPY = {
  trialLabel: "Start 14-day free trial",
  monthlyLabel: `Subscribe monthly - ${MONTHLY_PRICE}`,
  monthlyPrice: `${MONTHLY_PRICE} / month`,
  trialLength: "14 days free",
  benefits: [
    "Advanced progress insights",
    "Smarter rehab progression",
    "Return-to-sport readiness tools",
    "Photo progress compare",
    "Extended exercise library"
  ]
} as const;
