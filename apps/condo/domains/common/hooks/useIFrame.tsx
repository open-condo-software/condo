import React from 'react'
import { extractOrigin } from '@condo/domains/common/utils/url.utils'

type useIFrameType = (pageUrl: string, options: optionsType) => JSX.Element
type optionsType = {
    withLoader?: boolean,
}

export const useIFrame: useIFrameType = (pageUrl: string, options: optionsType = {}) => {
    const pageOrigin = extractOrigin(pageUrl)

    const handleMessage = (event) => {
        if (event.origin !== pageOrigin) return
        if (event.data && typeof event.data !== 'object') return
        // ClOSS
    }


    return <iframe src={pageUrl}/>
}