import { useGetEmployeeB2BAppRolesQuery, useHasBillingIntegrationsQuery } from '@app/condo/gql'
import pickBy from 'lodash/pickBy'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { useOrganization } from '@open-condo/next/organization'

import { PageComponentType } from '@condo/domains/common/types'


const ACCESS_REDIRECTS = {
    canReadAnalytics: '/reports',
    canReadProperties: '/property',
    canReadMeters: '/meter',
}

// NOTE: This empty page need for webview initial page
const InitialPage: PageComponentType = () => {
    const { persistor } = useCachePersistor()
    const router = useRouter()
    const { organization, role } = useOrganization()
    const organizationId = useMemo(() => organization?.id, [organization?.id])
    const roleId = useMemo(() => role?.id, [role?.id])

    const {
        data: hasBillingIntegrationsData,
        loading: hasBillingIntegrationsLoading,
    } = useHasBillingIntegrationsQuery({
        variables: {
            organization: { id: organizationId },
        },
        skip: !organizationId || !persistor,
    })
    const hasBilling = useMemo(() => hasBillingIntegrationsData?.acquiring?.length > 0 &&
        hasBillingIntegrationsData?.integrations?.length > 0, [
        hasBillingIntegrationsData?.acquiring?.length, hasBillingIntegrationsData?.integrations?.length,
    ])

    const {
        data: b2bAppRolesData,
        loading: b2bAppRolesLoading,
    } = useGetEmployeeB2BAppRolesQuery({
        variables: {
            employeeRole: { id: roleId },
        },
        skip: !roleId || !persistor,
    })
    const b2bAppIds = useMemo(() =>
        b2bAppRolesData?.b2bRoles?.map(b2bRole => b2bRole?.app?.id),
    [b2bAppRolesData?.b2bRoles])

    useEffect(() => {
        if (hasBillingIntegrationsLoading || b2bAppRolesLoading) return

        const userAccesses = Object.keys(
            pickBy(role, (value, key) => key.startsWith('canRead') && value === true)
        )
        const foundRedirect = Object.keys(ACCESS_REDIRECTS)
            .find(accessRedirect => userAccesses.includes(accessRedirect))
        if (foundRedirect) {
            router.replace(ACCESS_REDIRECTS[foundRedirect])
            return
        }

        const redirectToBilling = role.canReadPayments && role.canReadBillingReceipts && hasBilling
        if (redirectToBilling) {
            router.replace('/billing')
            return
        }

        if (b2bAppIds.length > 0) {
            router.replace(`/miniapps/${b2bAppIds?.[0]}`)
            return
        }
    }, [
        b2bAppIds, b2bAppRolesLoading, hasBilling,
        hasBillingIntegrationsLoading, organization, role, router,
    ])

    return <></>
}

export default InitialPage