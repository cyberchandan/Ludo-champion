/**
 * Ludo Champion - AdMob Monetization Architecture (Placeholder)
 *
 * Implemented in strict accordance with:
 * 1. Google Play Families Policy:
 *    - Child-directed treatment tag enabled (COPPA / GDPR compliant).
 *    - No interest-based advertising or behavioral remarketing.
 * 2. Non-Intrusive Gameplay Guidelines:
 *    - Never interrupts an active game.
 *    - Banners restricted to non-gameplay menu screens.
 *    - Interstitial ads shown only post-match on game completion.
 *    - Rewarded ads optional for cosmetic unlocks (board themes/dice skins).
 */

export const AD_CONFIG = {
  // Test Ad Unit IDs provided by Google AdMob
  BANNER_ID: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL_ID: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED_ID: 'ca-app-pub-3940256099942544/5224354917',

  // Google Play Families Compliance Settings
  FAMILIES_COMPLIANT_REQUEST_OPTIONS: {
    tagForChildDirectedTreatment: true,
    tagForUnderAgeOfConsent: true,
    maxAdContentRating: 'G', // General audiences / Children only
  },
};

class AdManager {
  constructor() {
    this.isInitialized = false;
    this.interstitialLoaded = false;
  }

  /**
   * Initializes AdMob SDK with Families safety options
   */
  async initialize() {
    // When react-native-google-mobile-ads is added, initialize here:
    // await mobileAds().setRequestConfiguration(AD_CONFIG.FAMILIES_COMPLIANT_REQUEST_OPTIONS);
    // await mobileAds().initialize();
    this.isInitialized = true;
  }

  /**
   * Shows an interstitial ad ONLY after a game has naturally ended
   */
  showPostGameInterstitial() {
    // Failsafe: Never trigger during active gameplay
    // if (this.interstitialLoaded) { interstitial.show(); }
  }

  /**
   * Displays an optional rewarded ad for cosmetics
   * @param {Function} onRewardEarned
   */
  showRewardedAd(onRewardEarned) {
    // rewardedAd.show();
    if (onRewardEarned) onRewardEarned({ type: 'COSMETIC_SKIN' });
  }
}

export const adManager = new AdManager();
