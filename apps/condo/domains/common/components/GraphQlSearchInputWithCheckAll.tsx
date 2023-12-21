import styled from '@emotion/styled'
import { Col, Form, FormInstance, FormItemProps, Row, SelectProps } from 'antd'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isFunction from 'lodash/isFunction'
import isUndefined from 'lodash/isUndefined'
import React, { ComponentProps, useCallback, useEffect, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { GraphQlSearchInputOption } from '@condo/domains/common/components/GraphQlSearchInput/GraphQlSearchInput'
import { useValidations } from '@condo/domains/common/hooks/useValidations'

import Checkbox from './antd/Checkbox'
import { GraphQlSearchInput } from './GraphQlSearchInput'


export type InputWithCheckAllProps = {
    onCheckBoxChange?: (value: boolean) => void
    selectFormItemProps: FormItemProps & Required<Pick<FormItemProps, 'name'>>
    checkAllFieldName: FormItemProps['name'],
    checkAllInitialValue: boolean,
    CheckAllMessage: string,
    selectProps: ComponentProps<typeof GraphQlSearchInput>
    checkBoxOffset?: number
    form: FormInstance
    checkBoxEventName?: string
    disabled?: boolean
    checkboxDisabled?: boolean
    checkboxHidden?: boolean
    mode?: SelectProps['mode']
    onDataLoaded?: (data: GraphQlSearchInputOption['data']) => void
    /**
     * When your form has a complex structure, for example when fields change dynamically,
     * you need to mutation the form yourself after the checkbox has been checked.
     * Namely, reset the select field to empty array and set checkbox to true
     *
     * @example Default implementation
     * function (form, formItemName, checkAllFieldName) {
     *     return {
     *         [formItemName]: [],
     *         [checkAllFieldName]: true,
     *     }
     * }
     */
    mutationOfFormAfterCheckAll?: (form: FormInstance, formItemName: FormItemProps['name'], checkAllFieldName: FormItemProps['name']) => Record<string, any>
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
        checkBoxEventName,
        disabled,
        onDataLoaded,
        mutationOfFormAfterCheckAll,
        checkboxDisabled,
        checkboxHidden,
        mode,
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
    const handleOnDataLoaded = useCallback((data) => {
        setAllDataLength(data.length)
        if (isFunction(onDataLoaded)) {
            onDataLoaded(data)
        }
    }, [onDataLoaded])
    const handleOnChange = useCallback((data) => {
        const selectedDataLength = get(data, 'length')

        if (selectedDataLength === allDataLength && !checkboxHidden) {
            setIsAllChecked(true)
        }

        const onChange = get(selectProps, 'onChange')
        if (isFunction(onChange)) {
            onChange(data)
        }

        if (selectedDataLength === allDataLength && isFunction(onCheckBoxChange)) {
            onCheckBoxChange(true)
        }
    }, [allDataLength, checkboxHidden, onCheckBoxChange, selectProps])

    const formItemName = String(selectFormItemProps.name)
    const checkAllFieldNameInString = String(checkAllFieldName)
    useEffect(() => {
        if ((isArray(selectFormItemProps.name) || isArray(checkAllFieldName)) && !isFunction(mutationOfFormAfterCheckAll)) {
            console.error('You should set "mutationOfFormAfterCheckAll" for "GraphQlSearchInputWithCheckAll". Form item name or field name is array type.')
        }
        if (isAllChecked) {
            if (isFunction(mutationOfFormAfterCheckAll)) {
                form.setFieldsValue(mutationOfFormAfterCheckAll(form, selectFormItemProps.name, checkAllFieldName))
            } else {
                form.setFieldsValue({ [formItemName]: [], [checkAllFieldNameInString]: true })
            }
        }
    }, [checkAllFieldNameInString, form, formItemName, isAllChecked])

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
                        mode={!isUndefined(selectProps.mode) ? selectProps.mode : 'multiple'}
                        placeholder={isAllChecked && CheckedAllMessage || selectProps.placeholder}
                        disabled={disabled || selectProps.disabled || isAllChecked}
                        onChange={handleOnChange}
                        onAllDataLoading={handleOnDataLoaded}
                    />
                </Form.Item>
            </Col>
            {
                !checkboxHidden && (
                    <Col span={14} offset={checkBoxOffset}>
                        <CheckAllCheckboxFormItem
                            name={checkAllFieldName}
                            valuePropName='checked'
                        >
                            <Checkbox
                                onChange={handleCheckboxChange}
                                eventName={checkBoxEventName}
                                disabled={disabled || checkboxDisabled}
                            >
                                {CheckAllMessage}
                            </Checkbox>
                        </CheckAllCheckboxFormItem>
                    </Col>
                )
            }
        </Row>
    )
}
