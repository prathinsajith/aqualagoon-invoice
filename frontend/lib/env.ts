/**
 * Environment Variables Validation
 * Validates required environment variables at startup to fail fast with clear errors.
 * This prevents cryptic runtime errors in production.
 */

function getRequiredEnv(key: string): string {
    const value = process.env[key];

    if (!value) {
        // Only throw in production or server-side
        if (process.env.NODE_ENV === 'production') {
            throw new Error(
                `Missing required environment variable: ${key}\n` +
                `Please ensure ${key} is set in your environment.`
            );
        }

        // In development, log warning and return default
        if (typeof window === 'undefined') {
            console.warn(
                `⚠️  Warning: ${key} is not set. Using default value.\n` +
                `   Add it to your .env.local file for production readiness.`
            );
        }

        // Default for local development
        return 'http://localhost:8800';
    }

    return value;
}

function getOptionalEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

// Validate and export all environment variables
export const env = {
    // API Configuration
    apiUrl: getRequiredEnv('NEXT_PUBLIC_API_URL'),

    // Environment
    nodeEnv: getOptionalEnv('NODE_ENV', 'development'),
    isProd: process.env.NODE_ENV === 'production',
    isDev: process.env.NODE_ENV === 'development',
} as const;

// Validate on module load (server-side only)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
    if (env.apiUrl) {
        console.log('✓ Environment variables validated');
    }
}
