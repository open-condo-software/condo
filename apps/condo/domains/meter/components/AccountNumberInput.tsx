import { Alert, Form, Input, Row, Typography } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { useIntl } from '@core/next/intl'
import { BasicEmptyListView } from '../../common/components/EmptyListView'
import { fontSizes } from '../../common/constants/style'
import { Button } from '../../common/components/Button'
import { useCreateAccountModal } from './hooks/useCreateAccountModal'


export const AccountNumberInput = ({ form, existingMeters }) => {
    const intl = useIntl()
    const AccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumber' })
    const NewAccountAlertMessage = intl.formatMessage({ id: 'pages.condo.meter.NewAccountAlert' })
    const NoAccountNumber = intl.formatMessage({ id: 'pages.condo.meter.NoAccountNumber' })
    const AddAccountDescription = intl.formatMessage({ id: 'pages.condo.meter.AddAccountDescription' })
    const AddAccountMessage = intl.formatMessage({ id: 'pages.condo.meter.AddAccount' })

    useEffect(() => {
        if (existingMeters.length > 0)
            form.setFieldsValue({ accountNumber: existingMeters[0].accountNumber })
        else
            form.setFieldsValue({ accountNumber: null })
    }, [existingMeters])

    const { CreateAccountModal, setIsCreateAccountModalVisible } = useCreateAccountModal()

    return form.getFieldValue('accountNumber') ? (
        <Row gutter={[0, 10]}>
            <Form.Item
                name={'accountNumber'}
                label={AccountNumberMessage}
            >
                <Input disabled={existingMeters.length > 0} />
            </Form.Item>
            {
                existingMeters.length === 0 ? (
                    <Alert showIcon type='warning' message={NewAccountAlertMessage}/>
                ) : null
            }
        </Row>
    ) : (
        <>
            <BasicEmptyListView>
                <Typography.Title level={3}>
                    {NoAccountNumber}
                </Typography.Title>
                <Typography.Text style={{ fontSize: fontSizes.content }}>
                    {AddAccountDescription}
                </Typography.Text>
                <Button
                    type='sberPrimary'
                    style={{ marginTop: '16px' }}
                    onClick={() => setIsCreateAccountModalVisible(true)}
                >
                    {AddAccountMessage}
                </Button>
            </BasicEmptyListView>

            <CreateAccountModal
                handleSubmit={({ accountNumber }) => { form.setFieldsValue({ accountNumber }) }}
            />
        </>
    )
}