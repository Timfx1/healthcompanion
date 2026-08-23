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
  // §9's premium list, and NOTHING ELSE. These were AnklePath's — "smarter
  // rehab progression", "return-to-sport readiness", "extended exercise
  // library" — which are features of a different product. Selling them here
  // would have been the paywall describing an app the user does not have.
  //
  // Premium is DEPTH ONLY (P9). Every item below adds to something the user
  // already has for free; none of them is a thing they need in order to use the
  // product. That is the structural difference between this list and the
  // Medisafe core-feature paywall that §9 cites as the cautionary tale.
  //
  // WHAT IS DELIBERATELY ABSENT: the doctor report, its export, the check-in,
  // quick capture, the timeline, the journal, medications, appointments and the
  // safety content. Those are free forever, and N6 rule B in restricted.mjs
  // FAILS THE BUILD if the report is so much as named on a premium-offer
  // surface — this file is on that list.
  benefits: [
    "Deeper insights and correlations",
    "Your full history, beyond the last 30 days",
    "Side-by-side photo comparison",
    "More than one recovery at a time",
    "Education deep dives"
  ]
} as const;
