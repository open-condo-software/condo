import { useEffect, useRef } from 'react'

import { ScreenMap } from '../responsiveObserve'
import ResponsiveObserve from '../responsiveObserve'

import { useForceUpdate } from './index'

export function useBreakpoints (refreshOnChange = true): ScreenMap {
    const screensRef = useRef<ScreenMap>({})
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