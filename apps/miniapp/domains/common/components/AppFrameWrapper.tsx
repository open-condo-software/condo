import { css, Global } from '@emotion/react'
import React, { useEffect } from 'react'

import bridge from '@open-condo/bridge'

const BODY_RESIZE_STYLES = css`
  body {
    height: auto;
  }
`

export const AppFrameWrapper: React.FC<React.PropsWithChildren> = ({ children }) => {
    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            if (entries && entries.length) {
                bridge.send('CondoWebAppResizeWindow', { height: entries[0].target.clientHeight })
            }
        })
        observer.observe(document.body)

        return () => observer.unobserve(document.body)
    }, [])

    return (
        <>
            <Global styles={BODY_RESIZE_STYLES}/>
            {children}
        </>
    )
}