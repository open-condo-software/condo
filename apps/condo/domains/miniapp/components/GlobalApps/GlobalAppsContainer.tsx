import { useGetGlobalB2BAppsQuery } from '@app/condo/gql'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

import { useCachePersistor } from '@open-condo/apollo'
import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'

import { IRequestFeatureHandler, useGlobalAppsFeaturesContext } from './GlobalAppsFeaturesContext'


const REQUEST_FEATURE_MESSAGE_NAME = 'CondoWebAppFeatureRequest'
const ORGANIZATION_CHANGE_MESSAGE_NAME = 'CondoWebAppOrganizationChange'

export const GlobalAppsContainer: React.FC = () => {
    // TODO(DOMA-5194): Clean this mess:
    //  1. refs are using only for sending messages...It should be part of PostMessageProvider
    //  (Provider addOrigin must be changed to addFrame or something like that)
    //  2. Move constants like REQUEST_FEATURE_MESSAGE_NAME, ORGANIZATION_CHANGE_MESSAGE_NAME to incoming bridge events
    //  so miniapps can use bridge.subscribe with Type safety on them!
    const { user, isLoading } = useAuth()
    const { organization } = useOrganization()
    const organizationId = organization?.id || null
    const { persistor } = useCachePersistor()

    const {
        data: b2bAppsData,
    } = useGetGlobalB2BAppsQuery({
        skip: !user || !organizationId || isLoading || !persistor,
    })
    const b2bApps = useMemo(() => b2bAppsData?.b2bApps?.filter(Boolean) || [], [b2bAppsData?.b2bApps])

    const appUrls = b2bApps.map(app => app?.appUrl)

    const iframeRefs = useRef<Array<HTMLIFrameElement>>([])
    const [isDebug, setIsDebug] = useState(false)
    const { registerFeatures, addFeatureHandler, removeFeatureHandler, features } = useGlobalAppsFeaturesContext()

    useHotkeys('d+e+b+u+g', () => setIsDebug(!isDebug), {}, [isDebug])

    useEffect(() => {
        iframeRefs.current = iframeRefs.current.slice(0, appUrls.length)
    }, [appUrls])

    useDeepCompareEffect(() => {
        const globalFeatures = b2bApps.reduce((registeredFeatures, app) => {
            const appOrigin = extractOrigin(app?.appUrl)
            const availableFeatures = (app?.features || []).filter(featureName => !(featureName in registeredFeatures))
            const appFeatures = Object.assign({}, ...availableFeatures.map(featureName => ({ [featureName]: appOrigin })))

            return {
                ...registeredFeatures,
                ...appFeatures,
            }
        }, {})
        registerFeatures(globalFeatures)
    }, [registerFeatures, b2bApps])

    const handleFeatureRequest: IRequestFeatureHandler = useCallback((context) => {
        const receiverOrigin = features[context.feature] || null
        if (receiverOrigin) {
            for (const iframe of iframeRefs.current) {
                if (iframe) {
                    const origin = extractOrigin(iframe.src)
                    if (receiverOrigin === origin) {
                        const targetWindow = iframe?.contentWindow || null
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
        if (organizationId) {
            for (const iframe of iframeRefs.current) {
                if (iframe) {
                    const iframeWindow = iframe?.contentWindow || null
                    const iframeOrigin = extractOrigin(iframe.src)
                    if (iframeOrigin && iframeWindow) {
                        iframeWindow.postMessage({
                            type: ORGANIZATION_CHANGE_MESSAGE_NAME,
                            data: {
                                // TODO(DOMA-5194): May be condoOrganizationId to be consistent with query-params?
                                organizationId,
                            },
                        }, iframeOrigin)
                    }
                }
            }
        }
    }, [organizationId])

    // Global miniapps allowed only for authenticated employees
    if (!user || !organizationId) {
        return null
    }

    return (
        <>
            {appUrls.map((url, index) => (  
                <IFrame
                    key={url || index}
                    src={url || ''}
                    reloadScope='user'
                    ref={el => void (iframeRefs.current[index] = el as HTMLIFrameElement)}
                    hidden={!isDebug}
                />
            ))}
        </>
    )
}
