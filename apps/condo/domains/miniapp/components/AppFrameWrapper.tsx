import React, { useEffect } from 'react'

import bridge from '@open-condo/bridge'

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
        const tagId = 'fix-body-height-style-tag'
        const counterAttrName = 'same-style-requests-counter'

        let styleEl = document.querySelector(`#${tagId}`) as HTMLStyleElement | null

        if (styleEl) {
            const count = parseInt(styleEl.getAttribute(counterAttrName) || '0', 10)
            styleEl.setAttribute(counterAttrName, String(count + 1))
        } else {
            styleEl = document.createElement('style')
            styleEl.id = tagId
            styleEl.textContent = 'body{height:auto;}'
            styleEl.setAttribute(counterAttrName, '1')
            document.head.appendChild(styleEl)
        }

        return () => {
            const styleEl = document.querySelector(`#${tagId}`) as HTMLStyleElement | null
            if (styleEl) {
                const count = parseInt(styleEl.getAttribute(counterAttrName) || '1', 10)
                if (count <= 1) {
                    if (styleEl.parentNode) {
                        styleEl.parentNode.removeChild(styleEl)
                    }
                } else {
                    styleEl.setAttribute(counterAttrName, String(count - 1))
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