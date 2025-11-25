import getConfig from 'next/config'

export type QueryParams = Record<string, string | number | boolean | null | undefined>

interface RequestOptions {
    query?: QueryParams
    data?: unknown
    headers?: HeadersInit
    credentials?: RequestCredentials
}

const ABSOLUTE_URL_REGEX = /^https?:\/\//i

const buildUrl = (path: string, query?: QueryParams): string => {
    const { publicRuntimeConfig } = getConfig()
    const baseUrl = publicRuntimeConfig?.serverUrl ?? ''
    const isAbsolute = ABSOLUTE_URL_REGEX.test(path)

    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    const normalizedPath = path.startsWith('/') ? path : `/${path}`

    const url = new URL(isAbsolute ? path : `${normalizedBase}${normalizedPath}`)

    if (query) {
        Object.entries(query).forEach(([key, value]) => {
            if (value === null || value === undefined) return
            url.searchParams.append(key, String(value))
        })
    }

    return url.toString()
}

const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(errorText || `Request failed with status ${response.status}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
        return response.json() as Promise<T>
    }

    return response.text() as unknown as T
}

export const getRequest = async <T = unknown>(path: string, options: RequestOptions = {}): Promise<T> => {
    const { query, headers, credentials } = options
    const url = buildUrl(path, query)

    const response = await fetch(url, {
        method: 'GET',
        headers,
        //credentials: credentials ?? 'omit',
    })

    return handleResponse<T>(response)
}

export const postRequest = async <T = unknown>(path: string, options: RequestOptions = {}): Promise<T> => {
    const { query, data, headers, credentials } = options
    const url = buildUrl(path, query)

    console.log(url)
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        //credentials: credentials ?? 'omit',
        body: data !== undefined ? JSON.stringify(data) : undefined,
    })

    return handleResponse<T>(response)
}
