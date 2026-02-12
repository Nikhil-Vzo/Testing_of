// Google Analytics tracking utilities
// Measurement ID: G-1SMGFPR49Z

declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
    }
}

/**
 * Track a custom event in Google Analytics
 * @param action - The action being tracked (e.g., 'click', 'submit', 'view')
 * @param category - The category of the event (e.g., 'Button', 'Form', 'Video')
 * @param label - Optional label for additional context
 * @param value - Optional numeric value
 */
export const trackEvent = (
    action: string,
    category: string,
    label?: string,
    value?: number
) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    }
};

/**
 * Track a page view (useful for SPAs)
 * @param path - The page path (e.g., '/profile', '/matches')
 * @param title - Optional page title
 */
export const trackPageView = (path: string, title?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('config', 'G-1SMGFPR49Z', {
            page_path: path,
            page_title: title,
        });
    }
};

/**
 * Track user properties (e.g., user ID, user type)
 * @param properties - Object containing user properties
 */
export const trackUserProperties = (properties: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('set', 'user_properties', properties);
    }
};

/**
 * Common event trackers for the app
 */
export const analytics = {
    // Auth events
    login: (method: string) => trackEvent('login', 'Auth', method),
    signup: (method: string) => trackEvent('sign_up', 'Auth', method),
    logout: () => trackEvent('logout', 'Auth'),

    // Profile events
    profileView: (userId?: string) => trackEvent('view_profile', 'Profile', userId),
    profileEdit: () => trackEvent('edit_profile', 'Profile'),
    profileComplete: () => trackEvent('complete_profile', 'Profile'),

    // Match/Swipe events
    swipeRight: () => trackEvent('swipe_right', 'Discovery'),
    swipeLeft: () => trackEvent('swipe_left', 'Discovery'),
    match: () => trackEvent('match', 'Discovery'),

    // Chat events
    messageSent: () => trackEvent('message_sent', 'Chat'),
    videoCall: () => trackEvent('video_call_started', 'Chat'),

    // Virtual Date events
    virtualDateStart: (type: string) => trackEvent('virtual_date_start', 'VirtualDate', type),
    virtualDateJoin: () => trackEvent('virtual_date_join', 'VirtualDate'),

    // Confession events
    confessionPost: (type: string) => trackEvent('confession_post', 'Confessions', type),
    confessionReact: (emoji: string) => trackEvent('confession_react', 'Confessions', emoji),

    // Premium events
    premiumView: () => trackEvent('premium_view', 'Premium'),
    premiumPurchase: (plan: string) => trackEvent('purchase', 'Premium', plan),
};
