import { useCallback, useRef, useState, useMemo } from 'react'

export type UploadMeta = {
    appId: string
    authedItem: string
    modelNames: string[]
    dv: number
    sender: { dv: number, fingerprint: string }
}

export type ServerUploadItem = {
    data: {
        files: Array<{ id: string, signature: string }>
    }
}


type UseFormDataUploadOptions = {
    endpoint?: string
}

type UploadArgs = {
    file: Blob
    filename: string
    meta: UploadMeta
}

export function useFormDataUpload (props: UseFormDataUploadOptions = {}) {
    const { endpoint } = props

    const [isUploading, setUploading] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const abortRef = useRef<AbortController | null>(null)

    const abort = useCallback(() => {
        abortRef.current?.abort()
    }, [])

    const upload = useCallback(
        async ({ file, filename, meta }: UploadArgs): Promise<ServerUploadItem> => {
            setUploading(true)
            setError(null)

            const controller = new AbortController()
            abortRef.current = controller

            const formData = new FormData()
            const name = filename ?? (file as any)?.name ?? 'file'
            formData.append('file', file, name)
            formData.append(
                'meta',
                JSON.stringify({
                    dv: 1,
                    sender: { dv: 1, fingerprint: 'just-test-fingerprint' },
                    ...meta,
                }),
            )

            try {
                const res = await fetch(endpoint, {
                    method: 'POST',
                    body: formData,
                    credentials: 'include',
                    signal: controller.signal,
                })

                if (!res.ok) {
                    // Try to surface server error details if present
                    let serverMsg = ''
                    try {
                        const j = await res.json()
                        serverMsg = typeof j?.message === 'string' ? ` (${j.message})` : ''
                        // optionally log entire response j
                        // eslint-disable-next-line no-console
                        console.log('Upload error payload:', j)
                    } catch {
                        // ignore parse failure
                    }
                    throw new Error(`Upload failed${serverMsg}`)
                }

                return (await res.json()) as ServerUploadItem
            } catch (e: any) {
                const err = e instanceof Error ? e : new Error(String(e))
                setError(err)
                throw err
            } finally {
                setUploading(false)
                abortRef.current = null
            }
        },
        [endpoint],
    )

    return useMemo(
        () => ({ upload, isUploading, error, abort }),
        [upload, isUploading, error, abort]
    )
}
