import React, { useCallback, useState } from 'react'
import { Form, Input, Typography } from 'antd'
import { get } from 'lodash'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { BaseMeterModalForm } from '../components/createMeterModal/BaseMeterModalForm'
import { Meter } from '../utils/clientSchema'
import { IMeterUIState } from '../utils/clientSchema/Meter'

const DeleteMeterButton = ({ meter, updateMeterAction }) => {
    const intl = useIntl()
    const DeleteMessage = intl.formatMessage({ id: 'Delete' })

    return (
        <Button
            type={'text'}
            danger
            onClick={() => updateMeterAction({ deletedAt: new Date().toDateString() }, meter)}
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

    const UpdateMeterModal = useCallback(() => {
        return (
            <BaseMeterModalForm
                ModalTitleMsg={<Typography.Title level={3}>{MeterNumberMessage} {meterNumber}</Typography.Title>}
                visible={selectedMeter}
                modalExtraFooter={[<DeleteMeterButton key={'delete'} meter={selectedMeter} updateMeterAction={updateMeterAction}/>]}
                handleSubmit={values => updateMeterAction(values, selectedMeter)}
                showCancelButton={false}
                cancelModal={() => setSelectedMeter(null)}
                ModalSaveButtonLabelMsg={'Сохранить'}
                centered
                meter={selectedMeter}
                modalProps={{
                    width: 600,
                }}
            />
        )
    }, [MeterNumberMessage, meterNumber, selectedMeter, updateMeterAction])

    return { UpdateMeterModal, setSelectedMeter }
}