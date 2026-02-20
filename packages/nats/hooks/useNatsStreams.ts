import { useEffect, useState } from 'react'

import { useOrganization } from '@open-condo/next/organization'

interface NatsStream {
    name: string
    subjects: string[]
    description: string
    permission?: string
}

interface NatsStreamsResponse {
    streams: NatsStream[]
    organizationId: string
}

export const useNatsStreams = () => {
    const { organization } = useOrganization()
    const [streams, setStreams] = useState<NatsStream[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!organization?.id) {
            setStreams([])
            setLoading(false)
            return
        }

        const fetchStreams = async () => {
            try {
                setLoading(true)
                setError(null)

                const response = await fetch('/nats/streams')
                if (!response.ok) {
                    throw new Error('Failed to fetch NATS streams')
                }

                const data: NatsStreamsResponse = await response.json()
                setStreams(data.streams)
            } catch (err) {
                console.error('[NATS] Error fetching streams:', err)
                setError(err instanceof Error ? err.message : 'Unknown error')
                setStreams([])
            } finally {
                setLoading(false)
            }
        }

        fetchStreams()
    }, [organization?.id])

    return {
        streams,
        loading,
        error,
        hasStream: (streamName: string) => streams.some(s => s.name === streamName),
    }
}
