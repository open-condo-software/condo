import { useGetB2BAppsQuery } from '@app/condo/gql'
import { SortB2BAppsBy } from '@app/condo/schema'
import get from 'lodash/get'
import isNull from 'lodash/isNull'
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useAuth } from '@open-condo/next/auth'
import { useOrganization } from '@open-condo/next/organization'

import { extractOrigin } from '@condo/domains/common/utils/url.utils'
import { IFrame } from '@condo/domains/miniapp/components/IFrame'
// import { B2BApp } from '@condo/domains/miniapp/utils/clientSchema'

import {
    useGlobalAppsFeaturesContext,
    IRequestFeatureHandler,
} from './GlobalAppsFeaturesContext'
import {useCachePersistor} from "@open-condo/apollo";


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
        data,
        loading,
        refetch,
    } = useGetB2BAppsQuery({
        variables: {
            where: {
                isGlobal: true,
                isHidden: false,
            },
            sortBy: [SortB2BAppsBy.CreatedAtAsc],
        },
        skip: !user || !organizationId || isLoading || !persistor,
    })
    const b2bApps = useMemo(() => data?.b2bApps.filter(Boolean) || [], [data?.b2bApps])

    // const { objs, refetch, loading } = B2BApp.useObjects({
    //     where: {
    //         isGlobal: true,
    //         isHidden: false,
    //     },
    //     sortBy: [SortB2BAppsBy.CreatedAtAsc],
    // }, { skip: !user || !organizationId || isLoading })

    const appUrls = b2bApps.map(app => app.appUrl)

    const iframeRefs = useRef<Array<HTMLIFrameElement>>([])
    const isGlobalAppsFetched = useRef(false)
    const [isDebug, setIsDebug] = useState(false)
    const { registerFeatures, addFeatureHandler, removeFeatureHandler, features } = useGlobalAppsFeaturesContext()

    useHotkeys('d+e+b+u+g', () => setIsDebug(!isDebug), {}, [isDebug])

    useEffect(() => {
        iframeRefs.current = iframeRefs.current.slice(0, appUrls.length)
    }, [appUrls])

    useDeepCompareEffect(() => {
        const globalFeatures = b2bApps.reduce((registeredFeatures, app) => {
            const appOrigin = extractOrigin(app.appUrl)
            const availableFeatures = (app.features || []).filter(featureName => !(featureName in registeredFeatures))
            const appFeatures = Object.assign({}, ...availableFeatures.map(featureName => ({ [featureName]: appOrigin })))

            return {
                ...registeredFeatures,
                ...appFeatures,
            }
        }, {})
        registerFeatures(globalFeatures)
    }, [registerFeatures, b2bApps])

    const handleFeatureRequest: IRequestFeatureHandler = useCallback((context) => {
        const receiverOrigin = get(features, context.feature)
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

    useEffect(() => {
        if (!isGlobalAppsFetched.current && !loading && !isNull(user) && !isLoading) {
            // Зачем нужен этот фетч?
            // refetch()
            isGlobalAppsFetched.current = true
        }
    }, [user, loading, isLoading])

    // Global miniapps allowed only for authenticated employees
    if (!user || !organizationId) {
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
