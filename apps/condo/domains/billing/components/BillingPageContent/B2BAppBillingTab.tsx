import { useGetB2BAppContextsByOrgQuery, useCreateB2BAppContextMutation } from '@app/condo/gql'
import get from 'lodash/get'
import React, { useEffect, useRef, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useOrganization } from '@open-condo/next/organization'

import { BlockedB2BAppTab } from '@condo/domains/billing/components/BillingPageContent/BlockedB2BAppTab'
import { Loader } from '@condo/domains/common/components/Loader'
import { B2BAppFrame } from '@condo/domains/miniapp/components/B2BAppFrame'
import { useOrganizationSubscription } from '@condo/domains/subscription/hooks'


type B2BAppBillingTabProps = {
    appId: string
    appUrl: string
    shortDescription?: string | null
}

export const B2BAppBillingTab: React.FC<B2BAppBillingTabProps> = ({ appId, appUrl, shortDescription }) => {
    const userOrganization = useOrganization()
    const organizationId: string = get(userOrganization, ['organization', 'id'], '')

    const { isB2BAppEnabled, hasSubscriptionsFeature, loading: subscriptionLoading } = useOrganizationSubscription()
    const isBlocked = hasSubscriptionsFeature && !isB2BAppEnabled(appId)

    const { data, loading, refetch } = useGetB2BAppContextsByOrgQuery({
        variables: { organizationId },
        skip: !organizationId || isBlocked || subscriptionLoading,
        fetchPolicy: 'network-only',
    })

    const contextExists = (data?.contexts || []).some(c => c?.app?.id === appId)
    const creatingRef = useRef(false)
    const [createError, setCreateError] = useState<Error | null>(null)

    const [createB2BAppContext] = useCreateB2BAppContextMutation()

    useEffect(() => {
        if (isBlocked || subscriptionLoading || contextExists || creatingRef.current || !organizationId || data === undefined) return

        creatingRef.current = true
        setCreateError(null)
        createB2BAppContext({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    app: { connect: { id: appId } },
                    organization: { connect: { id: organizationId } },
                },
            },
        })
            .then(() => refetch())
            .catch((err) => {
                creatingRef.current = false
                setCreateError(err)
            })
    }, [isBlocked, subscriptionLoading, contextExists, organizationId, appId, createB2BAppContext, data, refetch])

    if (isBlocked) {
        return <BlockedB2BAppTab appId={appId} shortDescription={shortDescription} />
    }

    if (createError) {
        return null
    }

    if (loading || !contextExists) {
        return <Loader />
    }

    return (
        <div style={{ minHeight: '100%' }}>
            <B2BAppFrame src={appUrl} actions/>
        </div>
    )
}
