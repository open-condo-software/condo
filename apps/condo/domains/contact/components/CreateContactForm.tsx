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
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { UnitNameInput } from '@condo/domains/user/components/UnitNameInput'
import { Contact } from '@condo/domains/contact/utils/clientSchema'

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
  justify-content: flex-start;
`

export const CreateContactForm: React.FC = () => {
    const intl = useIntl()
    const FullNameLabel = intl.formatMessage({ id: 'field.FullName.short' })
    const FullNamePlaceholderMessage = intl.formatMessage({ id:'field.FullName' })
    const FullNameRequiredMessage = intl.formatMessage({ id: 'field.FullName.requiredError' })
    const PhoneLabel = intl.formatMessage({ id: 'Phone' })
    const FieldIsRequiredMessage = intl.formatMessage({ id: 'FieldIsRequired' })
    const PhoneIsNotValidMessage = intl.formatMessage({ id: 'pages.auth.PhoneIsNotValid' })
    const ExamplePhoneMessage = intl.formatMessage({ id: 'example.Phone' })
    const EmailLabel = intl.formatMessage({ id: 'field.EMail' })
    const EmailErrorMessage = intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' })
    const SubmitButtonLabel = intl.formatMessage({ id: 'AddContact' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const AddressPlaceholderMessage = intl.formatMessage({ id: 'placeholder.Address' })
    const UnitLabel = intl.formatMessage({ id: 'field.Unit' })
    const PropertyErrorMessage = intl.formatMessage({ id: 'field.Property.requiredError' })
    const UnitErrorMessage = intl.formatMessage({ id: 'field.Unit.requiredError' })

    const { organization } = useOrganization()
    const router = useRouter()

    const validations: { [key: string]: Rule[] } = {
        phone: [
            {
                required: true,
                message: FieldIsRequiredMessage,
            },
            {
                validator: (_, value) => {
                    const v = normalizePhone(value)
                    if (!v) return Promise.reject(PhoneIsNotValidMessage)
                    return Promise.resolve()
                },
            },
        ],
        email: [
            {
                type: 'email',
                message: EmailErrorMessage,
            },
        ],
        property: [
            {
                required: true,
                message: PropertyErrorMessage,
            },
        ],
        unit: [
            {
                required: true,
                message: UnitErrorMessage,
            },
        ],
        name: [
            {
                required: true,
                message: FullNameRequiredMessage,
            },
        ],
    }

    const [selectedPropertyId, setSelectedPropertyId] = useState(null)
    const selectPropertyIdRef = useRef(selectedPropertyId)
    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
    }, [selectedPropertyId])

    // @ts-ignore
    const action = Contact.useCreate({
        organization: organization.id,
    }, () => {
        router.push('/contact/')
    })
    return (
        <FormWithAction
            action={action}
            layout={'horizontal'}
            validateTrigger={['onBlur', 'onSubmit']}
            colon={false}
            formValuesToMutationDataPreprocessor={(values) => {
                values.property = selectPropertyIdRef.current
                return values
            }}
        >
            {
                ({ handleSave, isLoading, form }) => {

                    return (
                        <Row gutter={[0, 40]}>
                            <Col span={24}>
                                <Row gutter={[0, 24]}>
                                    <Col span={18}>
                                        <Form.Item
                                            name={'property'}
                                            label={AddressLabel}
                                            labelAlign={'left'}
                                            validateFirst
                                            rules={validations.property}
                                            required
                                            {...INPUT_LAYOUT_PROPS}
                                            wrapperCol={{ span: 14 }}>
                                            <PropertyAddressSearchInput
                                                onSelect={(_, option) => {
                                                    form.setFieldsValue({ 'unitName': null })
                                                    setSelectedPropertyId(option.key)
                                                }}
                                                onChange={() => {
                                                    form.setFieldsValue({ 'unitName': null })
                                                    setSelectedPropertyId(null)
                                                }}
                                                placeholder={AddressPlaceholderMessage}

                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={18}>
                                        <Form.Item
                                            name={'unitName'}
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
                                            name={'name'}
                                            label={FullNameLabel}
                                            {...INPUT_LAYOUT_PROPS}
                                            labelAlign={'left'}
                                            required
                                            validateFirst
                                            rules={validations.name}>
                                            <Input placeholder={FullNamePlaceholderMessage}/>
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
                                            <PhoneInput placeholder={ExamplePhoneMessage} style={{ width: '100%' }}/>
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
                                <Form.Item noStyle dependencies={['phone', 'property', 'unitName', 'name']}>
                                    {
                                        ({ getFieldsValue }) => {
                                            const { phone, property, unitName, name } = getFieldsValue(['phone', 'property', 'unitName', 'name'])

                                            return (
                                                <Row gutter={[0, 24]}>
                                                    <Col span={24}>
                                                        <BottomLineWrapper>
                                                            <Button
                                                                key='submit'
                                                                onClick={handleSave}
                                                                type='sberPrimary'
                                                                loading={isLoading}
                                                                disabled={!property || !unitName || !phone || !name}
                                                                style={{ marginRight: 24 }}
                                                            >
                                                                {SubmitButtonLabel}
                                                            </Button>
                                                            <ErrorsContainer
                                                                phone={phone}
                                                                address={property}
                                                                unit={unitName}
                                                                name={name}/>
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