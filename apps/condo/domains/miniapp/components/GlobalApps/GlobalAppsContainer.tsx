import { useGetGlobalB2BAppsQuery } from '@app/condo/gql'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

import { useCachePersistor } from '@open-condo/apollo'
import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { nonNull } from '@open-condo/miniapp-utils/helpers/collections'
import { extractMiniappMetadata } from '@open-condo/miniapp-utils/helpers/iframe'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import { B2BAppFrame } from '@condo/domains/miniapp/components/B2BAppFrame'

import { IRequestFeatureHandler, useGlobalAppsFeaturesContext } from './GlobalAppsFeaturesContext'

import type { B2BAppFrameProps } from '@condo/domains/miniapp/components/B2BAppFrame'



const REQUEST_FEATURE_MESSAGE_NAME = 'CondoWebAppFeatureRequest'
const ORGANIZATION_CHANGE_MESSAGE_NAME = 'CondoWebAppOrganizationChange'

export const GlobalAppsContainer: React.FC = () => {
    // TODO(DOMA-5194): Clean this mess:
    //  1. Move constants like REQUEST_FEATURE_MESSAGE_NAME, ORGANIZATION_CHANGE_MESSAGE_NAME to incoming bridge events
    //  so miniapps can use bridge.subscribe with Type safety on them!
    const { user, isLoading } = useAuth()
    const { organization, isLoading: organizationLoading } = useOrganization()
    const organizationId = organization?.id || null
    const { persistor } = useCachePersistor()
    const iframeRefs = useRef<Record<string, React.RefObject<HTMLIFrameElement>>>({})

    const {
        data: b2bAppsData,
    } = useGetGlobalB2BAppsQuery({
        skip: !user || !organizationId || organizationLoading || isLoading || !persistor,
    })
    const b2bApps = useMemo(() => {
        const apps = (b2bAppsData?.b2bApps?.filter(nonNull) || []).filter(app => app.appUrl)

        return apps.map(app => ({
            id: app.id,
            appUrl: app.appUrl,
            metadata: extractMiniappMetadata(app),
            features: app.features,
        }))
    }, [b2bAppsData?.b2bApps])

    const [isDebug, setIsDebug] = useState(false)
    const { registerFeatures, addFeatureHandler, removeFeatureHandler, features } = useGlobalAppsFeaturesContext()

    useHotkeys('d+e+b+u+g', () => setIsDebug(!isDebug), {}, [isDebug])

    const onFrameRegister: Required<B2BAppFrameProps>['onRegister'] = useCallback((event) => {
        const { frameId, frameRef } = event
        iframeRefs.current[frameId] = frameRef

        return () => {
            delete iframeRefs.current[frameId]
        }
    }, [])

    const GlobalApps = useMemo(() => {
        return b2bApps.map(app => (
            <B2BAppFrame
                key={app.id}
                src={app.appUrl}
                reloadScope='user'
                onRegister={onFrameRegister}
                hidden={!isDebug}
            />
        ))
    }, [b2bApps, isDebug, onFrameRegister])

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
            for (const { current: iframe } of Object.values(iframeRefs.current)) {
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
            for (const { current: iframe } of Object.values(iframeRefs.current)) {
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

    return GlobalApps
}
