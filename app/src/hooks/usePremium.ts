import { PREMIUM_GATING_ENABLED } from "../config/paywall";
import { useAppData } from "../state/AppDataContext";

// Single source of truth for premium gating across screens.
// - `isPremium`: the user holds the entitlement (from RevenueCat, cached locally).
// - `gatingActive`: the app is actually selling premium (both flags live).
// - `locked`: a premium-only feature should be hidden/upsold for this user.
//
// Locking only happens once the app is genuinely charging, so before launch every
// feature stays open and no existing user loses access on update.
export function usePremium() {
  const { isPremium } = useAppData();
  const locked = PREMIUM_GATING_ENABLED && !isPremium;
  return { isPremium, gatingActive: PREMIUM_GATING_ENABLED, locked };
}
