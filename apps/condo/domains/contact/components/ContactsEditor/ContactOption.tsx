import { Col, Row, Form, RowProps } from 'antd'
import React, { CSSProperties, useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Radio, Space } from '@open-condo/ui'

import Input from '@condo/domains/common/components/antd/Input'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { Contact as TContact } from '@condo/domains/contact/schema'

interface IContactFieldsDisplayProps {
    contact: TContact,
    onSelect: (contact: TContact) => void,
    selected: boolean,
}

const FIELD_WRAPPER_COL = { span: 24 }
const FIELD_ROW_GUTTER: RowProps['gutter'] = [16, 0]
const RADIO_COL_SMALL_SCREENS_STYLE: CSSProperties = { position: 'relative', top: '62px' }
const RADIO_COL_LARGE_SCREENS_STYLE: CSSProperties = { height: '48px' }

export const ContactOption: React.FC<IContactFieldsDisplayProps> = ({ contact, onSelect, selected }) => {
    const intl = useIntl()
    const FullNameLabel = intl.formatMessage({ id: 'contact.contact.contactsEditor.name' })
    const PhoneLabel = intl.formatMessage({ id: 'contact.contact.contactsEditor.phone' })

    const { breakpoints } = useLayoutContext()

    const handleSelect = useCallback(() => {
        onSelect(contact)
    }, [contact, onSelect])

    return (
        <Row
            gutter={FIELD_ROW_GUTTER}
            align={breakpoints.TABLET_LARGE ? 'bottom' : 'top'}
            justify={breakpoints.TABLET_LARGE ? 'start' : 'space-between'}
        >
            <Col span={20}>
                <Row gutter={FIELD_ROW_GUTTER}>
                    <Col xs={24} sm={24} md={12}>
                        <Form.Item
                            wrapperCol={FIELD_WRAPPER_COL}
                            label={PhoneLabel}
                        >
                            <PhoneInput
                                disabled
                                value={contact.phone}
                                block
                            />
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={24} md={12}>
                        <Form.Item
                            wrapperCol={FIELD_WRAPPER_COL}
                            label={FullNameLabel}
                        >
                            <Input
                                disabled
                                value={contact.name}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Col>
            <Col span={4} style={breakpoints.TABLET_LARGE ? RADIO_COL_LARGE_SCREENS_STYLE : RADIO_COL_SMALL_SCREENS_STYLE}>
                <Space size={8} align='center' height='100%'>
                    <Radio
                        onChange={handleSelect}
                        checked={selected}
                    />
                </Space>
            </Col>
        </Row>
    )
}
