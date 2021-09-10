import { Alert, Col, Form, Input, Row, Typography } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { useIntl } from '@core/next/intl'
import { BasicEmptyListView } from '../../common/components/EmptyListView'
import { fontSizes } from '../../common/constants/style'
import { Button } from '../../common/components/Button'
import { useCreateAccountModal } from './hooks/useCreateAccountModal'


export const AccountNumberInput = ({ form, existingMetersRef }) => {
    const intl = useIntl()
    const AccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumber' })
    const NewAccountAlertMessage = intl.formatMessage({ id: 'pages.condo.meter.NewAccountAlert' })
    const NoAccountNumber = intl.formatMessage({ id: 'pages.condo.meter.NoAccountNumber' })
    const AddAccountDescription = intl.formatMessage({ id: 'pages.condo.meter.AddAccountDescription' })
    const AddAccountMessage = intl.formatMessage({ id: 'pages.condo.meter.AddAccount' })

    const { CreateAccountModal, setIsCreateAccountModalVisible } = useCreateAccountModal()

    useEffect(() => {
        if (existingMetersRef.current.length > 0)
            form.setFieldsValue({ accountNumber: existingMetersRef.current[0].accountNumber })
    }, [existingMetersRef.current])

    return form.getFieldValue('accountNumber') ? (
        <Col lg={14} md={24}>
            <Row gutter={[0, 10]}>
                <Form.Item
                    label={AccountNumberMessage}
                    name='accountNumber'
                    required={true}
                >
                    <Input disabled={existingMetersRef.current.length > 0} />
                </Form.Item>
                {
                    existingMetersRef.current.length === 0 ? (
                        <Alert showIcon type='warning' message={NewAccountAlertMessage}/>
                    ) : null
                }
            </Row>
        </Col>
    ) : (
        <Col span={24}>
            <Row justify={'center'}>
                <Col span={8} style={{ padding: '100px 0' }}>
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

                    <CreateAccountModal handleSubmit={({ accountNumber }) => {
                        console.log('set acc num', accountNumber)
                        form.setFieldsValue({ accountNumber: accountNumber })
                    }} />
                </Col>
            </Row>
        </Col>
    )
}