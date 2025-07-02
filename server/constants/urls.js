export const BASE_URL =
    process.env.NODE_ENV === 'production'
        ? `https://${process.env.DOMAIN || 'example.com'}`
        : 'http://localhost:3003';
