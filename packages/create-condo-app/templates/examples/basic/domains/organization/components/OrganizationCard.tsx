import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { useCachePersistor } from '@open-condo/apollo'
import { Card, List } from '@open-condo/ui'

import { useLaunchParams } from '@/domains/common/components/LaunchParamsContext'
import { useAuth } from '@/domains/user/components/AuthContext'

import { useGetEmployeeByUserAndOrganizationQuery } from '@/gql'

export const OrganizationCard: React.FC = () => {
    const intl = useIntl()
    const ListTitle = intl.formatMessage({ id: 'components.organization.organizationCard.list.title' })
    const NameLabel = intl.formatMessage({ id: 'components.organization.organizationCard.list.items.name.label' })
    const TinLabel = intl.formatMessage({ id: 'global.organization.tin.abbr' })
    const RoleLabel = intl.formatMessage({ id: 'components.organization.organizationCard.list.items.role.label' })

    const { launchParams } = useLaunchParams()
    const { user } = useAuth()

    const { persistor } = useCachePersistor()
    const { data, loading } = useGetEmployeeByUserAndOrganizationQuery({
        skip: !persistor || !launchParams || !launchParams.condoContextEntityId || launchParams.condoContextEntity !== 'Organization' || !user?.id,
        variables: {
            organizationId: launchParams?.condoContextEntityId ?? '',
            userId: user?.id ?? '',
        },
    })

    const employee = useMemo(() => data?.employees?.[0], [data?.employees])

    const listDataSource = useMemo(() => [
        { label: NameLabel, value: employee?.organization?.name ?? '-' },
        { label: TinLabel, value: employee?.organization?.tin ?? '-' },
        { label: RoleLabel, value: employee?.role?.name ?? '-' },
    ], [NameLabel, RoleLabel, TinLabel, employee?.organization?.name, employee?.organization?.tin, employee?.role?.name])

    if (launchParams?.condoContextEntity !== 'Organization' || !launchParams.condoContextEntityId) {
        return null
    }

    if (!data?.employees?.length) {
        return null
    }

    if (loading) {
        return null
    }

    return (
        <Card>
            <List title={ListTitle} dataSource={listDataSource}/>
        </Card>
    )
}