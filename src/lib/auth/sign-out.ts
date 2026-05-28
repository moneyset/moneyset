/**
 * Canonical client-side session teardown.
 *
 * Call this on every sign-out path:
 *   - Explicit user-initiated sign-out (auth modal, account dashboard)
 *   - Auth state change firing a null session (token expiry, revocation, device sign-out)
 *
 * This is the ONLY place that should modify access/subscription/entry stores on
 * sign-out. Never duplicate this logic inline in components.
 *
 * What it does:
 *   1. Resets access profile to guest + marks serverConfirmed = true (so gates
 *      render correctly locked, not invisible, immediately after sign-out)
 *   2. Clears in-memory trial state (dev-only; never persisted, but clean up anyway)
 *   3. Resets subscription display state (provider, invoiceId, etc.)
 *   4. Sets entryMode to "guest" so the app returns to the sign-in prompt, but
 *      does NOT clear entryMode to "none" — the user has already completed
 *      onboarding and should not be forced through it again on re-auth.
 *
 * What it does NOT do:
 *   - Call Supabase signOut (the caller must do that before or after)
 *   - Reset UI preferences (locale, theme) — those survive sign-out by design
 *   - Clear the entryStore's completed flag
 */

import { guestProfile } from "@/lib/access/roles";
import { useAccessStore } from "@/store/access-store";
import { useSubscriptionStore } from "@/store/subscription-store";
import { useEntryStore } from "@/store/entry-store";

export function clearClientSession(): void {
  // setProfile marks serverConfirmed = true with guestProfile, so gates
  // immediately render "locked" rather than "invisible" after sign-out.
  useAccessStore.getState().setProfile(guestProfile());
  // Clear dev trial state for this session.
  useAccessStore.setState({ trialEndsAtTs: null, trialStarted: false });
  // Clear subscription display state.
  useSubscriptionStore.getState().setFree();
  // Return to authenticated-but-guest mode; preserves completed-onboarding flag.
  useEntryStore.setState({ entryMode: "guest" });
}
