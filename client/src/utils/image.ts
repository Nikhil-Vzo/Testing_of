export const getOptimizedUrl = (url: string | undefined | null, width: number = 100) => {
    if (!url || !url.includes('supabase')) return url || ''; // Return original if not supabase or empty

    // Supabase Storage Transformation URL
    // If it already has query params, append using &
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&quality=60&resize=cover`;
};
