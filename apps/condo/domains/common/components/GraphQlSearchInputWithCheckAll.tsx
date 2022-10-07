import { Col, Form, FormItemProps, Row } from 'antd'
import { isFunction } from 'lodash'

import React, { ComponentProps, useCallback, useState } from 'react'
import { useValidations } from '../hooks/useValidations'

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
}

export const GraphQlSearchInputWithCheckAll: React.FC<InputWithCheckAllProps> = (
    {
        onCheckBoxChange,
        selectFormItemProps,
        checkAllFieldName,
        checkAllInitialValue,
        selectProps,
        CheckAllMessage,
        checkBoxOffset,
    }
) => {
    const [isAllChecked, setIsAllChecked] = useState<boolean>(checkAllInitialValue)
    const { requiredValidator } = useValidations()

    const handleCheckboxChange = useCallback((event) => {
        const value = event.target.checked
        setIsAllChecked(value)

        if (isFunction(onCheckBoxChange)) {
            onCheckBoxChange(value)
        }
    }, [onCheckBoxChange])

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
                        mode='multiple'
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