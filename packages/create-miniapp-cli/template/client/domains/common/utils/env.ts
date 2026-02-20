export const env = {
    SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4003',
    SERVICE_URL: process.env.NEXT_PUBLIC_SERVICE_URL || 'http://localhost:3000',
    ADDRESS_SERVICE_URL: process.env.NEXT_PUBLIC_ADDRESS_SERVICE_URL || 'http://localhost:4001',
    API_TARGET: process.env.NEXT_PUBLIC_API_TARGET || '~/',
    DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en',
    IS_SSR_DISABLED: process.env.NEXT_PUBLIC_DISABLE_SSR === 'true',
    APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    POSTHOG_API_HOST: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
    POSTHOG_API_KEY: process.env.NEXT_PUBLIC_POSTHOG_API_KEY,
    DEFAULT_CURRENCY_CODE: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_CODE || 'USD',
}
