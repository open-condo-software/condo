import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import get from 'lodash/get'
import { MutationEmitter, MUTATION_RESULT_EVENT } from '@core/next/apollo'
import { SortB2BAppsBy } from '@app/condo/schema'
import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import { sendMessage } from '@condo/domains/common/utils/iframe.utils'
import { B2BApp } from '@condo/domains/miniapp/utils/clientSchema'
import GlobalIframe from './GlobalIframe'

const MUTATION_RESULT_MESSAGE_NAME = 'CondoWebUserEventResult'

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

    const handleMutationResult = useCallback((payload) => {
        for (const iframe of iframeRefs.current) {
            const origin = extractOrigin(iframe.src)
            const targetWindow = get(iframe, ['contentWindow'], null)
            if (origin && targetWindow) {
                sendMessage({
                    type: MUTATION_RESULT_MESSAGE_NAME,
                    data: payload,
                }, targetWindow, origin)
            }
        }
    }, [])

    useEffect(() => {
        MutationEmitter.on(MUTATION_RESULT_EVENT, handleMutationResult)
        return () => {
            MutationEmitter.off(MUTATION_RESULT_EVENT, handleMutationResult)
        }
    }, [handleMutationResult])

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