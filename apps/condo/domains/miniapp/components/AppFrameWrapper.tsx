import React, { useEffect } from 'react'

import bridge from '@open-condo/bridge'

const TAG_ID = 'condo-app-frame-wrapper-styles'
const COUNTER_DATA_ATTR_NAME = 'data-same-style-requests-counter'

export const AppFrameWrapper: React.FC = ({ children }) => {
    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            if (entries && entries.length) {
                bridge.send('CondoWebAppResizeWindow', { height: entries[0].target.clientHeight })
            }
        })
        observer.observe(document.body)

        return () => observer.unobserve(document.body)
    }, [])

    useEffect(() => {
        let styleElement: HTMLStyleElement | null = document.querySelector(`style#${TAG_ID}`)

        if (styleElement) {
            const count = parseInt(styleElement.getAttribute(COUNTER_DATA_ATTR_NAME) || '0', 10)
            styleElement.setAttribute(COUNTER_DATA_ATTR_NAME, String(count + 1))
        } else {
            styleElement = document.createElement('style')
            styleElement.id = TAG_ID
            styleElement.textContent = 'body{height:auto;}'
            styleElement.setAttribute(COUNTER_DATA_ATTR_NAME, '1')
            document.head.appendChild(styleElement)
        }

        return () => {
            const styleEl: HTMLStyleElement | null = document.querySelector(`style#${TAG_ID}`)
            if (styleEl) {
                const count = parseInt(styleEl.getAttribute(COUNTER_DATA_ATTR_NAME) || '1', 10)
                if (count <= 1) {
                    if (styleEl.parentNode) {
                        styleEl.parentNode.removeChild(styleEl)
                    }
                } else {
                    styleEl.setAttribute(COUNTER_DATA_ATTR_NAME, String(count - 1))
                }
            }
        }
    }, [])

    return (
        <>
            {children}
        </>
    )
}