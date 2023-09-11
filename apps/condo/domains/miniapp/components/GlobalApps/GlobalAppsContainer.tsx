import { SortB2BAppContextsBy, SortB2BAppsBy } from '@app/condo/schema'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'
import { B2BApp, B2BAppContext } from '@condo/domains/miniapp/utils/clientSchema'

import {
    useGlobalAppsFeaturesContext,
    IRequestFeatureHandler,
} from './GlobalAppsFeaturesContext'

const REQUEST_FEATURE_MESSAGE_NAME = 'CondoWebAppFeatureRequest'
const ORGANIZATION_CHANGE_MESSAGE_NAME = 'CondoWebAppOrganizationChange'

export const GlobalAppsContainer: React.FC = () => {
    // TODO(DOMA-5194): Clean this mess:
    //  1. refs are using only for sending messages...It should be part of PostMessageProvider
    //  (Provider addOrigin must be changed to addFrame or something like that)
    //  2. Move constants like REQUEST_FEATURE_MESSAGE_NAME, ORGANIZATION_CHANGE_MESSAGE_NAME to incoming bridge events
    //  so miniapps can use bridge.subscribe with Type safety on them!
    const { user } = useAuth()
    const { organization } = useOrganization()
    const organizationId = get(organization, 'id', null)


    const { objs, refetch, loading } = B2BAppContext.useObjects({
        where: {
            app: {
                globalUrl_not: null,
                isHidden: false,
            },
            organization: { id: organizationId },
            status: 'Finished',
        },
        sortBy: [SortB2BAppContextsBy.CreatedAtAsc],
    })

    const connectedGlobalApps = useMemo(() => objs.map(context => context.app), [objs])
    const appUrls = useMemo(() => connectedGlobalApps.map(app => app.globalUrl), [connectedGlobalApps])

    const iframeRefs = useRef<Array<HTMLIFrameElement>>([])
    const isGlobalAppsFetched = useRef(false)
    const [isDebug, setIsDebug] = useState(false)
    const { registerFeatures, addFeatureHandler, removeFeatureHandler, features } = useGlobalAppsFeaturesContext()

    useHotkeys('d+e+b+u+g', () => setIsDebug(!isDebug), {}, [isDebug])

    useEffect(() => {
        iframeRefs.current = iframeRefs.current.slice(0, appUrls.length)
    }, [appUrls])

    useDeepCompareEffect(() => {
        const globalFeatures = connectedGlobalApps.reduce((registeredFeatures, app) => {
            const appOrigin = extractOrigin(app.globalUrl)
            const availableFeatures = (app.features || []).filter(featureName => !(featureName in registeredFeatures))
            const appFeatures = Object.assign({}, ...availableFeatures.map(featureName => ({ [featureName]: appOrigin })))

            return {
                ...registeredFeatures,
                ...appFeatures,
            }
        }, {})
        registerFeatures(globalFeatures)
    }, [registerFeatures, connectedGlobalApps])

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
        if (organizationId) {
            for (const iframe of iframeRefs.current) {
                if (iframe) {
                    const iframeWindow = get(iframe, 'contentWindow', null)
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

    useEffect(() => {
        if (!isGlobalAppsFetched.current && !loading && !isNull(user)) {
            refetch()
            isGlobalAppsFetched.current = true
        }
    }, [user, loading])

    // // Global miniapps allowed only for authenticated users
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
