export const getPublicAsset = (path: string) => {
    if (typeof window === 'undefined') {
        return path;
    }
    const nextData = (window as any).__NEXT_DATA__ || {};
    const prefix = nextData.assetPrefix || nextData.basePath || '';
    if (prefix) {
        return `${prefix}${path}`;
    }
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
        return `/${parts[0]}${path}`;
    }
    return path;
};
