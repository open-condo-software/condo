import { useIntl } from '@core/next/intl'
import { Col, Form, Input, Radio, Row, Select } from 'antd'
import React, { useCallback, useMemo, useState } from 'react'
import { Meter } from '../../utils/clientSchema'
import { uniq } from 'lodash'

const AccountNumberFormItem = ({ children, initialValues }) => {
    const intl = useIntl()
    const AccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumber' })

    return (
        <Form.Item
            label={AccountNumberMessage}
            required
            name={'accountNumber'}
            initialValue={initialValues.accountNumber}
        >
            {children}
        </Form.Item>
    )
}

const CHOOSE_ACCOUNT_RADIO_VALUE = 'select'
const CREATE_ACCOUNT_RADIO_VALUE = 'new'

const AccountNumberSelect = ({ accountNumbers }) => {
    const intl = useIntl()
    const ChooseAccountNumberMessage = intl.formatMessage({ id: 'meter.modal.ChooseAccountNumber' })
    const CreateAccountNumber = intl.formatMessage({ id: 'meter.modal.CreateAccountNumber' })

    const [value, setValue] = useState()
    const handleChange = useCallback((e) => {
        setValue(e.target.value)
    }, [])
    const accountNumberOptions = useMemo(() => accountNumbers.map(accountNumber => ({ label: accountNumber, value: accountNumber })),
        [accountNumbers])

    return (
        <>
            <Col span={24}>
                <Radio.Group onChange={handleChange} value={value}>
                    <Radio value={CHOOSE_ACCOUNT_RADIO_VALUE}>{ChooseAccountNumberMessage}</Radio>
                    <Radio value={CREATE_ACCOUNT_RADIO_VALUE}>{CreateAccountNumber}</Radio>
                </Radio.Group>
            </Col>
            <Col span={24}>
                <AccountNumberFormItem initialValues={{}}>
                    {
                        value === CHOOSE_ACCOUNT_RADIO_VALUE ? <Select options={accountNumberOptions} /> : <Input />
                    }
                </AccountNumberFormItem>
            </Col>
        </>
    )
}

const CreateMeterAccountNumberField = ({ initialValues, propertyId, unitName }) => {
    const { objs: meters } = Meter.useObjects({
        where: {
            property: { id: propertyId },
            unitName,
        },
    })
    const unitAccountNumbers = useMemo(() => uniq(meters.map(meter => meter.accountNumber)), [meters])

    if (unitAccountNumbers.length === 0) {
        return (
            <AccountNumberFormItem initialValues={initialValues}>
                <Input />
            </AccountNumberFormItem>
        )
    }

    return <AccountNumberSelect accountNumbers={unitAccountNumbers} />
}

export const BaseMeterModalAccountNumberField = ({ initialValues }) => {
    const propertyId = initialValues.propertyId
    const unitName = initialValues.unitName

    if (propertyId && unitName) {
        return (
            <CreateMeterAccountNumberField
                initialValues={initialValues}
                propertyId={propertyId}
                unitName={unitName}
            />
        )
    }

    return (
        <AccountNumberFormItem initialValues={initialValues}>
            <Input />
        </AccountNumberFormItem>
    )
}
