import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { Card, List } from '@open-condo/ui'

import { useLaunchParams } from '@/domains/common/components/LaunchParamsContext'
import { useQuery, useTRPC } from '@/domains/common/utils/trpc.client'

export const ResidentCard: React.FC = () => {
    const intl = useIntl()
    const ListTitle = intl.formatMessage({ id: 'components.resident.residentCard.list.title' })
    const AddressLabel = intl.formatMessage({ id: 'components.resident.residentCard.list.items.address.label' })
    const UnitNameLabel = intl.formatMessage({ id: 'components.resident.residentCard.list.items.unitName.label' })
    const UnitTypeLabel = intl.formatMessage({ id: 'components.resident.residentCard.list.items.unitType.label' })
    const VerifiedLabel = intl.formatMessage({ id: 'components.resident.residentCard.list.items.isVerifiedByManagingCompany.label' })

    const { launchParams } = useLaunchParams()

    const trpc = useTRPC()
    const { data, isLoading } = useQuery(trpc.resident.getResidentById.queryOptions({
        id: launchParams?.condoContextEntityId ?? '',
    }))

    const VerifiedValueText = useMemo(() => data?.resident?.isVerifiedByManagingCompany ? intl.formatMessage({ id: 'global.common.answers.yes' }) : intl.formatMessage({ id: 'global.common.answers.no' }), [data?.resident?.isVerifiedByManagingCompany, intl])
    const UnitTypeValueText = useMemo(() => data?.resident?.unitType ? intl.formatMessage({ id: `global.common.unitName.${data?.resident?.unitType}.full` }) : '-', [data?.resident?.unitType, intl])

    const listDataSource = useMemo(() => [
        { label: AddressLabel, value: data?.resident?.address ?? '-' },
        { label: UnitNameLabel, value: data?.resident?.unitName ?? '-' },
        { label: UnitTypeLabel, value: UnitTypeValueText },
        { label: VerifiedLabel, value: VerifiedValueText },
    ], [AddressLabel, UnitNameLabel, UnitTypeLabel, UnitTypeValueText, VerifiedLabel, VerifiedValueText, data?.resident?.address, data?.resident?.unitName])

    if (launchParams?.condoContextEntity !== 'Resident' || !launchParams.condoContextEntityId) {
        return null
    }

    if (!data?.resident) {
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