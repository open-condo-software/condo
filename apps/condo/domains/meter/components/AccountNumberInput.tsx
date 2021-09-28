import { Alert, Col, Input, Row, Typography } from 'antd'
import React, { useEffect, useState } from 'react'
import { useIntl } from '@core/next/intl'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { fontSizes } from '@condo/domains/common/constants/style'
import { Button } from '@condo/domains/common/components/Button'
import { useCreateAccountModal } from '../hooks/useCreateAccountModal'


export const EmptyAccountView = ({ setIsAccountNumberIntroduced, setAccountNumber }) => {
    const intl = useIntl()
    const NoAccountNumber = intl.formatMessage({ id: 'pages.condo.meter.NoAccountNumber' })
    const AddAccountDescription = intl.formatMessage({ id: 'pages.condo.meter.AddAccountDescription' })
    const AddAccountMessage = intl.formatMessage({ id: 'pages.condo.meter.AddAccount' })

    const { CreateAccountModal, setIsCreateAccountModalVisible } = useCreateAccountModal()

    return (
        <Col span={24}>
            <Row justify={'center'}>
                <Col span={8}>
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

export const AccountNumberInput = ({
    accountNumber,
    setAccountNumber,
    existingMeters,
    isAccountNumberIntroduced,
    setIsAccountNumberIntroduced,
}) => {
    const intl = useIntl()
    const AccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumber' })
    const NewAccountAlertMessage = intl.formatMessage({ id: 'pages.condo.meter.NewAccountAlert' })
    const AccountMessage = intl.formatMessage({ id: 'pages.condo.meter.Account' })

    return !accountNumber && !isAccountNumberIntroduced ? (
        <Col span={24}>
            <EmptyAccountView
                setIsAccountNumberIntroduced={setIsAccountNumberIntroduced}
                setAccountNumber={setAccountNumber}
            />
        </Col>
    ) : (
        <>
            <Col lg={13} md={24}>
                <Row justify={'space-between'} gutter={[0, 15]}>
                    <Col>
                        <Typography.Title level={5}>
                            {AccountMessage}
                        </Typography.Title>
                    </Col>
                    <Col>
                        <Row gutter={[0, 10]}>
                            <Col span={24}>
                                <Typography.Text type={'secondary'}>{AccountNumberMessage}</Typography.Text>
                            </Col>
                            <Col span={10}>
                                <Input
                                    value={accountNumber}
                                    onChange={e => setAccountNumber(e.target.value)}
                                    disabled={existingMeters.length > 0}
                                />
                            </Col>
                            {
                                existingMeters.length === 0 ? (
                                    <Alert showIcon type='warning' message={NewAccountAlertMessage}/>
                                ) : null
                            }
                        </Row>
                    </Col>
                </Row>
            </Col>
        </>
    )
}