import React, { useCallback } from 'react'
import { Col } from 'antd'
import Input from '@condo/domains/common/components/antd/Input'
import Radio from '@condo/domains/common/components/antd/Radio'
import { Contact as TContact } from '@condo/domains/contact/schema'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'

interface IContactFieldsDisplayProps {
    contact: TContact,
    onSelect: (contact: TContact) => void,
    selected: boolean,
}

export const ContactOption: React.FC<IContactFieldsDisplayProps> = ({ contact, onSelect, selected }) => {
    const handleSelect = useCallback(() => {
        onSelect(contact)
    }, [contact, onSelect])

    return (
        <>
            <Col span={10}>
                <PhoneInput
                    disabled
                    value={contact.phone}
                    block
                />
            </Col>
            <Col span={10}>
                <Input
                    disabled
                    value={contact.name}
                />
            </Col>
            <Col span={2}>
                <Radio
                    onClick={handleSelect}
                    checked={selected}
                    style={{ marginTop: '8px' }}
                />
            </Col>
            <Col span={2}>
            </Col>
        </>
    )
}
