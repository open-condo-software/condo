export const DEFAULT_B2C_LOGO_URL = '/icons/b2c.png'
export const B2C_LOGO_SIZE = 126
export const B2C_LOGO_MAIN_COLOR = '#82879F'
export const B2C_LOGO_SECONDARY_COLOR = '#D0D3E5'
export const B2C_LOGO_ALLOWED_MIMETYPES = ['image/png']
export const B2C_LOGO_MAX_FILE_SIZE_IN_BYTES = 1024 * 1024   // 1 Mb in bytes
export const B2C_BUILD_ALLOWED_MIMETYPES  = [
    // Official mimetype for zip archives, which is used in many Unix OS
    'application/zip',
    // Deprecated types only Windows uses
    'application/x-zip-compressed',
    'application/zip-compressed',
]
export const B2C_BUILD_MAX_FILE_SIZE_IN_BYTES = 200 * 1024 * 1024  // 200 Mb in bytes
// NOTE: taken from https://semver.org
export const B2C_BUILD_VERSION_REGEXP = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
export const DEFAULT_PAGE_SIZE = 10

// TODO: Replace with relative link after migrating docs
export const OIDC_DOCS_LINK = 'https://docs.google.com/document/d/1pTMq0Qi9307uUIfHK4eGi6T1xtUvrK4Asz9j5Eoo8bI/edit#heading=h.tyzk29z45ac'
export const DEV_REDIRECT_URI_EXAMPLE = 'https://miniapp.dev.example.com/oidc/callback'
export const PROD_REDIRECT_URI_EXAMPLE = 'https://miniapp.example.com/oidc/callback'