import { Col, Form, Input, Row } from 'antd'
import styled from '@emotion/styled'
import { Rule } from 'rc-field-form/lib/interface'
import React, { useEffect, useRef, useState } from 'react'
import { useOrganization } from '@core/next/organization'
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
const { normalizePhone } = require('@condo/domains/common/utils/phone')
import { Button } from '@condo/domains/common/components/Button'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { ErrorsContainer } from '@condo/domains/contact/components/ErrorsContainer'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { useInviteNewOrganizationEmployee } from '../../organization/utils/clientSchema'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { UnitNameInput } from '@condo/domains/user/components/UnitNameInput'

const INPUT_LAYOUT_PROPS = {
    labelCol: {
        span: 6,
    },
    wrapperCol: {
        span: 10,
    },
    style: {
        paddingBottom: '12px',
    },
}

const BottomLineWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24px;
  justify-content: flex-start;
`

export const CreateContactForm: React.FC = () => {
    const intl = useIntl()

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { organization } = useOrganization()
    const router = useRouter()

    const FullNameLabel = intl.formatMessage({ id: 'field.FullName.short' })
    const FullNamePlaceholder = intl.formatMessage({ id:'field.FullName' })
    const PhoneLabel = intl.formatMessage({ id: 'Phone' })
    const FieldIsRequiredMsg = intl.formatMessage({ id: 'FieldIsRequired' })
    const PhoneIsNotValidMsg = intl.formatMessage({ id: 'pages.auth.PhoneIsNotValid' })
    const ExamplePhoneMsg = intl.formatMessage({ id: 'example.Phone' })
    const EmailLabel = intl.formatMessage({ id: 'field.EMail' })
    const EmailError = intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' })
    const SubmitButtonValue = intl.formatMessage({ id: 'AddContact' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const AddressPlaceholder = intl.formatMessage({ id: 'placeholder.Address' })
    const UnitLabel = intl.formatMessage({ id: 'field.Unit' })

    const validations: { [key: string]: Rule[] } = {
        phone: [
            {
                required: true,
                message: FieldIsRequiredMsg,
            },
            {
                validator: (_, value) => {
                    const v = normalizePhone(value)
                    if (!v) return Promise.reject(PhoneIsNotValidMsg)
                    return Promise.resolve()
                },
            },
        ],
        email: [
            {
                type: 'email',
                message: EmailError,
            },
        ],
        property: [
            {
                required: true,
                message: intl.formatMessage({ id: 'field.Property.requiredError' }),
            },
        ],
        unit: [
            {
                required: true,
                message: intl.formatMessage({ id: 'field.Unit.requiredError' }),
            },
        ],
    }

    const [selectedPropertyId, setSelectedPropertyId] = useState(null)
    const selectPropertyIdRef = useRef(selectedPropertyId)
    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
    }, [selectedPropertyId])

    const action = useInviteNewOrganizationEmployee({ organization: { id: organization.id } }, () => {
        router.push('/employee/')
    })

    return (
        <FormWithAction
            action={action}
            layout={'horizontal'}
            validateTrigger={['onBlur', 'onSubmit']}
            colon={false}
        >
            {
                ({ handleSave, isLoading, form }) => {

                    return (
                        <Row gutter={[0, 40]}>
                            <Col span={24}>
                                <Row gutter={[0, 24]}>
                                    <Col span={18}>
                                        <Form.Item
                                            name={'address'}
                                            label={AddressLabel}
                                            labelAlign={'left'}
                                            validateFirst
                                            rules={validations.property}
                                            required
                                            {...INPUT_LAYOUT_PROPS}
                                            wrapperCol={{ span: 14 }}>
                                            <PropertyAddressSearchInput
                                                onSelect={(_, option) => {
                                                    form.setFieldsValue({ 'unit': null })
                                                    setSelectedPropertyId(option.key)
                                                }}
                                                placeholder={AddressPlaceholder}

                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={18}>
                                        <Form.Item
                                            name={'unit'}
                                            label={UnitLabel}
                                            labelAlign={'left'}
                                            required
                                            validateFirst
                                            rules={validations.unit}
                                            {...INPUT_LAYOUT_PROPS}
                                            wrapperCol={{ span: 4 }}>
                                            <UnitNameInput
                                                propertyId={selectedPropertyId}
                                                allowClear={false}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={18}>
                                        <Form.Item
                                            name={'fullName'}
                                            label={FullNameLabel}
                                            {...INPUT_LAYOUT_PROPS}
                                            labelAlign={'left'}>
                                            <Input placeholder={FullNamePlaceholder}/>
                                        </Form.Item>
                                    </Col>
                                    <Col span={18}>
                                        <Form.Item
                                            name={'phone'}
                                            label={PhoneLabel}
                                            labelAlign={'left'}
                                            required
                                            validateFirst
                                            rules={validations.phone}
                                            {...INPUT_LAYOUT_PROPS}
                                        >
                                            <PhoneInput placeholder={ExamplePhoneMsg} style={{ width: '100%' }}/>
                                        </Form.Item>
                                    </Col>
                                    <Col span={18}>
                                        <Form.Item
                                            name={'email'}
                                            label={EmailLabel}
                                            labelAlign={'left'}
                                            validateFirst
                                            rules={validations.email}
                                            {...INPUT_LAYOUT_PROPS}
                                        >
                                            <Input/>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24}>
                                <Form.Item noStyle dependencies={['phone', 'address', 'unit']}>
                                    {
                                        ({ getFieldsValue }) => {
                                            const { phone, address, unit } = getFieldsValue(['phone', 'address', 'unit'])

                                            return (
                                                <Row gutter={[0, 24]}>
                                                    <Col span={24}>
                                                        <BottomLineWrapper>
                                                            <Button
                                                                key='submit'
                                                                onClick={handleSave}
                                                                type='sberPrimary'
                                                                loading={isLoading}
                                                                disabled={!address || !unit || !phone}
                                                            >
                                                                {SubmitButtonValue}
                                                            </Button>
                                                            <ErrorsContainer phone={phone} address={address} unit={unit}/>
                                                        </BottomLineWrapper>
                                                    </Col>
                                                </Row>
                                            )
                                        }
                                    }
                                </Form.Item>
                            </Col>
                        </Row>

                    )
                }
            }
        </FormWithAction>
    )
}