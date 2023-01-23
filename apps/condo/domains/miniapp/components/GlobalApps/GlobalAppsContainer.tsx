import { SortB2BAppsBy } from '@app/condo/schema'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useAuth } from '@open-condo/next/auth'

import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'
import { B2BApp } from '@condo/domains/miniapp/utils/clientSchema'

import {
    useGlobalAppsFeaturesContext,
    IRequestFeatureHandler,
} from './GlobalAppsFeaturesContext'

const REQUEST_FEATURE_MESSAGE_NAME = 'CondoWebAppFeatureRequest'

export const GlobalAppsContainer: React.FC = () => {
    const { user } = useAuth()
    const { objs, refetch, loading } = B2BApp.useObjects({
        where: {
            isGlobal: true,
            isHidden: false,
        },
        sortBy: [SortB2BAppsBy.CreatedAtAsc],
    })

    const appUrls = objs.map(app => app.appUrl)


    const iframeRefs = useRef<Array<HTMLIFrameElement>>([])
    const isGlobalAppsFetched = useRef(false)
    const [isDebug, setIsDebug] = useState(false)
    const { registerFeatures, addFeatureHandler, removeFeatureHandler, features } = useGlobalAppsFeaturesContext()

    useHotkeys('d+e+b+u+g', () => setIsDebug(!isDebug), {}, [isDebug])

    useEffect(() => {
        iframeRefs.current = iframeRefs.current.slice(0, appUrls.length)
    }, [appUrls])

    useDeepCompareEffect(() => {
        const globalFeatures = objs.reduce((registeredFeatures, app) => {
            const appOrigin = extractOrigin(app.appUrl)
            const availableFeatures = (app.features || []).filter(featureName => !(featureName in registeredFeatures))
            const appFeatures = Object.assign({}, ...availableFeatures.map(featureName => ({ [featureName]: appOrigin })))

            return {
                ...registeredFeatures,
                ...appFeatures,
            }
        }, {})
        registerFeatures(globalFeatures)
    }, [registerFeatures, objs])

    const handleFeatureRequest: IRequestFeatureHandler = useCallback((context) => {
        const receiverOrigin = get(features, context.feature)
        if (receiverOrigin) {
            for (const iframe of iframeRefs.current) {
                if (iframe) {
                    const origin = extractOrigin(iframe.src)
                    if (receiverOrigin === origin) {
                        const targetWindow = get(iframe, 'contentWindow', null)
                        if (origin && targetWindow) {
                            targetWindow.postMessage({
                                type: REQUEST_FEATURE_MESSAGE_NAME,
                                data: context,
                            }, origin)
                        }
                    }
                }
            }
        }
    }, [features])

    useEffect(() => {
        addFeatureHandler(handleFeatureRequest)

        return () => {
            removeFeatureHandler(handleFeatureRequest)
        }
    }, [
        handleFeatureRequest,
        addFeatureHandler,
        removeFeatureHandler,
    ])

    useEffect(() => {
        if (!isGlobalAppsFetched.current && !loading && !isNull(user)) {
            refetch()
            isGlobalAppsFetched.current = true
        }
    }, [user, loading])

    // Global miniapps allowed only for authenticated users
    if (!user) {
        return null
    }

    return (
        <>
            {appUrls.map((url, index) => (
                <IFrame
                    key={url}
                    src={url}
                    reloadScope='user'
                    ref={el => iframeRefs.current[index] = el}
                    hidden={!isDebug}
                />
            ))}
        </>
    )
}
