import { useEffect, useRef } from 'react'

/**
 * Monitor some `variable` value
 * Until `variable` is changed its previous value would be returned
 * Changing the value of a variable will trigger an async ref change via useEffect
 * At this point, the return value will still be the same
 * This will catch the update state where value !== return value
 * After useEffect has finished, the input and output value will be the same again
 * @param value to monitor
 */
export function usePrevious<T> (value: T): T {
    const ref = useRef<T>()

    useEffect(() => {
        ref.current = value
    }, [value])

    return ref.current
}