import React, { useCallback, useMemo, useState } from 'react'
import { Col, Row } from 'antd'
import Input from '@condo/domains/common/components/antd/Input'
import Radio from '@condo/domains/common/components/antd/Radio'
import Select from '@condo/domains/common/components/antd/Select'
import { Gutter } from 'antd/es/grid/row'
import uniq from 'lodash/uniq'
import isEmpty from 'lodash/isEmpty'

import { useIntl } from '@condo/next/intl'

import { Meter } from '../../utils/clientSchema'
import { BaseMeterModalFormItem } from './BaseMeterModalFormItem'

const AccountNumberFormItem = ({ children, initialValues, rules }) => {
    const intl = useIntl()
    const AccountNumberMessage = intl.formatMessage({ id: 'pages.condo.meter.AccountNumber' })

    return (
        <BaseMeterModalFormItem
            label={AccountNumberMessage}
            required
            rules={rules}
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

const AccountNumberSelect = ({ accountNumbers, rules, disabled }) => {
    const intl = useIntl()
    const ChooseAccountNumberMessage = intl.formatMessage({ id: 'meter.modal.ChooseAccountNumber' })
    const CreateAccountNumber = intl.formatMessage({ id: 'meter.modal.CreateAccountNumber' })

    const [value, setValue] = useState(CHOOSE_ACCOUNT_RADIO_VALUE)
    const handleChange = useCallback((e) => {
        setValue(e.target.value)
    }, [])
    const accountNumberOptions = useMemo(() => accountNumbers.map(accountNumber => ({ label: accountNumber, value: accountNumber })),
        [accountNumbers])

    return (
        <Row gutter={VERTICAL_GUTTER}>
            <Col span={24}>
                <Radio.Group onChange={handleChange} value={value} style={RADIO_GROUP_STYLE} disabled={disabled}>
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
                <AccountNumberFormItem initialValues={{}} rules={rules}>
                    {
                        value === CHOOSE_ACCOUNT_RADIO_VALUE ? <Select options={accountNumberOptions} /> : <Input />
                    }
                </AccountNumberFormItem>
            </Col>
        </Row>
    )
}

const CreateMeterAccountNumberField = ({ initialValues, propertyId, unitName, rules, disabled }) => {
    const { objs: meters } = Meter.useObjects({
        where: {
            property: { id: propertyId },
            unitName,
        },
    })
    const unitAccountNumbers = useMemo(() => uniq(meters.map(meter => meter.accountNumber)), [meters])

    if (isEmpty(unitAccountNumbers)) {
        return (
            <AccountNumberFormItem initialValues={initialValues} rules={rules}>
                <Input disabled={disabled}/>
            </AccountNumberFormItem>
        )
    }

    return <AccountNumberSelect accountNumbers={unitAccountNumbers} rules={rules} disabled={disabled}/>
}

export const BaseMeterModalAccountNumberField = ({ initialValues, rules, disabled }) => {
    const propertyId = initialValues.propertyId
    const unitName = initialValues.unitName

    if (propertyId && unitName) {
        return (
            <CreateMeterAccountNumberField
                initialValues={initialValues}
                propertyId={propertyId}
                unitName={unitName}
                rules={rules}
                disabled={disabled}
            />
        )
    }

    return (
        <AccountNumberFormItem initialValues={initialValues} rules={rules}>
            <Input disabled={disabled} />
        </AccountNumberFormItem>
    )
}
