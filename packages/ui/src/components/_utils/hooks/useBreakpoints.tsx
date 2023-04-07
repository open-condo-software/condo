import { useEffect, useRef } from 'react'

import ResponsiveObserve, { ScreenMap, BREAKPOINTS } from '../responsiveObserve'

import { useForceUpdate } from './index'

// NOTE: In ssr we do not know the width of the window, so we set all breakpoints to true by default
const DEFAULT_BREAKPOINTS_VALUE = BREAKPOINTS.reduce((acc, curr) => {
    acc[curr] = true
    return acc
}, {} as ScreenMap)

export function useBreakpoints (refreshOnChange = true): ScreenMap {
    const screensRef = useRef<ScreenMap>(DEFAULT_BREAKPOINTS_VALUE)
    const forceUpdate = useForceUpdate()

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const token = ResponsiveObserve.subscribe(supportScreens => {
                screensRef.current = supportScreens
                if (refreshOnChange) {
                    forceUpdate()
                }
            })

            return () => ResponsiveObserve.unsubscribe(token)
        }
    }, [])

    return screensRef.current
}