import React, { useCallback, useMemo, useState } from 'react'
import { Typography } from 'antd'
import dayjs from 'dayjs'
import get from 'lodash/get'
import pick from 'lodash/pick'
import { useIntl } from '@core/next/intl'

import { Meter as MeterType } from '@app/condo/schema'
import {
    DeleteButtonWithConfirmModal,
} from '@condo/domains/common/components/DeleteButtonWithConfirmModal'
import { CustomButtonProps } from '@condo/domains/common/components/Button'

import { BaseMeterModalForm } from '../components/BaseMeterModal/BaseMeterModalForm'
import { Meter } from '../utils/clientSchema'
import { AutoSourceAlert } from '../components/BaseMeterModal/AutoSourceAlert'

const INITIAL_VALUES_KEYS = [
    'accountNumber', 'number', 'resource', 'place', 'numberOfTariffs', 'installationDate',
    'commissioningDate', 'sealingDate', 'verificationDate', 'nextVerificationDate', 'controlReadingsDate',
]

const DELETE_BUTTON_CUSTOM_PROPS: CustomButtonProps = {
    type: 'sberDangerGhost',
}

export const useUpdateMeterModal = (refetch) => {
    const intl = useIntl()
    const MeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.NumberOfMeter' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'pages.condo.meter.form.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'pages.condo.meter.form.ConfirmDeleteMessage' })
    const DeleteMessage = intl.formatMessage({ id: 'pages.condo.meter.DeleteMeterAndReadings' })
    const DeletedMessage = intl.formatMessage({ id: 'Deleted' }).toUpperCase()

    const [selectedMeter, setSelectedMeter] = useState<MeterType>()
    const meterNumber = get(selectedMeter, 'number')
    const isAutomatic = get(selectedMeter, 'isAutomatic', false)
    const masterAppName = get(selectedMeter, ['b2bApp', 'name'], DeletedMessage)

    const updateMeterAction = Meter.useUpdate({}, () => {
        setSelectedMeter(null)
        refetch()
    })

    const initialValues = useMemo(() => {
        if (selectedMeter) {
            return pick(selectedMeter, INITIAL_VALUES_KEYS)
        }
    }, [selectedMeter])

    const handleSubmit = useCallback(values => {
        if (values.resource) {
            values.resource = { connect: { id: values.resource } }
        }
        updateMeterAction(values, selectedMeter)
    }, [selectedMeter, updateMeterAction])
    const handleCancelModal = useCallback(() => setSelectedMeter(null), [setSelectedMeter])

    const handleDeleteButtonClick = useCallback(() => updateMeterAction({ deletedAt: dayjs().toISOString() }, selectedMeter),
        [selectedMeter, updateMeterAction])

    const modalFooter = useMemo(() => {
        return isAutomatic
            ? []
            : [
                <DeleteButtonWithConfirmModal
                    key={'delete'}
                    title={ConfirmDeleteTitle}
                    message={ConfirmDeleteMessage}
                    okButtonLabel={DeleteMessage}
                    action={handleDeleteButtonClick}
                    buttonContent={DeleteMessage}
                    buttonCustomProps={DELETE_BUTTON_CUSTOM_PROPS}
                    showCancelButton
                />,
            ]

    }, [ConfirmDeleteMessage, ConfirmDeleteTitle, DeleteMessage, handleDeleteButtonClick, isAutomatic])

    const UpdateMeterModal = useCallback(() => {
        return (
            <BaseMeterModalForm
                propertyId={get(selectedMeter, ['property', 'id'])}
                unitName={get(selectedMeter, 'unitName')}
                initialValues={initialValues}
                ModalTitleMsg={<Typography.Title level={3}>{MeterNumberMessage} {meterNumber}</Typography.Title>}
                visible={selectedMeter}
                modalExtraFooter={modalFooter}
                handleSubmit={handleSubmit}
                showCancelButton={false}
                cancelModal={handleCancelModal}
                centered
                meter={selectedMeter}
                disabled={isAutomatic}
                modalNotification={ isAutomatic
                    ? <AutoSourceAlert sourceAppName={masterAppName} />
                    : null
                }
            />
        )
    }, [MeterNumberMessage, handleCancelModal, handleSubmit, initialValues, meterNumber, modalFooter, selectedMeter])

    return useMemo(() => ({ UpdateMeterModal, setSelectedMeter }), [UpdateMeterModal])
}