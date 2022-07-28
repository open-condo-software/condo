import { BuildingUnitSubType } from '@app/condo/schema'
import Input from '@condo/domains/common/components/antd/Input'
import { Button } from '@condo/domains/common/components/Button'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { Loader } from '@condo/domains/common/components/Loader'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { ContactRoleSelect } from '@condo/domains/contact/components/contactRoles/ContactRoleSelect'
import { ErrorsContainer } from '@condo/domains/contact/components/ErrorsContainer'
import { Contact, ContactRole } from '@condo/domains/contact/utils/clientSchema'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { UnitNameInput, UnitNameInputOption } from '@condo/domains/user/components/UnitNameInput'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import styled from '@emotion/styled'
import { Col, Form, Row } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import { Rule } from 'rc-field-form/lib/interface'
import React, { useEffect, useRef, useState } from 'react'

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
    const ExamplePhoneMessage = intl.formatMessage({ id: 'example.Phone' })
    const ExampleEmailMessage = intl.formatMessage({ id: 'example.Email' })
    const EmailLabel = intl.formatMessage({ id: 'field.EMail' })
    const EmailErrorMessage = intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' })
    const SubmitButtonLabel = intl.formatMessage({ id: 'AddContact' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const AddressPlaceholderMessage = intl.formatMessage({ id: 'placeholder.Address' })
    const UnitLabel = intl.formatMessage({ id: 'field.Unit' })
    const PropertyErrorMessage = intl.formatMessage({ id: 'field.Property.requiredError' })
    const UnitErrorMessage = intl.formatMessage({ id: 'field.Unit.requiredError' })
    const RoleLabel = intl.formatMessage({ id: 'ContactRole' })

    const { organization } = useOrganization()
    const router = useRouter()

    const { changeMessage, phoneValidator, emailValidator, requiredValidator } = useValidations({ allowLandLine: true })
    const validations: { [key: string]: Rule[] } = {
        phone: [requiredValidator, phoneValidator],
        email: [changeMessage(emailValidator, EmailErrorMessage)],
        property: [changeMessage(requiredValidator, PropertyErrorMessage)],
        unit: [changeMessage(requiredValidator, UnitErrorMessage)],
        name: [changeMessage(requiredValidator, FullNameRequiredMessage)],
    }

    const [selectedPropertyId, setSelectedPropertyId] = useState(null)
    const selectedPropertyIdRef = useRef(selectedPropertyId)
    const [selectedUnitName, setSelectedUnitName] = useState(null)
    const selectedUnitNameRef = useRef(selectedUnitName)
    const [selectedUnitType, setSelectedUnitType] = useState<BuildingUnitSubType>(BuildingUnitSubType.Flat)
    const selectedUnitTypeRef = useRef(selectedUnitType)

    const { loading, obj: property } = Property.useObject({ where:{ id: selectedPropertyId ? selectedPropertyId : null } })

    const {
        loading: isRolesLoading,
        count: totalRoles,
        objs: roles,
    } = ContactRole.useObjects({
        where: {
            OR: [
                { organization_is_null: true },
                { organization: { id: get(organization, 'id') } },
            ],
        },
    })

    useEffect(() => {
        selectedPropertyIdRef.current = selectedPropertyId
    }, [selectedPropertyId])

    useEffect(() => {
        selectedUnitNameRef.current = selectedUnitName
    }, [selectedUnitName])

    useEffect(() => {
        selectedUnitTypeRef.current = selectedUnitType
    }, [selectedUnitType])

    const action = Contact.useCreate({
        organization: { connect: { id: organization.id } },
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
                values.property = { connect: { id: selectedPropertyIdRef.current } }
                values.unitName = selectedUnitNameRef.current
                values.unitType = selectedUnitTypeRef.current
                const role = get(values, 'role')

                if (role) {
                    values.role = { connect: { id: String(role) } }
                }

                return values
            }}
        >
            {
                ({ handleSave, isLoading, form }) => {

                    return (
                        <Row gutter={[0, 40]}>
                            <Col span={24}>
                                <Row gutter={[0, 24]}>
                                    <Col lg={18} xs={24}>
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
                                                organization={organization}
                                                onSelect={(_, option) => {
                                                    form.setFieldsValue({ 'unitName': null })
                                                    setSelectedPropertyId(option.key)
                                                }}
                                                onChange={() => {
                                                    form.setFieldsValue({ 'unitName': null })
                                                    setSelectedPropertyId(null)
                                                    setSelectedUnitType(null)
                                                }}
                                                placeholder={AddressPlaceholderMessage}

                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col lg={18} xs={24}>
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
                                                property={property}
                                                allowClear={false}
                                                loading={loading}
                                                onChange={(_, option: UnitNameInputOption) => {
                                                    if (!option) {
                                                        setSelectedUnitName(null)
                                                        setSelectedUnitType(null)
                                                    } else {
                                                        const unitName = get(option, 'data-unitName')
                                                        setSelectedUnitName(unitName)
                                                        const unitType = get(option, 'data-unitType', BuildingUnitSubType.Flat)
                                                        setSelectedUnitType(unitType)
                                                    }
                                                }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col lg={18} xs={24}>
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
                                    <Col lg={18} xs={24}>
                                        <Form.Item
                                            name="role"
                                            label={RoleLabel}
                                            {...INPUT_LAYOUT_PROPS}
                                            labelAlign="left"
                                        >
                                            {
                                                isRolesLoading ? (
                                                    <Loader fill size="small"/>
                                                ) : (
                                                    <ContactRoleSelect roles={roles}/>
                                                )
                                            }
                                        </Form.Item>
                                    </Col>
                                    <Col lg={18} xs={24}>
                                        <Form.Item
                                            name={'phone'}
                                            label={PhoneLabel}
                                            labelAlign={'left'}
                                            required
                                            validateFirst
                                            rules={validations.phone}
                                            {...INPUT_LAYOUT_PROPS}
                                        >
                                            <PhoneInput placeholder={ExamplePhoneMessage} block/>
                                        </Form.Item>
                                    </Col>
                                    <Col lg={18} xs={24}>
                                        <Form.Item
                                            name={'email'}
                                            label={EmailLabel}
                                            labelAlign={'left'}
                                            validateFirst
                                            rules={validations.email}
                                            {...INPUT_LAYOUT_PROPS}
                                        >
                                            <Input placeholder={ExampleEmailMessage}/>
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
