import React, { useCallback, useMemo, useState } from 'react'
import { Col, Input, Radio, Row, Select } from 'antd'
import { Gutter } from 'antd/es/grid/row'
import uniq from 'lodash/uniq'
import isEmpty from 'lodash/isEmpty'

import { useIntl } from '@core/next/intl'

import { Meter } from '../../utils/clientSchema'
import { BaseMeterModalFormItem } from './BaseMeterModalFormItem'

const AccountNumberFormItem = ({ children, initialValues }) => {
    const intl = useIntl()
    const AccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumber' })

    return (
        <BaseMeterModalFormItem
            label={AccountNumberMessage}
            required
            name={'accountNumber'}
            initialValue={initialValues.accountNumber}
        >
            {children}
        </BaseMeterModalFormItem>
    )
}

const CHOOSE_ACCOUNT_RADIO_VALUE = 'select'
const CREATE_ACCOUNT_RADIO_VALUE = 'new'
const HORIZONTAL_GUTTER: [Gutter, Gutter] = [20, 0]
const VERTICAL_GUTTER: [Gutter, Gutter] = [0, 20]
const RADIO_GROUP_STYLE = { width: '100%' }

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
        <Row gutter={VERTICAL_GUTTER}>
            <Col span={24}>
                <Radio.Group onChange={handleChange} value={value} style={RADIO_GROUP_STYLE}>
                    <Row gutter={HORIZONTAL_GUTTER}>
                        <Col>
                            <Radio value={CHOOSE_ACCOUNT_RADIO_VALUE}>
                                {ChooseAccountNumberMessage}
                            </Radio>
                        </Col>
                        <Col>
                            <Radio value={CREATE_ACCOUNT_RADIO_VALUE}>
                                {CreateAccountNumber}
                            </Radio>
                        </Col>
                    </Row>
                </Radio.Group>
            </Col>
            <Col span={24}>
                <AccountNumberFormItem initialValues={{}}>
                    {
                        value === CHOOSE_ACCOUNT_RADIO_VALUE ? <Select options={accountNumberOptions} /> : <Input />
                    }
                </AccountNumberFormItem>
            </Col>
        </Row>
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

    if (isEmpty(unitAccountNumbers)) {
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
