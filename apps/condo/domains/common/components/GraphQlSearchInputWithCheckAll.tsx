import { Col, Form, FormInstance, FormItemProps, Row } from 'antd'
import { isFunction } from 'lodash'

import React, { ComponentProps, useCallback, useEffect, useState } from 'react'
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

    const formItemName = String(selectFormItemProps.name)
    useEffect(() => {
        if (isAllChecked) {
            form.setFieldsValue({ [formItemName]: [] })
        }
    }, [form, formItemName, isAllChecked])

    const rules = []
    if (selectFormItemProps.required && !isAllChecked) {
        rules.push(requiredValidator)
    }

    return (
        <Row gutter={0}>
            <Col span={24}>
                <Form.Item
                    rules={rules}
                    {...selectFormItemProps}
                >
                    <GraphQlSearchInput
                        {...selectProps}
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