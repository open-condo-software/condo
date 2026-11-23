import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { Card, List } from '@open-condo/ui'

import { useLaunchParams } from '@/domains/common/components/LaunchParamsContext'
import { useTRPC, useQuery } from '@/domains/common/utils/trpc.client'

export const OrganizationCard: React.FC = () => {
    const intl = useIntl()
    const ListTitle = intl.formatMessage({ id: 'components.organization.organizationCard.list.title' })
    const NameLabel = intl.formatMessage({ id: 'components.organization.organizationCard.list.items.name.label' })
    const TinLabel = intl.formatMessage({ id: 'global.organization.tin.abbr' })
    const RoleLabel = intl.formatMessage({ id: 'components.organization.organizationCard.list.items.role.label' })

    const { launchParams } = useLaunchParams()
    const trpc = useTRPC()
    const { data, isLoading } = useQuery(trpc.organizationEmployee.getEmployeeByUserAndOrganization.queryOptions({
        organizationId: launchParams?.condoContextEntityId ?? '',
    }))

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

    if (isLoading) {
        return null
    }

    return (
        <Card>
            <List title={ListTitle} dataSource={listDataSource}/>
        </Card>
    )
}