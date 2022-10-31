import { Col, Form, FormInstance, FormItemProps, Row } from 'antd'
import { isFunction } from 'lodash'

import React, { ComponentProps, useCallback, useEffect, useState } from 'react'
import { useIntl } from '@condo/next/intl'
import { useValidations } from '@condo/domains/common/hooks/useValidations'

import Checkbox from './antd/Checkbox'
import { GraphQlSearchInput } from './GraphQlSearchInput'
import styled from '@emotion/styled'

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

const CheckAllCheckboxFormItem = styled(Form.Item)`
    & .ant-form-item-control-input {
      min-height: initial;
    }
`

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

    const [allDataLength, setAllDataLength] = useState<number>()
    const [isAllChecked, setIsAllChecked] = useState<boolean>(checkAllInitialValue)
    const [isRequired, setIsRequired] = useState<boolean>(selectFormItemProps.required)
    const { requiredValidator } = useValidations()

    const handleCheckboxChange = useCallback((event) => {
        const value = event.target.checked
        setIsAllChecked(value)

        if (isFunction(onCheckBoxChange)) {
            onCheckBoxChange(value)
        }
    }, [onCheckBoxChange])
    const handleOnDataLoaded = useCallback((data) => setAllDataLength(data.length), [])
    const handleOnChange = useCallback((data) => {
        const selectedDataLength = data.length

        if (selectedDataLength === allDataLength) {
            setIsAllChecked(true)
        }
    }, [allDataLength])

    const formItemName = String(selectFormItemProps.name)
    useEffect(() => {
        if (isAllChecked) {
            form.setFieldsValue({ [formItemName]: [], [checkAllFieldName]: true })
        }
    }, [checkAllFieldName, form, formItemName, isAllChecked])

    useEffect(() => {
        if (selectFormItemProps.required) {
            setIsRequired(!isAllChecked)
        }
    }, [isAllChecked, isRequired, selectFormItemProps.required])

    const rules = isRequired ? [requiredValidator] : []

    return (
        <Row gutter={[0, 20]}>
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
                        onChange={handleOnChange}
                        onAllDataLoading={handleOnDataLoaded}
                    />
                </Form.Item>
            </Col>
            <Col span={14} offset={checkBoxOffset}>
                <CheckAllCheckboxFormItem
                    name={checkAllFieldName}
                    valuePropName='checked'
                >
                    <Checkbox
                        onChange={handleCheckboxChange}
                    >
                        {CheckAllMessage}
                    </Checkbox>
                </CheckAllCheckboxFormItem>
            </Col>
        </Row>
    )
}