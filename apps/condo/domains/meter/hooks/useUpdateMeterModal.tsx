import React, { useCallback, useMemo, useState } from 'react'
import { Typography } from 'antd'
import { get } from 'lodash'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { BaseMeterModalForm } from '../components/BaseMeterModal/BaseMeterModalForm'
import { Meter } from '../utils/clientSchema'
import { IMeterUIState } from '../utils/clientSchema/Meter'

const DeleteMeterButton = ({ meter, updateMeterAction }) => {
    const intl = useIntl()
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })

    const handleDeleteButtonClick = useCallback(() => updateMeterAction({ deletedAt: new Date().toDateString() }, meter),
        [meter, updateMeterAction])

    return (
        <Button
            type={'text'}
            danger
            onClick={handleDeleteButtonClick}
        >
            {DeleteMessage}
        </Button>
    )
}

export const useUpdateMeterModal = (refetch) => {
    const intl = useIntl()
    const MeterNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.NumberOfMeter' })

    const [selectedMeter, setSelectedMeter] = useState<IMeterUIState>()
    const meterNumber = get(selectedMeter, 'number')

    const updateMeterAction = Meter.useUpdate({}, () => {
        setSelectedMeter(null)
        refetch()
    })

    const initialValues = useMemo(() => {
        if (selectedMeter) {
            const { accountNumber, number, resource, place, numberOfTariffs, installationDate, commissioningDate, sealingDate,
                verificationDate, nextVerificationDate, controlReadingsDate } = selectedMeter

            return {
                accountNumber, number, resource, place, numberOfTariffs, installationDate, commissioningDate, sealingDate,
                verificationDate, nextVerificationDate, controlReadingsDate,
            }
        }
    }, [selectedMeter])

    const handleSubmit = useCallback(values => updateMeterAction(values, selectedMeter), [selectedMeter, updateMeterAction])
    const handleCancelModal = useCallback(() => setSelectedMeter(null), [])
    const modalFooter = useMemo(() => [<DeleteMeterButton key={'delete'} meter={selectedMeter} updateMeterAction={updateMeterAction}/>],
        [selectedMeter, updateMeterAction])

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

    return { UpdateMeterModal, setSelectedMeter }
}