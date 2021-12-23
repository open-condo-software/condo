import React, { useCallback, useMemo, useState } from 'react'
import { Typography } from 'antd'
import get from 'lodash/get'
import pick from 'lodash/pick'
import { useIntl } from '@core/next/intl'

import {
    DeleteButtonWithConfirmModal,
    IDeleteActionButtonWithConfirmModal,
} from '@condo/domains/common/components/DeleteButtonWithConfirmModal'

import { BaseMeterModalForm } from '../components/BaseMeterModal/BaseMeterModalForm'
import { Meter } from '../utils/clientSchema'
import { IMeterUIState } from '../utils/clientSchema/Meter'

const INITIAL_VALUES_KEYS = [
    'accountNumber', 'number', 'resource', 'place', 'numberOfTariffs', 'installationDate',
    'commissioningDate', 'sealingDate', 'verificationDate', 'nextVerificationDate', 'controlReadingsDate',
]

const DELETE_BUTTON_CUSTOM_PROPS: IDeleteActionButtonWithConfirmModal['buttonCustomProps'] = {
    type: 'sberDangerGhost',
}

export const useUpdateMeterModal = (refetch) => {
    const intl = useIntl()
    const MeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.NumberOfMeter' })
    const ConfirmDeleteTitle = intl.formatMessage({ id: 'pages.condo.meter.form.ConfirmDeleteTitle' })
    const ConfirmDeleteMessage = intl.formatMessage({ id: 'pages.condo.meter.form.ConfirmDeleteMessage' })
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })

    const [selectedMeter, setSelectedMeter] = useState<IMeterUIState>()
    const meterNumber = get(selectedMeter, 'number')

    const updateMeterAction = Meter.useUpdate({}, () => {
        setSelectedMeter(null)
        refetch()
    })

    const initialValues = useMemo(() => {
        if (selectedMeter) {
            return pick(selectedMeter, INITIAL_VALUES_KEYS)
        }
    }, [selectedMeter])

    const handleSubmit = useCallback(values => updateMeterAction(values, selectedMeter), [selectedMeter, updateMeterAction])
    const handleCancelModal = useCallback(() => setSelectedMeter(null), [setSelectedMeter])
    // const modalFooter = useMemo(() => [<DeleteMeterButton key={'delete'} meter={selectedMeter} updateMeterAction={updateMeterAction}/>],
    //     [selectedMeter, updateMeterAction])

    const handleDeleteButtonClick = useCallback(() => updateMeterAction({ deletedAt: new Date().toDateString() }, selectedMeter),
        [selectedMeter, updateMeterAction])

    const modalFooter = useMemo(() => [
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
    ],
    [ConfirmDeleteMessage, ConfirmDeleteTitle, handleDeleteButtonClick])

    const UpdateMeterModal = useCallback(() => {
        return (
            <BaseMeterModalForm
                initialValues={initialValues}
                ModalTitleMsg={<Typography.Title level={3}>{MeterNumberMessage} {meterNumber}</Typography.Title>}
                visible={selectedMeter}
                modalExtraFooter={modalFooter}
                handleSubmit={handleSubmit}
                showCancelButton={false}
                cancelModal={handleCancelModal}
                centered
                meter={selectedMeter}
            />
        )
    }, [MeterNumberMessage, handleCancelModal, handleSubmit, initialValues, meterNumber, modalFooter, selectedMeter])

    return useMemo(() => ({ UpdateMeterModal, setSelectedMeter }), [UpdateMeterModal])
}