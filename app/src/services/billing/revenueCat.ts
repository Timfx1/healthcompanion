import { Platform } from "react-native";
import { BILLING_ENABLED, REVENUECAT_CONFIG } from "../../config/paywall";

type PurchaseOutcome = {
  success: boolean;
  active: boolean;
  message?: string;
};

let configured = false;

function getRevenueCatApiKey() {
  return Platform.OS === "ios" ? REVENUECAT_CONFIG.iosApiKey : REVENUECAT_CONFIG.androidApiKey;
}

function getPurchasesModule() {
  // Keep this dynamic so Expo Go and billing-disabled builds do not load the native module.
  // Billing can be turned on only in an EAS build that includes react-native-purchases.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("react-native-purchases").default;
}

export const isRevenueCatReady = Boolean(BILLING_ENABLED && getRevenueCatApiKey());

export async function configureRevenueCat(appUserID?: string | null) {
  if (!BILLING_ENABLED) return false;
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    if (__DEV__) console.log("[Healthcompanion/RevenueCat] Missing platform API key.");
    return false;
  }

  try {
    const Purchases = getPurchasesModule();
    if (!configured) {
      Purchases.configure({ apiKey, appUserID: appUserID ?? undefined });
      configured = true;
      if (__DEV__) console.log("[Healthcompanion/RevenueCat] Configured", { platform: Platform.OS });
    } else if (appUserID) {
      await Purchases.logIn(appUserID);
      if (__DEV__) console.log("[Healthcompanion/RevenueCat] User identified", { uid: appUserID });
    }
    return true;
  } catch (error) {
    if (__DEV__) {
      console.log("[Healthcompanion/RevenueCat] Configure failed safely", {
        message: error instanceof Error ? error.message : "Unknown RevenueCat error"
      });
    }
    return false;
  }
}

export async function identifyRevenueCatUser(uid: string) {
  if (!BILLING_ENABLED) return;
  await configureRevenueCat(uid);
}

function hasPremiumEntitlement(customerInfo: any) {
  return Boolean(customerInfo?.entitlements?.active?.[REVENUECAT_CONFIG.entitlementId]);
}

async function getMonthlyPackage(Purchases: any) {
  const offerings = await Purchases.getOfferings();
  const selectedOffering =
    offerings.all?.[REVENUECAT_CONFIG.offeringId] ?? offerings.current ?? Object.values(offerings.all ?? {})[0];
  const availablePackages = selectedOffering?.availablePackages ?? [];
  return (
    availablePackages.find((pkg: any) => pkg.identifier === REVENUECAT_CONFIG.monthlyPackageId) ??
    selectedOffering?.monthly ??
    availablePackages[0] ??
    null
  );
}

export type PremiumOffer = {
  // Store-localized price already in the user's currency + format (e.g. "$9.99",
  // "€9,99", "£8.99"). Apple/Google localize and currency-convert this for us.
  priceString: string;
  periodLabel: string;
  hasFreeTrial: boolean;
  trialLabel?: string;
};

function formatPeriodUnit(unit: string | undefined, count: number): string {
  const map: Record<string, string> = { DAY: "day", WEEK: "week", MONTH: "month", YEAR: "year" };
  const word = map[String(unit).toUpperCase()] ?? "day";
  return count === 1 ? word : `${word}s`;
}

// Reads the store's localized price + any intro/free-trial for the monthly package
// so the paywall can show the exact amount the user will be charged in their own
// currency. Returns null when billing is off/unconfigured so callers fall back to
// static copy. Never throws.
export async function getPremiumOffer(appUserID?: string | null): Promise<PremiumOffer | null> {
  const configuredNow = await configureRevenueCat(appUserID);
  if (!configuredNow) return null;

  try {
    const Purchases = getPurchasesModule();
    const packageToBuy = await getMonthlyPackage(Purchases);
    const product = packageToBuy?.product;
    const priceString: string | undefined = product?.priceString;
    if (!priceString) return null;

    // Free-trial / intro pricing shape varies across store + SDK versions; read it
    // defensively and only surface a trial when the intro price is actually zero.
    const intro = product?.introPrice;
    const introUnits = Number(intro?.periodNumberOfUnits ?? 0);
    const hasFreeTrial = Boolean(intro) && Number(intro?.price) === 0 && introUnits > 0;

    return {
      priceString,
      periodLabel: "month",
      hasFreeTrial,
      trialLabel: hasFreeTrial ? `${introUnits} ${formatPeriodUnit(intro?.periodUnit, introUnits)} free` : undefined
    };
  } catch (error) {
    if (__DEV__) {
      console.log("[Healthcompanion/RevenueCat] getPremiumOffer failed safely", {
        message: error instanceof Error ? error.message : "Unknown RevenueCat error"
      });
    }
    return null;
  }
}

export async function purchasePremiumPackage(appUserID?: string | null): Promise<PurchaseOutcome> {
  const configuredNow = await configureRevenueCat(appUserID);
  if (!configuredNow) {
    return { success: false, active: false, message: "Billing is not configured yet." };
  }

  try {
    const Purchases = getPurchasesModule();
    const packageToBuy = await getMonthlyPackage(Purchases);
    if (!packageToBuy) {
      return { success: false, active: false, message: "No subscription package is available yet." };
    }

    const result = await Purchases.purchasePackage(packageToBuy);
    const active = hasPremiumEntitlement(result.customerInfo);
    return { success: true, active };
  } catch (error: any) {
    if (error?.userCancelled) {
      return { success: false, active: false, message: "Purchase cancelled." };
    }
    return {
      success: false,
      active: false,
      message: error instanceof Error ? error.message : "Purchase could not be completed."
    };
  }
}

// Reads the user's current premium entitlement from RevenueCat. Safe to call on
// launch — configures first, and returns { active: false } whenever billing is
// off, unconfigured, or the network is unavailable, so it never blocks the UI.
export async function getPremiumStatus(appUserID?: string | null): Promise<{ active: boolean }> {
  const configuredNow = await configureRevenueCat(appUserID);
  if (!configuredNow) return { active: false };

  try {
    const Purchases = getPurchasesModule();
    const customerInfo = await Purchases.getCustomerInfo();
    return { active: hasPremiumEntitlement(customerInfo) };
  } catch (error) {
    if (__DEV__) {
      console.log("[Healthcompanion/RevenueCat] getCustomerInfo failed safely", {
        message: error instanceof Error ? error.message : "Unknown RevenueCat error"
      });
    }
    return { active: false };
  }
}

// Subscribes to live entitlement changes (purchase completes, trial converts,
// subscription lapses, restore on another device). Returns an unsubscribe fn.
// No-op when billing is disabled so guest/offline builds never touch the SDK.
export function addPremiumStatusListener(onChange: (active: boolean) => void): () => void {
  if (!BILLING_ENABLED) return () => {};

  try {
    const Purchases = getPurchasesModule();
    const listener = (customerInfo: any) => onChange(hasPremiumEntitlement(customerInfo));
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      try {
        Purchases.removeCustomerInfoUpdateListener(listener);
      } catch {
        // Removing an already-torn-down listener is not fatal.
      }
    };
  } catch (error) {
    if (__DEV__) {
      console.log("[Healthcompanion/RevenueCat] addCustomerInfoUpdateListener failed safely", {
        message: error instanceof Error ? error.message : "Unknown RevenueCat error"
      });
    }
    return () => {};
  }
}

export async function restorePremiumPurchases(appUserID?: string | null): Promise<PurchaseOutcome> {
  const configuredNow = await configureRevenueCat(appUserID);
  if (!configuredNow) {
    return { success: false, active: false, message: "Billing is not configured yet." };
  }

  try {
    const Purchases = getPurchasesModule();
    const customerInfo = await Purchases.restorePurchases();
    return { success: true, active: hasPremiumEntitlement(customerInfo) };
  } catch (error) {
    return {
      success: false,
      active: false,
      message: error instanceof Error ? error.message : "Purchases could not be restored."
    };
  }
}
