import { Col } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'


import DatePicker from '@condo/domains/common/components/Pickers/DatePicker'

import { BaseMeterModalFormItem } from './BaseMeterModalFormItem'

import { METER_MODAL_FORM_ITEM_SPAN } from '../../constants/constants'

import type { FormRule as Rule } from 'antd'

interface ICreateMeterModalDatePickerProps {
    label: string
    name: string
    rules?: Rule[]
    dependencies?: string[]
    onChange?: (value: Dayjs, dateString: string) => void
    initialValue?
    disabled?: boolean
    validateFirst?: boolean
}

const METER_MODAL_DATE_PICKER_STYLE: CSSProperties = { width: '100%' }
const METER_MODAL_DATE_PICKER_DATE_FORMAT = 'DD.MM.YYYY'
const METER_MODAL_DATE_PICKER_VALIDATE_TRIGGER = ['onBlur', 'onSubmit']

export const MeterModalDatePicker: React.FC<ICreateMeterModalDatePickerProps> = ({
    label,
    name,
    rules,
    dependencies,
    onChange,
    initialValue,
    disabled,
    validateFirst = false,
}) => {
    const intl = useIntl()
    const EnterDatePlaceHolder = intl.formatMessage({ id: 'EnterDate' })

    const dayjsInitialValue = dayjs(initialValue)
    const initialDateValue = initialValue && dayjsInitialValue.isValid() ? dayjsInitialValue : null

    return (
        <Col span={METER_MODAL_FORM_ITEM_SPAN}>
            <BaseMeterModalFormItem
                label={label}
                name={name}
                rules={rules}
                validateTrigger={METER_MODAL_DATE_PICKER_VALIDATE_TRIGGER}
                dependencies={dependencies}
                initialValue={initialDateValue}
                validateFirst={validateFirst}
            >
                <DatePicker
                    placeholder={EnterDatePlaceHolder}
                    format={METER_MODAL_DATE_PICKER_DATE_FORMAT}
                    style={METER_MODAL_DATE_PICKER_STYLE}
                    onChange={onChange}
                    disabled={disabled}
                />
            </BaseMeterModalFormItem>
        </Col>
    )
}
