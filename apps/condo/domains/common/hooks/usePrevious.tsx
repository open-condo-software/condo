import { useEffect, useRef } from 'react'

/**
 * Monitoring some variable value
 * After it's change useEffect will update ref
 * But before that will be returned previous value
 * @param value to monitor
 */
export function usePrevious<T> (value: T): T {
    const ref = useRef<T>()

    useEffect(() => {
        ref.current = value
    }, [value])

    return ref.current
}