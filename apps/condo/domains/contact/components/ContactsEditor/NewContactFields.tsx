import { Contact as ContactType } from '@app/condo/schema'
import styled from '@emotion/styled'
import { AutoComplete, Col, Form, FormInstance, FormItemProps, InputProps, Row, RowProps } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'

import { MinusCircle } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Radio, Space } from '@open-condo/ui'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { SPECIAL_CHAR_REGEXP } from '@condo/domains/common/constants/regexps'
import { colors } from '@condo/domains/common/constants/style'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { normalizePhone } from '@condo/domains/common/utils/phone'

import { CONTACT_TYPE, ContactValue, FieldsType } from './index'

import type { FormRule as Rule } from 'antd'


interface INewContactFieldsFieldsProps {
    initialValueWithoutContact?: Partial<ContactType>
    onChange: (contact: ContactValue) => void
    onChecked?: () => void
    checked?: boolean
    contacts: ContactType[]
    displayMinusButton?: boolean
    onClickMinusButton?: () => void
    fields: FieldsType
    activeTab: CONTACT_TYPE
    contactsLoading?: boolean
    unitName?: string
    newContactPhoneFormItemProps?: FormItemProps
    newContactNameFormItemProps?: FormItemProps
    disabled?: boolean
    form: FormInstance
}

const FIELD_WRAPPER_COL = { span: 24 }
const FIELD_ROW_GUTTER: RowProps['gutter'] = [16, 0]
const RADIO_COL_SMALL_SCREENS_STYLE: CSSProperties = { position: 'relative', top: '62px' }
const RADIO_COL_LARGE_SCREENS_STYLE: CSSProperties = { height: '48px', marginTop: '52px' }
const AUTO_COMPLETE_STYLE: CSSProperties = { width: '100%' }

const StyledPhoneInput = styled(PhoneInput)<{ error: boolean }>`
  .form-control {
    border: 1px solid ${props => props.error ? colors.warningText : '#CACACA'};
  }
`

export const NEW_CONTACT_PHONE_FORM_ITEM_NAME = 'IGNORE_FIELD_NEW_CONTACT_PHONE'
export const NEW_CONTACT_NAME_FORM_ITEM_NAME = 'IGNORE_FIELD_NEW_CONTACT_NAME'

const NewContactFields: React.FC<INewContactFieldsFieldsProps> = ({
    onChange,
    onChecked,
    checked,
    displayMinusButton,
    onClickMinusButton,
    contacts,
    activeTab,
    contactsLoading,
    unitName,
    initialValueWithoutContact,
    newContactPhoneFormItemProps,
    newContactNameFormItemProps,
    disabled,
    form,
}) => {
    const intl = useIntl()
    const NamePlaceholder = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Name.placeholder' })
    const ContactWithSamePhoneExistMessage = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Phone.contactWithSamePhoneExists' })
    const FullNameLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Name' })
    const PhoneLabel = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Phone' })
    const FullNameInvalidCharMessage = intl.formatMessage({ id:'field.FullName.invalidChar' })

    const [value, setValue] = useState(initialValueWithoutContact)
    const [contactWithSamePhoneExistError, setContactWithSamePhoneExistError] = useState<boolean>(false)

    const { phoneValidator } = useValidations({ allowLandLine: true })
    const { breakpoints } = useLayoutContext()

    const { link } = useOrganization()
    const canManageContacts = get(link, ['role', 'canManageContacts'], false)

    const handleChangeContact = (field) => (fieldValue) => {
        const newValue = {
            ...value,
            [field]: typeof fieldValue === 'string' ? fieldValue.trim() : fieldValue,
        }
        setValueAndTriggerOnChange(newValue)
    }

    const handleNameInput = useCallback(
        (e) => handleChangeContact('name')(e),
        [handleChangeContact])

    const setValueAndTriggerOnChange = (contact) => {
        setValue(contact)
        onChange(contact)
    }

    const handleChecked = () => {
        onChecked && onChecked()
    }

    const isPhoneFieldFilled = useMemo(() => get(value, 'phone.length') === 12, [value])
    const isPhoneDisabled = disabled || !unitName
    const isNameDisabled = isPhoneDisabled || (!isEmpty(contacts) && (!isPhoneFieldFilled || contactWithSamePhoneExistError || !checked))

    const contactExistValidator: Rule = useMemo(() => ({
        validator: (_, value) => {
            if (!value || isEmpty(contacts) || !checked) {
                setContactWithSamePhoneExistError(false)
                return Promise.resolve()
            }

            const v = normalizePhone(value)
            if (contacts.find(contact => contact.phone === v)) {
                setContactWithSamePhoneExistError(true)
                return Promise.reject(ContactWithSamePhoneExistMessage)
            }

            setContactWithSamePhoneExistError(false)
            return Promise.resolve()
        },
    }), [ContactWithSamePhoneExistMessage, checked, contacts])

    const nameValidator: Rule = useMemo(() => ({
        validator: async (_, name) => {
            const phone = form.getFieldValue(NEW_CONTACT_PHONE_FORM_ITEM_NAME)
            if (!isEmpty(contacts) && (!phone || !name || isNameDisabled)) return Promise.resolve()
            if (SPECIAL_CHAR_REGEXP.test(name)) return Promise.reject(FullNameInvalidCharMessage)
            return Promise.resolve()
        },
    }), [FullNameInvalidCharMessage, form, isNameDisabled, contacts])

    const validations = useMemo(() => ({
        phone: activeTab === CONTACT_TYPE.RESIDENT ? [phoneValidator, contactExistValidator] : [],
        name: activeTab === CONTACT_TYPE.RESIDENT ? [nameValidator] : [],
    }), [activeTab, contactExistValidator, nameValidator, phoneValidator])

    const nameValue = get(value, 'name')
    useEffect(() => {
        if (!nameValue) return
        form.setFields([{ name: NEW_CONTACT_NAME_FORM_ITEM_NAME, validating: false, touched: false, errors: [], validated: false }])
    }, [isNameDisabled])

    const inputProps: InputProps = useMemo(() => ({ disabled: isPhoneDisabled }), [isPhoneDisabled])

    if (!canManageContacts) {
        return null
    }

    return (
        <Col span={24}>
            <Row
                align='top'
                justify={breakpoints.TABLET_LARGE ? 'start' : 'space-between'}
                gutter={FIELD_ROW_GUTTER}
            >
                <Col span={20}>
                    <Row gutter={FIELD_ROW_GUTTER}>
                        <Col xs={24} sm={24} md={12}>
                            <Form.Item
                                name={NEW_CONTACT_PHONE_FORM_ITEM_NAME}
                                rules={validations.phone}
                                initialValue={get(value, 'phone')}
                                wrapperCol={FIELD_WRAPPER_COL}
                                label={PhoneLabel}
                                {...newContactPhoneFormItemProps}
                            >
                                <AutoComplete
                                    allowClear
                                    value={get(value, 'phone')}
                                    onChange={handleChangeContact('phone')}
                                >
                                    <StyledPhoneInput
                                        error={contactWithSamePhoneExistError}
                                        block
                                        compatibilityWithAntAutoComplete
                                        disabled={isPhoneDisabled}
                                        inputProps={inputProps}
                                    />
                                </AutoComplete>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={24} md={12}>
                            <Form.Item
                                wrapperCol={FIELD_WRAPPER_COL}
                                label={FullNameLabel}
                                initialValue={value?.name}
                                name={NEW_CONTACT_NAME_FORM_ITEM_NAME}
                                rules={validations.name}
                                {...newContactNameFormItemProps}
                            >
                                <AutoComplete
                                    style={AUTO_COMPLETE_STYLE}
                                    value={value?.name}
                                    allowClear
                                    placeholder={NamePlaceholder}
                                    onChange={handleNameInput}
                                    disabled={contactsLoading || isNameDisabled}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Col>
                <Col span={4} style={breakpoints.TABLET_LARGE ? RADIO_COL_LARGE_SCREENS_STYLE : RADIO_COL_SMALL_SCREENS_STYLE}>
                    <Space size={8} align='center' height='100%'>
                        {onChecked && (
                            <Radio
                                onChange={handleChecked}
                                checked={checked}
                                disabled={disabled}
                            />
                        )}
                        {displayMinusButton && !disabled && breakpoints.TABLET_LARGE && (
                            <MinusCircle
                                onClick={onClickMinusButton}
                            />
                        )}
                    </Space>
                </Col>
            </Row>
        </Col>
    )
}

NewContactFields.defaultProps = {
    displayMinusButton: false,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onClickMinusButton: () => {
    },
}

export {
    NewContactFields,
}