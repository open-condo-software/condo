import React, { useCallback, useMemo, useState } from 'react'
import { useIntl } from '@core/next/intl'
import { Typography } from 'antd'

import { BaseMeterModalForm } from '../components/BaseMeterModal/BaseMeterModalForm'
import { Meter } from '../utils/clientSchema'

export function useCreateMeterModal (organizationId: string, propertyId: string, unitName: string, refetch) {
    const intl = useIntl()
    const AddMeterMessage = intl.formatMessage({ id: 'pages.condo.meter.AddMeter' })

    const [isCreateMeterModalVisible, setIsCreateMeterModalVisible] = useState<boolean>(false)
    const createMeterAction = Meter.useCreate({}, refetch)

    const handleMeterCreate = useCallback(values => {
        const numberOfTariffs = values.numberOfTariffs || 1
        createMeterAction({ ...values, numberOfTariffs, organization: organizationId, property: propertyId, unitName })
        setIsCreateMeterModalVisible(false)
    },
    [createMeterAction, organizationId, propertyId, unitName])

    const initialValues = useMemo(() => ({
        propertyId,
        unitName,
    }), [propertyId, unitName])

    const handleCancelModal = useCallback(() => setIsCreateMeterModalVisible(false),
        [setIsCreateMeterModalVisible])

    const CreateMeterModal = useCallback(() => {
        return (
            <BaseMeterModalForm
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
