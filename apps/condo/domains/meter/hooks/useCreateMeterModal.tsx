import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import React, { useCallback, useEffect, useState } from 'react'
import { StoreValue } from 'rc-field-form/lib/interface'
import { useIntl } from '@core/next/intl'
import { ResourcesList } from '../components/createMeterModal/ResourcesList'
import { BaseMeterModalForm } from '../components/createMeterModal/BaseMeterModalForm'
import { Meter, resourceIdToCreateMeterTitleIdMap } from '../utils/clientSchema'
import { FormattedMessage } from 'react-intl'
import { IMeterResourceUIState } from '../utils/clientSchema/MeterResource'
import { Form, Input, Modal, Typography } from 'antd'
import { IMeterFormState, IMeterUIState } from '../utils/clientSchema/Meter'
import { get } from 'lodash'

type MeterInfoModalTitleProps = {
    resourceId: string
}

const MeterInfoModalTitle = ({ resourceId }: MeterInfoModalTitleProps) => {
    const intl = useIntl()
    const ResourceTitle = intl.formatMessage({ id: resourceIdToCreateMeterTitleIdMap[resourceId] })

    return (
        <FormattedMessage
            id='pages.condo.meter.AddMeterModalTitleTemplate'
            values={{
                resource: ResourceTitle,
            }}
        />
    )
}

type CreateMeterModalProps = {
    addMeterToFormAction: (defaultValue?: StoreValue, insertIndex?: number) => void
    resources: IMeterResourceUIState[]
    newMeters: IMeterFormState[]
}

export const useCreateMeterModal = (organization, property, unitName, refetch) => {
    const intl = useIntl()
    const MeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.NumberOfMeter' })
    const [isCreateMeterModalVisible, setIsCreateMeterModalVisible] = useState<boolean>(false)
    const createMeterAction = Meter.useCreate(
        {},
        () => {
            refetch()
        })

    const handleMeterCreate = useCallback(values => {
        const numberOfTariffs = values.numberOfTariffs ? values.numberOfTariffs : 1
        createMeterAction({ ...values, numberOfTariffs, organization, property, unitName })
        setIsCreateMeterModalVisible(false)
    },
    [createMeterAction, organization, property, unitName])

    const CreateMeterModal = useCallback(() => {
        return (
            <BaseMeterModalForm
                ModalTitleMsg={<Typography.Title level={3}>{MeterNumberMessage} Добавить прибор учета </Typography.Title>}
                visible={isCreateMeterModalVisible}
                handleSubmit={handleMeterCreate}
                showCancelButton={false}
                cancelModal={() => setIsCreateMeterModalVisible(false)}
                ModalSaveButtonLabelMsg={'Сохранить'}
                centered
                modalProps={{
                    width: 570,
                }}
            />
        )
    }, [MeterNumberMessage, handleMeterCreate, isCreateMeterModalVisible])

    return { CreateMeterModal, setIsCreateMeterModalVisible }
}