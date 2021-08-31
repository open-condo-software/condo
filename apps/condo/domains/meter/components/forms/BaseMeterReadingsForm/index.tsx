// eslint-disable-next-line @typescript-eslint/ban-ts-comment
import { useIntl } from '@core/next/intl'
import { Checkbox, Col, Form, Input, Row, Typography, Tooltip, Tabs } from 'antd'
import { get } from 'lodash'
import React, { useEffect, useRef, useState } from 'react'
import { ITicketFormState, ITicketUIState } from '@condo/domains/ticket/utils/clientSchema/Ticket'
import { FormWithAction, IFormWithActionChildren } from '@condo/domains/common/components/containers/FormList'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { UnitNameInput } from '@condo/domains/user/components/UnitNameInput'
import { useTicketValidations } from './useTicketValidations'
import { useContactsEditorHook } from '@condo/domains/contact/components/ContactsEditor/useContactsEditorHook'
import { useObject } from '@condo/domains/property/utils/clientSchema/Property'
import Prompt from '@condo/domains/common/components/Prompt'
import { IOrganizationEmployeeRoleUIState } from '@condo/domains/organization/utils/clientSchema/OrganizationEmployeeRole'
import { IOrganizationUIState } from '@condo/domains/organization/utils/clientSchema/Organization'
import { MetersGroup } from '../../MetersGroup'
import { MeterResource } from '../../../utils/clientSchema'
import { SnowflakeIcon } from '@condo/domains/common/components/icons/SnowflakeIcon'
import { Loader } from '../../../../common/components/Loader'

export const LAYOUT = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
}

const COLD_WATER_METER_RESOURCE_ID = 'e2bd70ac-0630-11ec-9a03-0242ac130003'

export const UnitInfo = ({ property, loading, setSelectedUnitName, form }) => {
    const intl = useIntl()
    const FlatNumberLabel = intl.formatMessage({ id: 'field.FlatNumber' })
    const SectionNameLabel = intl.formatMessage({ id: 'pages.condo.property.section.Name' })
    const FloorNameLabel = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })

    const updateSectionAndFloor = (form, unitName) => {
        if (unitName) {
            const sections = get(property, ['map', 'sections'], [])
            for (const section of sections) {
                for (const floor of section.floors) {
                    for (const unit of floor.units) {
                        if (unit.label === unitName) {
                            return form.setFieldsValue({ sectionName: section.name, floorName: floor.name })
                        }
                    }
                }
            }
        }
        form.setFieldsValue({ sectionName: null, floorName: null })
    }

    return (
        <Col span={16}>
            <Row justify={'space-between'}>
                <Col span={6}>
                    <Form.Item name={'unitName'} label={FlatNumberLabel}>
                        <UnitNameInput
                            property={property}
                            loading={loading}
                            allowClear={true}
                            onChange={(value, option) => {
                                if (!option) {
                                    setSelectedUnitName(null)
                                    updateSectionAndFloor(form, null)
                                } else {
                                    setSelectedUnitName(value)
                                    updateSectionAndFloor(form, value)
                                }
                            }}
                        />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name={'sectionName'} label={SectionNameLabel}>
                        <Input disabled/>
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name={'floorName'} label={FloorNameLabel}>
                        <Input disabled/>
                    </Form.Item>
                </Col>
            </Row>
        </Col>
    )
}

export const ContactsInfo = ({ ContactsEditorComponent, form, selectedPropertyId, initialValues }) => {
    const intl = useIntl()

    return (
        <Col span={24}>
            <Form.Item shouldUpdate noStyle>
                {({ getFieldsValue }) => {
                    const { property, unitName } = getFieldsValue(['property', 'unitName'])

                    const value = {
                        id: get(initialValues, ['contact', 'id']),
                        name: get(initialValues, 'clientName'),
                        phone: get(initialValues, 'clientPhone'),
                    }

                    return (
                        <ContactsEditorComponent
                            form={form}
                            fields={{
                                id: 'contact',
                                phone: 'clientPhone',
                                name: 'clientName',
                            }}
                            value={value}
                            // Local `property` cannot be used here, because `PropertyAddressSearchInput`
                            // sets `Property.address` as its value, but we need `Property.id` here
                            property={selectedPropertyId}
                            unitName={unitName}
                        />
                    )
                }}
            </Form.Item>
        </Col>
    )
}

export interface ITicketFormProps {
    organization?: IOrganizationUIState
    role?: IOrganizationEmployeeRoleUIState
    initialValues?: ITicketFormState
    action?: (...args) => Promise<ITicketUIState>,
    afterActionCompleted?: (ticket: ITicketUIState) => void,
    children?: IFormWithActionChildren
}

export const BaseMeterForm: React.FC<ITicketFormProps> = (props) => {
    const intl = useIntl()
    const UserInfoTitle = intl.formatMessage({ id: 'pages.condo.ticket.title.ClientInfo' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const AddressPlaceholder = intl.formatMessage({ id: 'placeholder.Address' })
    const AddressNotFoundContent = intl.formatMessage({ id: 'field.Address.notFound' })
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.ticket.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.ticket.warning.modal.HelpMessage' })

    const { action: _action, initialValues, organization, role, afterActionCompleted } = props
    const validations = useTicketValidations()
    const [selectedPropertyId, setSelectedPropertyId] = useState(get(initialValues, 'property'))
    const selectPropertyIdRef = useRef(selectedPropertyId)

    const { loading, obj: property } = useObject({ where: { id: selectedPropertyId ? selectedPropertyId : null } })

    const [selectedUnitName, setSelectedUnitName] = useState(get(initialValues, 'unitName'))
    const selectedUnitNameRef = useRef(selectedUnitName)

    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
    }, [selectedPropertyId])

    useEffect(() => {
        selectedUnitNameRef.current = selectedUnitName
    }, [selectedUnitName])

    const { objs: resources, loading: resourcesLoading } = MeterResource.useObjects({})

    const { createContact, canCreateContact, ContactsEditorComponent } = useContactsEditorHook({
        organization: organization.id,
        role,
    })

    const canCreateContactRef = useRef(canCreateContact)

    useEffect(() => {
        canCreateContactRef.current = canCreateContact
    }, [canCreateContact])

    const action = async (variables, ...args) => {
        const { details, ...otherVariables } = variables
        let createdContact
        if (role.canManageContacts && canCreateContactRef.current) {
            createdContact = await createContact(organization.id, selectPropertyIdRef.current, selectedUnitNameRef.current)
        }
        const result = await _action({
            ...otherVariables,
            contact: get(createdContact, 'id') || variables.contact,
        }, ...args)
        if (afterActionCompleted) {
            return afterActionCompleted(result)
        }
        return result
    }

    return (
        <>
            <FormWithAction
                {...LAYOUT}
                action={action}
                initialValues={initialValues}
                validateTrigger={['onBlur', 'onSubmit']}
                formValuesToMutationDataPreprocessor={(values) => {
                    values.property = selectPropertyIdRef.current
                    values.unitName = selectedUnitNameRef.current
                    return values
                }}
            >
                {({ handleSave, isLoading, form }) => (
                    <>
                        <Prompt
                            title={PromptTitle}
                            form={form}
                            handleSave={handleSave}
                        >
                            <Typography.Paragraph>
                                {PromptHelpMessage}
                            </Typography.Paragraph>
                        </Prompt>
                        <Col lg={13} md={24}>
                            <Row gutter={[0, 20]}>
                                <Col span={24}>
                                    <Row justify={'space-between'} gutter={[0, 15]}>
                                        <Col span={24}>
                                            <Typography.Title level={5}
                                                style={{ margin: '0' }}>{UserInfoTitle}</Typography.Title>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item name={'property'} label={AddressLabel}
                                                rules={validations.property}>
                                                <PropertyAddressSearchInput
                                                    organization={organization}
                                                    autoFocus={true}
                                                    onSelect={(_, option) => {
                                                        form.setFieldsValue({
                                                            unitName: null,
                                                            sectionName: null,
                                                            floorName: null,
                                                        })
                                                        setSelectedPropertyId(option.key)
                                                    }}
                                                    placeholder={AddressPlaceholder}
                                                    notFoundContent={AddressNotFoundContent}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <UnitInfo
                                            property={property}
                                            loading={loading}
                                            setSelectedUnitName={setSelectedUnitName}
                                            form={form}
                                        />
                                    </Row>
                                </Col>
                                <ContactsInfo
                                    ContactsEditorComponent={ContactsEditorComponent}
                                    form={form}
                                    initialValues={initialValues}
                                    selectedPropertyId={selectedPropertyId}
                                />
                                {
                                    !resourcesLoading ? (
                                        <MetersGroup
                                            Icon={SnowflakeIcon}
                                            meterResource={resources.find(resource => resource.id === COLD_WATER_METER_RESOURCE_ID)}
                                        />
                                    ) :  <Loader />
                                }
                            </Row>
                        </Col>
                        {props.children({ handleSave, isLoading, form })}
                    </>
                )}
            </FormWithAction>
        </>
    )
}

