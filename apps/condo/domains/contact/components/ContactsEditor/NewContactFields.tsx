import styled from '@emotion/styled'
import debounce from 'lodash/debounce'
import { Rule } from 'rc-field-form/lib/interface'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Col, Form, FormInstance, Radio } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { MinusCircleOutlined } from '@ant-design/icons'

import { useIntl } from '@open-condo/next/intl'

import { colors } from '@condo/domains/common/constants/style'
import { Contact as TContact } from '@condo/domains/contact/schema'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import Input from '@condo/domains/common/components/antd/Input'
import { normalizePhone } from '@condo/domains/common/utils/phone'

import { CONTACT_TYPE, ContactValue, FieldsType } from './index'

interface INewContactFieldsFieldsProps {
    initialValue?: TContact,
    onChange: (contact: ContactValue) => void,
    onChecked?: () => void,
    checked?: boolean,
    contacts: TContact[],
    displayMinusButton?: boolean,
    onClickMinusButton?: () => void,
    form: FormInstance
    fields: FieldsType
    activeTab: CONTACT_TYPE
}

const MINUS_ICON_STYLE = {
    color: colors.black,
    fontSize: '21px',
    marginTop: '9px',
    marginLeft: '-4px',
}

const RADIO_STYLE = { marginTop: '8px' }

const StyledPhoneInput = styled(PhoneInput)<{ error: boolean }>`
  .form-control {
    border: 1px solid ${props => props.error ? colors.warningText : '#CACACA'};
  }
`

export const NEW_CONTACT_PHONE_FORM_ITEM_NAME = 'IGNORE_FIELD_NEW_CONTACT_PHONE'

const NewContactFields: React.FC<INewContactFieldsFieldsProps> = ({
    initialValue,
    onChange,
    onChecked,
    checked,
    displayMinusButton,
    onClickMinusButton,
    form,
    fields,
    contacts,
    activeTab,
}) => {
    const intl = useIntl()
    const NamePlaceholder = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Name.placeholder' })
    const ContactWithSamePhoneExistMessage = intl.formatMessage({ id: 'contact.Contact.ContactsEditor.Phone.contactWithSamePhoneExists' })

    const [value, setValue] = useState(initialValue)
    const [contactWithSamePhoneExistError, setContactWithSamePhoneExistError] = useState<boolean>(false)

    const handleChangeContact = (field) => (fieldValue) => {
        const newValue = {
            ...value,
            [field]: fieldValue,
        }
        setValueAndTriggerOnChange(newValue)
    }

    const handleNameInput = useCallback(
        (e) => handleChangeContact('name')(get(e, 'target.value')),
        [handleChangeContact])

    const setValueAndTriggerOnChange = (contact) => {
        setValue(contact)
        onChange(contact)
    }

    const handleChecked = () => {
        onChecked && onChecked()
    }

    const isPhoneFieldFilled = useMemo(() => get(value, 'phone.length') === 12, [value])

    const contactExistValidator: Rule = useMemo(() => ({
        validator: (_, value) => {
            if (!value || isEmpty(contacts)) {
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
    }), [ContactWithSamePhoneExistMessage, contacts])

    const validations = useMemo(() => ({
        phone: activeTab === CONTACT_TYPE.RESIDENT ? [contactExistValidator] : [],
    }), [activeTab, contactExistValidator])

    return (
        <>
            <Col span={10}>
                <Form.Item name={NEW_CONTACT_PHONE_FORM_ITEM_NAME} rules={validations.phone}>
                    <StyledPhoneInput
                        error={contactWithSamePhoneExistError}
                        allowClear
                        onChange={handleChangeContact('phone')}
                        block
                    />
                </Form.Item>
            </Col>
            <Col span={10}>
                <Input
                    allowClear
                    placeholder={NamePlaceholder}
                    onInput={handleNameInput}
                    disabled={!isPhoneFieldFilled || contactWithSamePhoneExistError}
                />
            </Col>
            <Col span={2}>
                {onChecked && (
                    <Radio
                        onClick={handleChecked}
                        checked={checked}
                        style={RADIO_STYLE}
                    />
                )}
            </Col>
            <Col span={2}>
                {displayMinusButton && (
                    <MinusCircleOutlined
                        style={MINUS_ICON_STYLE}
                        onClick={onClickMinusButton}
                    />
                )}
            </Col>
        </>
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