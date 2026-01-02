// Application configuration

// Set to true to use mock API (for testing without backend)
// You can also set NEXT_PUBLIC_USE_MOCK_API=true in .env.local
export const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true' || true;

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000';
