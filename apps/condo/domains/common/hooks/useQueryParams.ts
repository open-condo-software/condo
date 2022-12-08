import { useRouter } from 'next/router'
import { useMemo } from 'react'

export const useQueryParams = (): Record<string, any> => {
    const router = useRouter()
    const { query } = router

    return useMemo(() => {
        const parsed = {}

        for (const key in query) {
            try {
                parsed[key] = JSON.parse((query as Record<string, string>)[key])
            } catch (e) {
                console.warn(`Failed to parse key ${key} from URL parameters`, e)
            }
        }

        return parsed
    }, [query])
}
