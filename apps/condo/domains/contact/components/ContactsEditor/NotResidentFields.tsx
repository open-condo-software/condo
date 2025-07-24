import { OrganizationEmployee as OrganizationEmployeeType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { AutoComplete, Col, Form, Row, RowProps } from 'antd'
import { OptionProps } from 'antd/lib/mentions'
import debounce from 'lodash/debounce'
import get from 'lodash/get'
import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { SPECIAL_CHAR_REGEXP } from '@condo/domains/common/constants/regexps'
import { colors } from '@condo/domains/common/constants/style'
import { useValidations } from '@condo/domains/common/hooks/useValidations'

import { CONTACT_TYPE, ContactValue } from './index'

import type { FormRule as Rule } from 'antd'


const DEBOUNCE_TIMEOUT_IN_MS = 800

interface INotResidentFieldsFieldsProps {
    refetch
    initialQuery?
    initialValue?: Partial<OrganizationEmployeeType>
    onChange: (contact: ContactValue) => void
    // Used for autocomplete
    employees: OrganizationEmployeeType[]
    activeTab: CONTACT_TYPE
}

const FIELD_ROW_GUTTER: RowProps['gutter'] = [16, 0]
const FIELD_WRAPPER_COL = { span: 24 }

const StyledAutoComplete = styled(AutoComplete)<{ disabled?: boolean }>`
  width: 100%;

  &.ant-select-disabled > .ant-select-selector > .ant-select-selection-search > input {
    color: ${colors.black} 
  }
`

export const NOT_RESIDENT_PHONE_FORM_ITEM_NAME = 'IGNORE_FIELD_NOT_RESIDENT_PHONE'
export const NOT_RESIDENT_NAME_FORM_ITEM_NAME = 'IGNORE_FIELD_NOT_RESIDENT_NAME'

const NotResidentFields: React.FC<INotResidentFieldsFieldsProps> = ({
    refetch,
    initialQuery,
    initialValue,
    onChange,
    employees,
    activeTab,
}) => {
    const intl = useIntl()
    const NamePlaceholder = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Name.placeholder' })
    const FullNameLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Name' })
    const PhoneLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Phone' })
    const FullNameInvalidCharMessage = intl.formatMessage({ id:'field.FullName.invalidChar' })

    const [value, setValue] = useState(initialValue)

    const { phoneValidator } = useValidations({ allowLandLine: true })

    const searchSuggestions = useCallback(
        async (query) => {
            return refetch({
                where: { ...initialQuery, ...query },
            })
        },
        [initialQuery, refetch],
    )

    const debouncedSearch = useMemo(
        () => {
            return debounce(searchSuggestions, DEBOUNCE_TIMEOUT_IN_MS)
        },
        [searchSuggestions],
    )

    const searchEmployeeByPhone = useCallback(async (query) => {
        const contactName = get(value, 'name', undefined)

        await debouncedSearch({
            phone_contains_i: query,
            name_contains_i: contactName,
        })
    }, [debouncedSearch, value])

    const searchEmployeeByName = useCallback(async (query) => {
        const contactPhone = get(value, 'phone', undefined)

        await debouncedSearch({
            name_contains_i: query,
            phone_contains_i: contactPhone,
        })
    }, [debouncedSearch, value])

    const handleSelectContact = (value: string, option: OptionProps) => {
        setValueAndTriggerOnChange(option.item)
    }

    const handleChangeContact = (field) => (fieldValue) => {
        const newValue = {
            ...value,
            [field]: typeof fieldValue === 'string' ? fieldValue.trim() : fieldValue,
        }
        setValueAndTriggerOnChange(newValue)
    }

    const setValueAndTriggerOnChange = (contact) => {
        setValue(contact)
        onChange(contact)
    }

    const handleClearContact = () => {
        setValue(null)
    }

    const renderOptionsBy = useCallback((prop) =>
        employees.map(contact => ({
            value: contact[prop],
            item: contact,
            children: null,
            key: contact.id,
        }))
    , [employees])

    const nameValidator: Rule = useMemo(() => ({
        validator: (_, name) => {
            if (!name) return Promise.resolve()
            if (SPECIAL_CHAR_REGEXP.test(name)) return Promise.reject(FullNameInvalidCharMessage)
            return Promise.resolve()
        },
    }), [FullNameInvalidCharMessage])

    const validations = useMemo(() => ({
        phone: activeTab === CONTACT_TYPE.NOT_RESIDENT ? [phoneValidator] : [],
        name: activeTab === CONTACT_TYPE.NOT_RESIDENT ? [nameValidator] : [],
    }), [activeTab, nameValidator, phoneValidator])

    const phoneOptions = useMemo(() => renderOptionsBy('phone'), [renderOptionsBy])
    const nameOptions = useMemo(() => renderOptionsBy('name'), [renderOptionsBy])

    return (
        <Col span={24}>
            <Row gutter={FIELD_ROW_GUTTER}>
                <Col xs={24} sm={24} md={10}>
                    <Form.Item
                        name={NOT_RESIDENT_PHONE_FORM_ITEM_NAME}
                        rules={validations.phone}
                        initialValue={get(value, 'phone')}
                        wrapperCol={FIELD_WRAPPER_COL}
                        label={PhoneLabel}
                    >
                        <StyledAutoComplete
                            allowClear
                            value={get(value, 'phone')}
                            options={phoneOptions}
                            onSelect={handleSelectContact}
                            onSearch={searchEmployeeByPhone}
                            onChange={handleChangeContact('phone')}
                            onClear={handleClearContact}
                        >
                            <PhoneInput
                                block
                                compatibilityWithAntAutoComplete={true}
                            />
                        </StyledAutoComplete>
                    </Form.Item>
                </Col>
                <Col xs={24} sm={24} md={10}>
                    <Form.Item
                        wrapperCol={FIELD_WRAPPER_COL}
                        label={FullNameLabel}
                        name={NOT_RESIDENT_NAME_FORM_ITEM_NAME}
                        initialValue={initialValue?.name}
                        rules={validations.name}
                    >
                        <StyledAutoComplete
                            allowClear
                            placeholder={NamePlaceholder}
                            value={value?.name}
                            options={nameOptions}
                            onSelect={handleSelectContact}
                            onSearch={searchEmployeeByName}
                            onChange={handleChangeContact('name')}
                            onClear={handleClearContact}
                        />
                    </Form.Item>
                </Col>
            </Row>
        </Col>

    )
}

NotResidentFields.defaultProps = {
    employees: [],
}

export {
    NotResidentFields,
}