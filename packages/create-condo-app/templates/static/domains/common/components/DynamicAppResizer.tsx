import React, { useEffect } from 'react'

import bridge from '@open-condo/bridge'

export const DynamicAppResizer: React.FC<React.PropsWithChildren> = ({ children }) => {
    useEffect(() => {
        if (typeof document !== 'undefined') {
            const observer = new ResizeObserver((entries) => {
                if (entries && entries.length) {
                    void bridge.send('CondoWebAppResizeWindow', { height: entries[0].target.clientHeight })
                }
            })
            observer.observe(document.body)

            return () => observer.unobserve(document.body)
        }
    }, [])

    return <>{children}</>
}