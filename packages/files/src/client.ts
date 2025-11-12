export interface FileMeta {
    dv: 1
    sender: {
        dv: 1
        fingerprint: string
    }
    user: {
        id: string
    }
    fileClientId: string
    modelNames: string[]
    organization?: {
        id: string
    }
}

export interface InlineAttachPayload {
    dv: 1
    sender: {
        dv: 1
        fingerprint: string
    }
    itemId: string
    modelName: string
}

export interface BuildMetaOptions {
    userId: string
    fileClientId: string
    modelNames: string[]
    fingerprint: string
    organizationId?: string
}

export interface UploadOptions {
    serverUrl?: string
    cookie?: string
    files: Array<File | Blob | { buffer: Buffer, filename: string }>
    meta: FileMeta
    attach?: InlineAttachPayload
}

export interface SharePayload {
    dv: 1
    sender: {
        dv: 1
        fingerprint: string
    }
    id: string
    user: {
        id: string
    }
    fileClientId: string
    modelNames?: string[]
}

export interface ShareOptions {
    serverUrl?: string
    cookie?: string
    payload: SharePayload
}

export interface AttachPayload {
    dv: 1
    sender: {
        dv: 1
        fingerprint: string
    }
    modelName: string
    itemId: string
    fileClientId: string
    signature: string
}

export interface AttachOptions {
    serverUrl?: string
    cookie?: string
    payload: AttachPayload
}

export interface UploadFileResult {
    id: string
    signature: string
    attached?: boolean
    publicSignature?: string
}

export interface UploadResponse {
    files: UploadFileResult[]
}

export interface ShareResponse {
    file: {
        id: string
        signature: string
    }
}

export interface AttachResponse {
    file: {
        signature: string
    }
}

export function buildMeta ({
    userId,
    fileClientId,
    modelNames,
    fingerprint,
    organizationId,
}: BuildMetaOptions): FileMeta {
    const meta: FileMeta = {
        dv: 1,
        sender: { dv: 1, fingerprint },
        user: { id: userId },
        fileClientId,
        modelNames,
    }
    if (organizationId) {
        meta.organization = { id: organizationId }
    }
    return meta
}

/**
 * Get server URL from environment variables or use provided override.
 */
function getServerUrl (override?: string): string {
    if (override) {
        return override.replace(/\/$/, '')
    }

    if (typeof window !== 'undefined') {
        const envUrl = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SERVER_URL) ||
                       (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SERVER_URL
        if (envUrl) {
            return envUrl.replace(/\/$/, '')
        }
        return window.location.origin
    } else {
        const envUrl = process.env.SERVER_URL || process.env.FILE_SERVER_URL
        if (envUrl) {
            return envUrl.replace(/\/$/, '')
        }
        throw new Error('SERVER_URL or FILE_SERVER_URL must be set in environment variables, or provide serverUrl parameter')
    }
}

export async function upload ({ serverUrl, cookie, files, meta, attach }: UploadOptions): Promise<UploadResponse> {
    let FormDataClass: typeof FormData
    let form: FormData | any

    if (typeof window !== 'undefined') {
        FormDataClass = FormData
        form = new FormDataClass()
    } else {
        const FormDataModule = require('form-data')
        FormDataClass = FormDataModule
        form = new FormDataClass()
    }

    if (!Array.isArray(files) || files.length === 0) {
        throw new Error('upload: "files" must be a non-empty array')
    }

    for (const f of files) {
        if (f instanceof Buffer) {
            form.append('file', f, 'file.bin')
        } else if (f && typeof f === 'object' && 'buffer' in f && 'filename' in f) {
            form.append('file', (f as { buffer: Buffer, filename: string }).buffer, (f as { buffer: Buffer, filename: string }).filename)
        } else {
            const file = f as File | Blob
            form.append('file', file, (file as File).name || 'file.bin')
        }
    }

    form.append('meta', JSON.stringify(meta))
    if (attach) {
        form.append('attach', JSON.stringify(attach))
    }

    const headers: Record<string, string> = {}
    if (cookie) {
        headers.Cookie = cookie
    }

    if (typeof window === 'undefined' && form.getHeaders) {
        Object.assign(headers, form.getHeaders())
    }

    const baseUrl = getServerUrl(serverUrl)
    const res = await fetch(`${baseUrl}/api/files/upload`, {
        method: 'POST',
        headers,
        body: form,
    })

    const json = await res.json()
    if (!res.ok) {
        throw new Error(`upload failed: ${res.status} ${JSON.stringify(json)}`)
    }

    return json.data
}

export async function share ({ serverUrl, cookie, payload }: ShareOptions): Promise<ShareResponse> {
    const baseUrl = getServerUrl(serverUrl)
    const res = await fetch(`${baseUrl}/api/files/share`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(cookie ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify(payload),
    })

    const json = await res.json()
    if (!res.ok) {
        throw new Error(`share failed: ${res.status} ${JSON.stringify(json)}`)
    }

    return json.data
}

export async function attach ({ serverUrl, cookie, payload }: AttachOptions): Promise<AttachResponse> {
    const baseUrl = getServerUrl(serverUrl)
    const res = await fetch(`${baseUrl}/api/files/attach`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(cookie ? { Cookie: cookie } : {}),
        },
        body: JSON.stringify(payload),
    })

    const json = await res.json()
    if (!res.ok) {
        throw new Error(`attach failed: ${res.status} ${JSON.stringify(json)}`)
    }

    return json.data
}

