import React, { useRef, useEffect, useState } from 'react'
import { SortB2BAppsBy } from '@app/condo/schema'
import { B2BApp } from '@condo/domains/miniapp/utils/clientSchema'
import GlobalIframe from './GlobalIframe'
import { useHotkeys } from 'react-hotkeys-hook'

export const GlobalAppsContainer: React.FC = () => {
    const { objs } = B2BApp.useObjects({
        where: {
            isGlobal: true,
            isHidden: false,
        },
        sortBy: [SortB2BAppsBy.CreatedAtAsc],
    })

    const appUrls = objs.map(app => app.appUrl)
    const iframeRefs = useRef<Array<HTMLIFrameElement>>([])
    const [isDebug, setIsDebug] = useState(false)
    useHotkeys('d+e+b+u+g', () => setIsDebug(!isDebug), {}, [isDebug])

    useEffect(() => {
        iframeRefs.current = iframeRefs.current.slice(0, appUrls.length)
    }, [appUrls])

    return (
        <>
            {appUrls.map((url, index) => (
                <GlobalIframe
                    key={url}
                    pageUrl={url}
                    ref={el => iframeRefs.current[index] = el}
                    hidden={!isDebug}
                />
            ))}
        </>
    )
}