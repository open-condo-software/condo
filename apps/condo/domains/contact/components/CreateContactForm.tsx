import {
    useGetCommonOrOrganizationContactRolesQuery,
    useGetPropertyWithMapByIdQuery,
    useCreateContactMutation,
} from '@app/condo/gql'
import { BuildingUnitSubType } from '@app/condo/schema'
import { Col, Form, Row } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar } from '@open-condo/ui'

import Checkbox from '@condo/domains/common/components/antd/Checkbox'
import Input from '@condo/domains/common/components/antd/Input'
import { ButtonWithDisabledTooltip } from '@condo/domains/common/components/ButtonWithDisabledTooltip'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { Loader } from '@condo/domains/common/components/Loader'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { fontSizes } from '@condo/domains/common/constants/style'
import { useValidations } from '@condo/domains/common/hooks/useValidations'
import { getObjectValueFromQuery } from '@condo/domains/common/utils/query'
import { ContactRoleSelect } from '@condo/domains/contact/components/contactRoles/ContactRoleSelect'
import { ClientType, getClientCardTabKey } from '@condo/domains/contact/utils/clientCard'
import { usePropertyValidations } from '@condo/domains/property/components/BasePropertyForm/usePropertyValidations'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { UnitNameInput, UnitNameInputOption } from '@condo/domains/user/components/UnitNameInput'
import { UNABLE_TO_CREATE_CONTACT_DUPLICATE, UNABLE_TO_UPDATE_CONTACT_DUPLICATE } from '@condo/domains/user/constants/errors'

import type { FormRule as Rule } from 'antd'


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
    colon: false,
}
const ADDRESS_SEARCH_WRAPPER_COL = { span: 14 }


const CHECKBOX_STYLE: CSSProperties = { paddingLeft: '0px', fontSize: fontSizes.content }

export const CreateContactForm: React.FC = () => {
    const intl = useIntl()
    const FullNameLabel = intl.formatMessage({ id: 'field.FullName.short' })
    const FullNamePlaceholderMessage = intl.formatMessage({ id:'field.FullName' })
    const FullNameInvalidCharMessage = intl.formatMessage({ id:'field.FullName.invalidChar' })
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
    const AddressNotSelected = intl.formatMessage({ id: 'field.Property.nonSelectedError' })
    const ContactDuplicateError = intl.formatMessage({ id: 'contact.ContactDuplicateError' })
    const Verified = intl.formatMessage({ id: 'pages.condo.contact.Verified' })
    const NameLabel = intl.formatMessage({ id: 'field.FullName.short' })
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })
    const ContactDuplicateMessage = intl.formatMessage({ id: 'contact.ContactDuplicateError' })
    
    const { organization, role } = useOrganization()
    const router = useRouter()
    const initialValuesFromQuery = useMemo(() => getObjectValueFromQuery(router, ['initialValues']), [router])

    const [selectedPropertyId, setSelectedPropertyId] = useState(initialValuesFromQuery?.property || null)
    const selectedPropertyIdRef = useRef(selectedPropertyId)
    const [selectedUnitName, setSelectedUnitName] = useState(initialValuesFromQuery?.unitName || null)
    const selectedUnitNameRef = useRef(selectedUnitName)
    const [selectedUnitType, setSelectedUnitType] = useState<BuildingUnitSubType>(initialValuesFromQuery?.unitType as BuildingUnitSubType || BuildingUnitSubType.Flat)
    const selectedUnitTypeRef = useRef(selectedUnitType)
    const [isFieldsChanged, setIsFieldsChanged] = useState(false)

    const redirectToClientCard = useMemo(() => !!get(router, ['query', 'redirectToClientCard']), [router])

    const {
        changeMessage,
        phoneValidator,
        emailValidator,
        requiredValidator,
        specCharValidator,
        trimValidator,
    } = useValidations({ allowLandLine: true })
    const { addressValidator } = usePropertyValidations()
    const validations: { [key: string]: Rule[] } = {
        phone: [requiredValidator, phoneValidator],
        email: [changeMessage(emailValidator, EmailErrorMessage)],
        property: [
            changeMessage(requiredValidator, PropertyErrorMessage),
            addressValidator(selectedPropertyId, true),
        ],
        unit: [changeMessage(requiredValidator, UnitErrorMessage)],
        name: [
            changeMessage(trimValidator, FullNameRequiredMessage),
            changeMessage(specCharValidator, FullNameInvalidCharMessage),
        ],
    }

    const { loading, data: propertyData } = useGetPropertyWithMapByIdQuery({
        variables: {
            id: selectedPropertyId as string,
        },
        skip: !selectedPropertyId,
        fetchPolicy: 'network-only',
    })
    const property = propertyData?.property[0]

    const { persistor } = useCachePersistor()
    const organizationId = useMemo(() => organization?.id, [organization?.id])
    const {
        loading: isRolesLoading,
        data: rolesData,
    } = useGetCommonOrOrganizationContactRolesQuery({
        variables: { organizationId },
        skip: !persistor || !organizationId,
    })
    const roles = useMemo(() => rolesData?.roles?.filter(Boolean) || [], [rolesData?.roles])

    useEffect(() => {
        selectedPropertyIdRef.current = selectedPropertyId
    }, [selectedPropertyId])

    useEffect(() => {
        selectedUnitNameRef.current = selectedUnitName
    }, [selectedUnitName])

    useEffect(() => {
        selectedUnitTypeRef.current = selectedUnitType
    }, [selectedUnitType])

    const ErrorToFormFieldMsgMapping = {
        [UNABLE_TO_UPDATE_CONTACT_DUPLICATE]: {
            name: '_NON_FIELD_ERROR_',
            errors: [ContactDuplicateError],
        },
        [UNABLE_TO_CREATE_CONTACT_DUPLICATE]: {
            name: '_NON_FIELD_ERROR_',
            errors: [ContactDuplicateError],
        },
    }

    const [createContactMutation] = useCreateContactMutation()

    const actionWithHandleSubmit = useCallback(async (data) => {
        setIsFieldsChanged(false)
        const response = await createContactMutation({
            variables: {
                data: {
                    ...data,
                    organization: { connect: { id: organization.id } },
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                },
            },
        })

        if (redirectToClientCard) {
            const contact = response?.data?.contact
            const phone = contact.phone
            const propertyId = get(contact, 'property.id')
            if (phone && propertyId) {
                await router.push(`/phone/${phone}?tab=${getClientCardTabKey(propertyId, ClientType.Resident, contact.unitName, contact.unitType)}`)
            }
        } else {
            await router.push('/contact/')
        }
    }, [createContactMutation, organization?.id, redirectToClientCard, router])

    const canManageContacts = role?.canManageContacts

    return (
        <FormWithAction
            action={actionWithHandleSubmit}
            initialValues={initialValuesFromQuery}
            layout='horizontal'
            validateTrigger={['onBlur', 'onSubmit']}
            colon={false}
            onChange={()=> setIsFieldsChanged(true) }
            ErrorToFormFieldMsgMapping={ErrorToFormFieldMsgMapping}
            isNonFieldErrorHidden
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
                                            name='property'
                                            label={AddressLabel}
                                            labelAlign='left'
                                            validateFirst
                                            rules={validations.property}
                                            required
                                            {...INPUT_LAYOUT_PROPS}
                                            wrapperCol={ADDRESS_SEARCH_WRAPPER_COL}>
                                            <PropertyAddressSearchInput
                                                organizationId={get(organization, 'id')}
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
                                            name='unitName'
                                            label={UnitLabel}
                                            labelAlign='left'
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
                                            name='name'
                                            label={FullNameLabel}
                                            {...INPUT_LAYOUT_PROPS}
                                            labelAlign='left'
                                            required
                                            validateFirst
                                            rules={validations.name}>
                                            <Input placeholder={FullNamePlaceholderMessage}/>
                                        </Form.Item>
                                    </Col>
                                    <Col lg={18} xs={24}>
                                        <Form.Item
                                            name='phone'
                                            label={PhoneLabel}
                                            labelAlign='left'
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
                                            name='email'
                                            label={EmailLabel}
                                            labelAlign='left'
                                            validateFirst
                                            rules={validations.email}
                                            {...INPUT_LAYOUT_PROPS}
                                        >
                                            <Input placeholder={ExampleEmailMessage}/>
                                        </Form.Item>
                                    </Col>
                                    <Col lg={18} xs={24}>
                                        <Form.Item
                                            name='role'
                                            label={RoleLabel}
                                            {...INPUT_LAYOUT_PROPS}
                                            labelAlign='left'
                                        >
                                            {
                                                isRolesLoading ? (
                                                    <Loader fill size='small'/>
                                                ) : (
                                                    <ContactRoleSelect roles={roles}/>
                                                )
                                            }
                                        </Form.Item>
                                    </Col>
                                    <Col lg={18} xs={24}>
                                        <Form.Item
                                            {...INPUT_LAYOUT_PROPS}
                                            labelAlign='left'
                                            name='isVerified'
                                            label={Verified}
                                            valuePropName='checked'
                                        >
                                            <Checkbox
                                                style={CHECKBOX_STYLE}
                                                id='contact-is-verified'
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Col>
                            <Col span={24}>
                                <Form.Item noStyle dependencies={['phone', 'property', 'unitName', 'name']} shouldUpdate>
                                    {
                                        ({ getFieldsValue, getFieldError }) => {
                                            const { phone, property, unitName } = getFieldsValue(['phone', 'property', 'unitName'])
                                            const propertyMismatchError = getFieldError('property').find((error)=>error.includes(AddressNotSelected))
                                            const hasDuplicateError = Boolean(getFieldError('_NON_FIELD_ERROR_').find((error => error.includes(ContactDuplicateError))))
                                            const hasNameSpecCharError = Boolean(getFieldError('name').find((error => error.includes(FullNameInvalidCharMessage))))
                                            const hasNameTrimValidateError = Boolean(getFieldError('name').find((error => error.includes(FullNameRequiredMessage))))
                                            const hasContactDuplicate = isFieldsChanged ? false : hasDuplicateError
                                            const isDisabled = !property
                                                || !unitName
                                                || !phone
                                                || hasNameTrimValidateError
                                                || !!propertyMismatchError
                                                || hasContactDuplicate
                                                || hasNameSpecCharError
                                                || !canManageContacts

                                            const messageLabels = []
                                            if (!property) messageLabels.push(`"${AddressLabel}"`)
                                            if (!unitName) messageLabels.push(`"${UnitLabel}"`)
                                            if (hasNameTrimValidateError) messageLabels.push(`"${NameLabel}"`)
                                            if (!phone) messageLabels.push(`"${PhoneLabel}"`)

                                            const requiredErrorMessage = !isEmpty(messageLabels) && ErrorsContainerTitle.concat(' ', messageLabels.join(', '))
                                            const contactDuplicateError = hasContactDuplicate ? ContactDuplicateMessage : undefined
                                            const nameSpecCharError = hasNameSpecCharError ? FullNameInvalidCharMessage : undefined

                                            const errors = [requiredErrorMessage, contactDuplicateError, nameSpecCharError]
                                                .filter(Boolean)
                                                .join(', ')

                                            return (
                                                <ActionBar
                                                    actions={[
                                                        <ButtonWithDisabledTooltip
                                                            key='submit'
                                                            type='primary'
                                                            disabled={isDisabled}
                                                            title={errors}
                                                            onClick={handleSave}
                                                            loading={isLoading}
                                                        >
                                                            {SubmitButtonLabel}
                                                        </ButtonWithDisabledTooltip>,
                                                    ]}
                                                />
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
