import { Alert, Form, Input } from 'antd'
import React from 'react'
import { useIntl } from '@core/next/intl'


export const AccountNumberInput = ({ accountNumberRef, isNoExistingMetersInThisUnit }) => {
    const intl = useIntl()
    const AccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumber' })
    const NewAccountAlertMessage = intl.formatMessage({ id: 'pages.condo.meter.NewAccountAlert' })

    return (
        <>
            <Form.Item
                name={'accountNumber'}
                label={AccountNumberMessage}
                initialValue={accountNumberRef.current}
            >
                <Input disabled={!isNoExistingMetersInThisUnit} />
            </Form.Item>
            {
                isNoExistingMetersInThisUnit ? (
                    <Alert showIcon type='warning' message={NewAccountAlertMessage}/>
                ) : null
            }
        </>
    )
}