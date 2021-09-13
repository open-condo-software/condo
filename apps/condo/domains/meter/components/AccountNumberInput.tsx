import { Alert, Col, Input, Row, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import { useIntl } from '@core/next/intl'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { fontSizes } from '@condo/domains/common/constants/style'
import { Button } from '@condo/domains/common/components/Button'
import { useCreateAccountModal } from './hooks/useCreateAccountModal'


export const EmptyAccountView = ({ setIsAccountNumberIntroduced, setAccountNumber }) => {
    const intl = useIntl()
    const NoAccountNumber = intl.formatMessage({ id: 'pages.condo.meter.NoAccountNumber' })
    const AddAccountDescription = intl.formatMessage({ id: 'pages.condo.meter.AddAccountDescription' })
    const AddAccountMessage = intl.formatMessage({ id: 'pages.condo.meter.AddAccount' })

    const { CreateAccountModal, setIsCreateAccountModalVisible } = useCreateAccountModal()

    return (
        <Col span={24}>
            <Row justify={'center'}>
                <Col span={8} style={{ padding: '80px 0' }}>
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
                        setAccountNumber={setAccountNumber}
                        setIsAccountNumberIntroduced={setIsAccountNumberIntroduced}
                    />
                </Col>
            </Row>
        </Col>
    )
}

export const AccountNumberInput = ({ accountNumber, setAccountNumber, selectedUnitName, existingMeters }) => {
    const intl = useIntl()
    const AccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumber' })
    const NewAccountAlertMessage = intl.formatMessage({ id: 'pages.condo.meter.NewAccountAlert' })

    const [isAccountNumberIntroduced, setIsAccountNumberIntroduced] = useState<boolean>(false)
    useEffect(() => {
        setIsAccountNumberIntroduced(false)
    }, [selectedUnitName])

    return !accountNumber && !isAccountNumberIntroduced ? (
        <EmptyAccountView
            setIsAccountNumberIntroduced={setIsAccountNumberIntroduced}
            setAccountNumber={setAccountNumber}
        />
    ) : (
        <Col lg={14} md={24}>
            <Row gutter={[0, 10]}>
                {/*<Form.Item*/}
                {/*    label={AccountNumberMessage}*/}
                {/*    name='accountNumber'*/}
                {/*    required={true}*/}
                {/*>*/}
                <Typography.Text type={'secondary'}>{AccountNumberMessage}</Typography.Text>
                <Col span={24}>
                    <Input
                        value={accountNumber}
                        onChange={e => setAccountNumber(e.target.value)}
                        disabled={existingMeters.length > 0}
                    />
                </Col>
                {/*</Form.Item>*/}
                {
                    existingMeters.length === 0 ? (
                        <Alert showIcon type='warning' message={NewAccountAlertMessage}/>
                    ) : null
                }
            </Row>
        </Col>
    )
}