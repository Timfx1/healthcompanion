import { useEffect } from "react";
import { BILLING_ENABLED } from "../config/paywall";
import { useAppData } from "../state/AppDataContext";
import { onAuthChanged } from "../services/firebase/auth";
import { addPremiumStatusListener, getPremiumStatus } from "../services/billing/revenueCat";

// Keeps local premium state in sync with RevenueCat's source of truth.
// Renders nothing. Mounted inside AppDataProvider so it can write entitlement.
//
// Runs only when billing is enabled, so guest/offline builds never load the
// native purchases module. On every auth change it reconfigures RevenueCat with
// the user's uid and re-reads the entitlement; a live listener then keeps the UI
// current when a purchase completes, a trial converts, or a subscription lapses.
export function PremiumSync() {
  const { setPremiumActive } = useAppData();

  useEffect(() => {
    if (!BILLING_ENABLED) return;

    let cancelled = false;

    const removeStatusListener = addPremiumStatusListener((active) => {
      if (!cancelled) setPremiumActive(active);
    });

    // Fires immediately with the current user (or null), then on every change —
    // reconfigures RevenueCat with the uid and re-reads the entitlement.
    const unsubscribeAuth = onAuthChanged(async (user) => {
      const status = await getPremiumStatus(user?.uid ?? null);
      if (!cancelled) setPremiumActive(status.active);
    });

    return () => {
      cancelled = true;
      removeStatusListener();
      unsubscribeAuth();
    };
  }, [setPremiumActive]);

  return null;
}
