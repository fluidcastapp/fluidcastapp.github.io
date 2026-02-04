/**
 * EU/UK Cookie Consent Management
 * GDPR and ePrivacy Directive Compliant
 */

class CookieConsent {
  constructor() {
    this.storageKey = 'fluidcast-cookie-consent';
    this.cookieDuration = 365; // days
    this.init();
  }

  init() {
    // Check if user has already made a choice
    const existingConsent = this.getConsent();
    if (!existingConsent) {
      this.showDialog();
    }
    // Respect user's consent choices
    this.applyConsentSettings();
    // Make dialog non-blocking - allow page interaction
    this.makeNonBlocking();
  }

  makeNonBlocking() {
    const dialog = document.getElementById('cookie-consent-dialog');
    if (dialog) {
      // Remove click blocking
      dialog.style.pointerEvents = 'none';
      const box = document.querySelector('.cookie-consent-box');
      if (box) {
        box.style.pointerEvents = 'auto';
      }
    }
  }

  getConsent() {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return null;
    return JSON.parse(stored);
  }

  setConsent(consent) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(consent));
    } catch (e) {
      console.warn('Cookie consent could not be saved (localStorage blocked?):', e);
    }
    this.applyConsentSettings();
  }

  showDialog() {
    const dialog = document.getElementById('cookie-consent-dialog');
    if (dialog) {
      dialog.style.display = 'flex';
    }
  }

  hideDialog() {
    const dialog = document.getElementById('cookie-consent-dialog');
    if (dialog) {
      dialog.style.display = 'none';
    }
  }

  acceptAll() {
    const consent = {
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    };
    this.setConsent(consent);
    this.hideDialog();
  }

  rejectAll() {
    const consent = {
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    };
    this.setConsent(consent);
    this.hideDialog();
  }

  savePreferences() {
    const analyticsCheckbox = document.getElementById('cookie-analytics');
    const marketingCheckbox = document.getElementById('cookie-marketing');

    const consent = {
      analytics: analyticsCheckbox ? analyticsCheckbox.checked : false,
      marketing: marketingCheckbox ? marketingCheckbox.checked : false,
      timestamp: new Date().toISOString()
    };
    this.setConsent(consent);
    this.hideDialog();
  }

  applyConsentSettings() {
    const consent = this.getConsent();
    if (!consent) return;

    // Handle Google Analytics - must be done before gtag is initialized
    if (consent.analytics) {
      window['ga-disable-G-80XZVYXSQX'] = false;
    } else {
      window['ga-disable-G-80XZVYXSQX'] = true;
    }
  }

  reloadPageForGA() {
    // No-op: page refresh removed to improve UX
  }

  // Allow users to view/change consent preferences
  openPreferences() {
    const dialog = document.getElementById('cookie-consent-dialog');
    const content = document.getElementById('cookie-content');
    const preferences = document.getElementById('cookie-preferences');
    
    if (content) content.style.display = 'none';
    if (preferences) preferences.style.display = 'block';
  }

  closePreferences() {
    const dialog = document.getElementById('cookie-consent-dialog');
    const content = document.getElementById('cookie-content');
    const preferences = document.getElementById('cookie-preferences');
    
    if (content) content.style.display = 'block';
    if (preferences) preferences.style.display = 'none';
  }

  // For manual trigger (e.g., cookie settings link in footer)
  showSettings() {
    this.showDialog();
    this.openPreferences();
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.cookieConsent = new CookieConsent();
  });
} else {
  window.cookieConsent = new CookieConsent();
}
