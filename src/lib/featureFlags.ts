/**
 * Feature flags controlled by Vite env vars (resolved at build time).
 *
 * To enable a flag, set the variable to the string "true" in `.env.local`
 * (local) or in the hosting provider's environment (prod), then rebuild.
 */
export const FEATURES = {
  /**
   * Aid coordination board ("Ayuda"). Still in development, so it's OFF unless
   * `VITE_ENABLE_AID=true`. When off: the nav item, the home CTA and the
   * `/ayuda` route are hidden.
   */
  aid: import.meta.env.VITE_ENABLE_AID === 'true',
} as const;
