import { Col, Form, FormInstance, FormItemProps, Row } from 'antd'
import { isFunction } from 'lodash'

import React, { ComponentProps, useCallback, useEffect, useMemo, useState } from 'react'
import { useIntl } from '@condo/next/intl'
import { useValidations } from '@condo/domains/common/hooks/useValidations'

import Checkbox from './antd/Checkbox'
import { GraphQlSearchInput } from './GraphQlSearchInput'

type InputWithCheckAllProps = {
    onCheckBoxChange?: (value: boolean) => void
    selectFormItemProps?: FormItemProps
    checkAllFieldName: string,
    checkAllInitialValue: boolean,
    CheckAllMessage: string,
    selectProps: ComponentProps<typeof GraphQlSearchInput>
    checkBoxOffset?: number
    form: FormInstance
}

export const GraphQlSearchInputWithCheckAll: React.FC<InputWithCheckAllProps> = (
    {
        onCheckBoxChange,
        selectFormItemProps,
        checkAllFieldName,
        checkAllInitialValue,
        selectProps,
        CheckAllMessage,
        form,
        checkBoxOffset,
    }
) => {
    const intl = useIntl()
    const CheckedAllMessage = intl.formatMessage({ id: 'CheckedAll' })

    const [isAllChecked, setIsAllChecked] = useState<boolean>(checkAllInitialValue)
    const { requiredValidator } = useValidations()

    const handleCheckboxChange = useCallback((event) => {
        const value = event.target.checked
        setIsAllChecked(value)

        if (isFunction(onCheckBoxChange)) {
            onCheckBoxChange(value)
        }
    }, [onCheckBoxChange])

    const formItemName = useMemo(() => String(selectFormItemProps.name), [selectFormItemProps.name])
    useEffect(() => {
        if (isAllChecked) {
            form.setFieldsValue({ [formItemName]: [] })
        }
    }, [form, formItemName, isAllChecked])

    const rules = useMemo(() => [], [])
    useEffect(() => {
        if (selectFormItemProps.required && !isAllChecked) {
            rules.push(requiredValidator)
        }
    }, [isAllChecked, requiredValidator, rules, selectFormItemProps.required])

    return (
        <Row>
            <Col span={24}>
                <Form.Item
                    labelAlign='left'
                    rules={rules}
                    {...selectFormItemProps}
                >
                    <GraphQlSearchInput
                        {...selectProps}
                        mode='multiple'
                        placeholder={isAllChecked && CheckedAllMessage || selectProps.placeholder}
                        disabled={selectProps.disabled || isAllChecked}
                    />
                </Form.Item>
            </Col>
            <Col span={14} offset={checkBoxOffset}>
                <Form.Item
                    name={checkAllFieldName}
                    valuePropName='checked'
                >
                    <Checkbox
                        onChange={handleCheckboxChange}
                    >
                        {CheckAllMessage}
                    </Checkbox>
                </Form.Item>
            </Col>
        </Row>
    )
}