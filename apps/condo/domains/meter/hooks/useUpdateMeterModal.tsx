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
    const AccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumber' })

    const [selectedMeter, setSelectedMeter] = useState<IMeterUIState>()
    const accountNumber = get(selectedMeter, 'accountNumber')
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
                modalProps={{
                    width: 570,
                }}
            >
                <Form.Item
                    name={'accountNumber'}
                    label={AccountNumberMessage}
                    initialValue={accountNumber}
                    required
                >
                    <Input allowClear />
                </Form.Item>
            </BaseMeterModalForm>
        )
    }, [AccountNumberMessage, MeterNumberMessage, accountNumber, meterNumber, selectedMeter, updateMeterAction])

    return { UpdateMeterModal, setSelectedMeter }
}