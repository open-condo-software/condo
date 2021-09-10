import { Alert, Col, Form, Input, Row, Typography } from 'antd'
import React, { useEffect, useRef, useState } from 'react'
import { useIntl } from '@core/next/intl'
import { BasicEmptyListView } from '../../common/components/EmptyListView'
import { fontSizes } from '../../common/constants/style'
import { Button } from '../../common/components/Button'
import { useCreateAccountModal } from './hooks/useCreateAccountModal'


export const AccountNumberInput = ({ accountNumber, setAccountNumber, existingMeters }) => {
    const intl = useIntl()
    const AccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumber' })
    const NewAccountAlertMessage = intl.formatMessage({ id: 'pages.condo.meter.NewAccountAlert' })
    const NoAccountNumber = intl.formatMessage({ id: 'pages.condo.meter.NoAccountNumber' })
    const AddAccountDescription = intl.formatMessage({ id: 'pages.condo.meter.AddAccountDescription' })
    const AddAccountMessage = intl.formatMessage({ id: 'pages.condo.meter.AddAccount' })

    const { CreateAccountModal, setIsCreateAccountModalVisible } = useCreateAccountModal()
    // const [accountNumber, setAccountNumber] = useState<string>(null)

    useEffect(() => {
        if (existingMeters.length > 0) {
            // form.setFieldsValue({ accountNumber: existingMetersRef.current[0].accountNumber })
            setAccountNumber(existingMeters[0].accountNumber)
        }
        // else {
        //     setAccountNumber(null)
        // }
        // if (form.getFieldValue('accountNumber') && existingMetersRef.current.length === 0)
        //     form.setFieldsValue({ accountNumber: null })
    }, [existingMeters])

    // console.log('accountNumber in AccountNumberInput', form.getFieldValue('accountNumber'))

    return accountNumber ? (
        <Col lg={14} md={24}>
            <Row gutter={[0, 10]}>
                {/*<Form.Item*/}
                {/*    label={AccountNumberMessage}*/}
                {/*    name='accountNumber'*/}
                {/*    required={true}*/}
                {/*>*/}
                <Typography.Text type={'secondary'}>{AccountNumberMessage}</Typography.Text>
                <Input
                    disabled={existingMeters.length > 0}
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                />
                {/*</Form.Item>*/}
                {
                    existingMeters.length === 0 ? (
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

                    <CreateAccountModal
                        accountNumber={accountNumber}
                        setAccountNumber={setAccountNumber}
                    />
                </Col>
            </Row>
        </Col>
    )
}