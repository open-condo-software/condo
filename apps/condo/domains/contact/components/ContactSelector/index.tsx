import React, { useCallback, useState } from 'react'
import { Contact } from '../../../../schema'
import { AutoComplete, Row, Col, Radio, Select, Space, Typography } from 'antd'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { BaseSearchInput } from '../../../common/components/BaseSearchInput'
import { grey } from '@ant-design/colors'
import { OptionProps } from 'antd/lib/mentions'
import styled from '@emotion/styled'
import { useIntl } from '../../../../../../packages/@core.next/intl'

interface IContactSelector {
    property: string,
    unitName?: string,
    onSelect: (contact: Contact, isNew: boolean) => void,
}

const Label = styled.span`
  color: #8C8C8C;
`

export const ContactSelector: React.FC<IContactSelector> = (props) => {
    // const intl = useIntl()
    // const FullNameLabel = intl.formatMessage({ id: 'field.FullName' })
    // const PhoneLabel = intl.formatMessage({ id: 'Phone' })
    return (
        <>
            <Col span={8}>
                <Typography.Text type="secondary">{'Телефон'}</Typography.Text>
            </Col>
            <Col span={8}>
                <Typography.Text type="secondary">{'ФИО'}</Typography.Text>
            </Col>
            <ContactSelectFields/>
            {/*<ContactFieldsWithAutoComplete/>*/}
        </>
    )
}

const SAMPLE_CONTACTS =  [
    { id: '1', name: 'Anton', phone: '+79991112233' },
    { id: '2', name: 'Andrey', phone: '+79992223344' },
    { id: '3', name: 'Alexey', phone: '+79993334455' },
]

/**
 * Prevent crash of `String.match`, when providing a regular expression string value,
 * that containts special characters.
 *
 * @example
 *
 *      someString.match(escapeRegex(value))
 *
 * @see https://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
 */
function escapeRegex(string) {
    return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

const ContactSelectFields = () => {
    const [contact, setContact] = useState()

    const searchContactByPhone = useCallback((query) => {
        return SAMPLE_CONTACTS.filter(c => c.phone.match(escapeRegex(query)))
    }, [])

    const handleSelectContactByPhone = (value: string, option: OptionProps) => {
        setContact(option.data)
    }

    const renderContactPhoneOption = useCallback(
        (item) => {
            return (
                <Select.Option
                    style={{ textAlign: 'left', color: grey[6] }}
                    key={item.id}
                    value={item.phone}
                    title={item.phone}
                    data={item}
                >
                    {item.phone}
                </Select.Option>
            )
        }, [])

    const handleClearContactByPhone = () => {
        setContact(null)
    }

    const searchContactByName = useCallback((query) => {
        return SAMPLE_CONTACTS.filter(c => c.name.match(escapeRegex(query)))
    }, [])

    const handleContactByNameSelect = (value: string, option: OptionProps) => {
        setContact(option.data)
    }

    const renderContactNameOption = useCallback(
        (item) => {
            return (
                <Select.Option
                    style={{ textAlign: 'left', color: grey[6] }}
                    key={item.id}
                    value={item.name}
                    title={item.name}
                    data={item}
                >
                    {item.name}
                </Select.Option>
            )
        }, [])

    const handleClearContactByName = () => {
        setContact(null)
    }

    return (
        <Row gutter={[0, 40]}>
            <Col span={9}>
                <BaseSearchInput
                    value={contact && contact.phone}
                    loadOptionsOnFocus={false}
                    search={searchContactByPhone}
                    renderOption={renderContactPhoneOption}
                    onSelect={handleSelectContactByPhone}
                    onClear={handleClearContactByPhone}
                    style={{ width: '100%' }}
                />
            </Col>
            <Col span={9}>
                <BaseSearchInput
                    value={contact && contact.name}
                    loadOptionsOnFocus={false}
                    search={searchContactByName}
                    renderOption={renderContactNameOption}
                    onSelect={handleContactByNameSelect}
                    onClear={handleClearContactByName}
                    style={{ width: '100%' }}
                />
            </Col>
            <Col span={4}>
                <Radio/>
            </Col>
        </Row>
    )
}

const ContactFieldsWithAutoComplete = () => {
    const [contact, setContact] = useState()
    const [contactsByPhone, setContactsByPhone] = useState([])
    const [contactsByName, setContactsByName] = useState([])

    const searchContactByPhone = useCallback((query) => {
        setContactsByPhone(SAMPLE_CONTACTS.filter(c => c.phone.match(escapeRegex(query))))
    }, [])

    const handleSelectContactByPhone = (value: string, option: OptionProps) => {
        setContact(option.item)
    }

    const handleClearContactByPhone = () => {
        setContact(null)
    }

    const searchContactByName = useCallback((query) => {
        setContactsByName(SAMPLE_CONTACTS.filter(c => c.name.match(escapeRegex(query))))
    }, [])

    const handleSelectContactByName = (value: string, option: OptionProps) => {
        setContact(option.item)
    }

    const handleClearContactByName = () => {
        setContact(null)
    }

    const renderOptionsBy = useCallback((prop, items) =>
        items.map(item => ({
            value: item[prop],
            item,
        }))
    , [])

    return (
        <Row gutter={[0, 40]}>
            <Col span={11}>
                <AutoComplete
                    allowClear
                    value={contact ? contact.phone : undefined}
                    options={renderOptionsBy('phone', contactsByPhone)}
                    onSelect={handleSelectContactByPhone}
                    onSearch={searchContactByPhone}
                    onClear={handleClearContactByPhone}
                    placeholder="Phone"
                    style={{ width: '100%' }}
                />
            </Col>
            <Col span={11}>
                <AutoComplete
                    allowClear
                    value={contact ? contact.name : undefined}
                    options={renderOptionsBy('name', contactsByName)}
                    onSelect={handleSelectContactByName}
                    onSearch={searchContactByName}
                    onClear={handleClearContactByName}
                    placeholder="Name"
                    style={{ width: '100%' }}
                />
            </Col>
        </Row>
    )
}

