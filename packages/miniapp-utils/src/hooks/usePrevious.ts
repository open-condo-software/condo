// SRC: https://github.com/streamich/react-use/blob/master/src/usePrevious.ts

import { useEffect, useRef } from 'react'

export function usePrevious<T> (state: T): T | undefined {
    const ref = useRef<T>()

    // Runs all the times, but after rendering, so ref.current update happens after return
    useEffect(() => {
        ref.current = state
    })

    return ref.current
}