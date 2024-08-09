import { useState, useEffect } from 'react'

import type { ResultResponseData, ErrorResponseData } from '@open-condo/bridge'
import bridge from '@open-condo/bridge'

type IUseLaunchParams = {
    loading: boolean
    error: ErrorResponseData | null
    context: ResultResponseData<'CondoWebAppGetLaunchParams'> | Record<string, never>
}
export function useLaunchParams (): IUseLaunchParams {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<IUseLaunchParams['error']>(null)
    const [context, setContext] = useState<IUseLaunchParams['context']>({})

    useEffect(() => {
        bridge
            .send('CondoWebAppGetLaunchParams')
            .then(setContext)
            .catch((err) => {
                setContext({})
                setError(err)
            })
            .finally(() => setLoading(false))
    }, [])

    return {
        loading,
        error,
        context,
    }
}