import React, { useMemo } from 'react'
import { useIntl } from 'react-intl'

import { useCachePersistor } from '@open-condo/apollo'
import { Card, List } from '@open-condo/ui'

import { useLaunchParams } from '@/domains/common/components/LaunchParamsContext'
import { useAuth } from '@/domains/user/components/AuthContext'

import { useGetResidentByIdQuery } from '@/gql'

export const ResidentCard: React.FC = () => {
    const intl = useIntl()
    const ListTitle = intl.formatMessage({ id: 'components.resident.residentCard.list.title' })
    const AddressLabel = intl.formatMessage({ id: 'components.resident.residentCard.list.items.address.label' })
    const UnitNameLabel = intl.formatMessage({ id: 'components.resident.residentCard.list.items.unitName.label' })
    const UnitTypeLabel = intl.formatMessage({ id: 'components.resident.residentCard.list.items.unitType.label' })
    const VerifiedLabel = intl.formatMessage({ id: 'components.resident.residentCard.list.items.isVerifiedByManagingCompany.label' })

    const { launchParams } = useLaunchParams()
    const { user } = useAuth()

    const { persistor } = useCachePersistor()
    const { data, loading } = useGetResidentByIdQuery({
        skip: !persistor || !launchParams || !launchParams.condoContextEntityId || launchParams.condoContextEntity !== 'Resident' || !user?.id,
        variables: {
            id: launchParams?.condoContextEntityId ?? '',
        },
    })

    const VerifiedValueText = useMemo(() => data?.resident?.isVerifiedByManagingCompany ? intl.formatMessage({ id: 'global.common.answers.yes' }) : intl.formatMessage({ id: 'global.common.answers.no' }), [data?.resident?.isVerifiedByManagingCompany, intl])
    const UnitTypeValueText = useMemo(() => data?.resident?.unitType ? intl.formatMessage({ id: `global.common.unitName.${data?.resident?.unitType}.full` }) : '-', [data?.resident?.unitType, intl])

    const listDataSource = useMemo(() => [
        { label: AddressLabel, value: data?.resident?.address ?? '-' },
        { label: UnitNameLabel, value: data?.resident?.unitName ?? '-' },
        { label: UnitTypeLabel, value: UnitTypeValueText },
        { label: VerifiedLabel, value: VerifiedValueText },
    ], [AddressLabel, UnitNameLabel, UnitTypeLabel, UnitTypeValueText, VerifiedLabel, VerifiedValueText, data?.resident?.address, data?.resident?.unitName])

    if (launchParams?.condoContextEntity !== 'Organization' || !launchParams.condoContextEntityId) {
        return null
    }

    if (!data?.resident) {
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