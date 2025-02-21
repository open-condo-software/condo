// Minified version of https://github.com/juliencrn/usehooks-ts/blob/master/packages/usehooks-ts/src/useIntersectionObserver/useIntersectionObserver.ts

import { useEffect, useRef, useState } from 'react'

type State = {
    isIntersecting: boolean
    entry?: IntersectionObserverEntry
}

type UseIntersectionObserverOptions = {
    threshold?: number
    onChange?: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void
    root?: Element | Document | null
    rootMargin?: string
}

type IntersectionReturnType = {
    ref: (node?: Element | null) => void
    isIntersecting: boolean
    entry?: IntersectionObserverEntry
}

export function useIntersectionObserver ({
    threshold = 0,
    root = null,
    rootMargin = '0%',
    onChange,
}: UseIntersectionObserverOptions = {}): IntersectionReturnType {
    const [ref, setRef] = useState<Element | null | undefined>(null)
    const [state, setState] = useState<State>(() => ({
        isIntersecting: false,
        entry: undefined,
    }))

    const callbackRef = useRef<UseIntersectionObserverOptions['onChange']>()
    callbackRef.current = onChange

    useEffect(() => {
        if (!ref) return
        if (!('IntersectionObserver' in window)) return

        const observer = new IntersectionObserver((entries) => {
            const thresholds = observer.thresholds

            entries.forEach((entry) => {
                const isIntersecting =
                    entry.isIntersecting &&
                    thresholds.some(threshold => entry.intersectionRatio >= threshold)

                setState({ isIntersecting, entry })

                if (callbackRef.current) {
                    callbackRef.current(isIntersecting, entry)
                }
            })
        }, { threshold, root, rootMargin })

        observer.observe(ref)

        return () => {
            observer.disconnect()
        }
    }, [ref, root, rootMargin, threshold])

    // ensures that if the observed element changes, the intersection observer is reinitialized
    const prevRef = useRef<Element | null>(null)

    useEffect(() => {
        if (
            !ref &&
            state.entry?.target &&
            prevRef.current !== state.entry.target
        ) {
            prevRef.current = state.entry.target
            setState({ isIntersecting: false, entry: undefined })
        }
    }, [ref, state.entry])

    return {
        entry: state.entry,
        ref: setRef,
        isIntersecting: state.isIntersecting,
    }
}