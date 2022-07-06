import React, { useCallback, useMemo, useState } from 'react'
import { useIntl } from '@core/next/intl'
import { Typography } from 'antd'

import { BaseMeterModalForm } from '../components/BaseMeterModal/BaseMeterModalForm'
import { Meter } from '../utils/clientSchema'
import { BuildingUnitSubType } from '@app/condo/schema'

export function useCreateMeterModal (organizationId: string, propertyId: string, unitName: string, unitType: BuildingUnitSubType, refetch) {
    const intl = useIntl()
    const AddMeterMessage = intl.formatMessage({ id: 'pages.condo.meter.AddMeter' })

    const [isCreateMeterModalVisible, setIsCreateMeterModalVisible] = useState<boolean>(false)
    const createMeterAction = Meter.useNewCreate({}, refetch)

    const handleMeterCreate = useCallback(values => {
        const numberOfTariffs = values.numberOfTariffs || 1
        createMeterAction({
            ...values,
            resource: { connect: { id: values.resource } },
            numberOfTariffs,
            organization: { connect: { id: organizationId } },
            property: { connect: { id: propertyId } },
            unitName,
            unitType,
        })
        setIsCreateMeterModalVisible(false)
    },
    [createMeterAction, organizationId, propertyId, unitName, unitType])

    const initialValues = useMemo(() => ({
        propertyId,
        unitName,
        unitType,
    }), [propertyId, unitName, unitType])

    const handleCancelModal = useCallback(() => setIsCreateMeterModalVisible(false),
        [setIsCreateMeterModalVisible])

    const CreateMeterModal = useCallback(() => {
        return (
            <BaseMeterModalForm
                propertyId={propertyId}
                unitName={unitName}
                unitType={unitType}
                initialValues={initialValues}
                ModalTitleMsg={<Typography.Title level={3}>{AddMeterMessage}</Typography.Title>}
                visible={isCreateMeterModalVisible}
                handleSubmit={handleMeterCreate}
                showCancelButton={false}
                cancelModal={handleCancelModal}
                centered
            />
        )
    }, [AddMeterMessage, handleCancelModal, handleMeterCreate, initialValues, isCreateMeterModalVisible])

    return useMemo(() => ({ CreateMeterModal, setIsCreateMeterModalVisible }), [CreateMeterModal])
}
