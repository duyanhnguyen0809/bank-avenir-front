// Application configuration

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://127.0.0.1:4000';

// Set to true to use mock APIs (for development without backend)
// Set to false to use real backend APIs
export const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' || false;
