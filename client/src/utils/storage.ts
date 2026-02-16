// Helper to safely store in sessionStorage with quota handling
const safeSetItem = (key: string, value: string) => {
    try {
        sessionStorage.setItem(key, value);
    } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
            console.warn('Session storage quota exceeded. Clearing old cache.');
            // Strategy: Clear EVERYTHING from session storage as a fallback, 
            // or just don't cache this item. 
            // For now, let's try clearing everything and retrying once.
            try {
                sessionStorage.clear();
                sessionStorage.setItem(key, value);
            } catch (retryError) {
                console.error('Failed to cache data even after clearing storage:', retryError);
            }
        }
    }
};
