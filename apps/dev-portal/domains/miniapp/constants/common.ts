export const DEFAULT_B2C_LOGO_URL = '/icons/b2c.png'
export const B2C_LOGO_MIN_SIZE = 80
export const B2C_LOGO_MAX_SIZE = 200
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
export const B2C_BUILD_VERSION_REGEXP = /^\d+.\d+.\d+(?:-\w{1,64})?$/
export const DEFAULT_PAGE_SIZE = 10