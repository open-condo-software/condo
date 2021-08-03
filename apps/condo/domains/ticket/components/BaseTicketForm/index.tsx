// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useIntl } from '@core/next/intl'
import { Checkbox, Col, Form, Input, Row, Typography, Tooltip, Tabs } from 'antd'
import { get } from 'lodash'
import React, { useEffect, useRef, useState } from 'react'
import { ITicketFormState } from '@condo/domains/ticket/utils/clientSchema/Ticket'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { searchEmployee, searchTicketClassifier } from '../../utils/clientSchema/search'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { LabelWithInfo } from '@condo/domains/common/components/LabelWithInfo'
import { UnitNameInput } from '@condo/domains/user/components/UnitNameInput'
import { UserNameField } from '@condo/domains/user/components/UserNameField'
import { useTicketValidations } from './useTicketValidations'
import { FrontLayerContainer } from '@condo/domains/common/components/FrontLayerContainer'
import { useMultipleFileUploadHook } from '@condo/domains/common/components/MultipleFileUpload'
import { TicketFile, ITicketFileUIState } from '@condo/domains/ticket/utils/clientSchema'
import { useContactsEditorHook } from '@condo/domains/contact/components/ContactsEditor/useContactsEditorHook'
import { useOrganization } from '@core/next/organization'
import { useObject } from '@condo/domains/property/utils/clientSchema/Property'
import { normalizeText } from '@condo/domains/common/utils/text'
import { InputWithCounter } from '@condo/domains/common/components/InputWithCounter'
import Prompt from '@condo/domains/common/components/Prompt'

const { TabPane } = Tabs

const LAYOUT = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
}

interface IOrganization {
    id: string
}

interface ITicketFormProps {
    organization: IOrganization
    initialValues?: ITicketFormState
    action?: (...args) => void,
    files?: ITicketFileUIState[],
    afterActionCompleted?: (ticket: ITicketFormState) => void,
}

// TODO(Dimitreee): decompose this huge component to field groups
export const BaseTicketForm: React.FC<ITicketFormProps> = (props) => {
    const intl = useIntl()

    const UserInfoTitle = intl.formatMessage({ id: 'pages.condo.ticket.title.ClientInfo' })
    const TicketInfoTitle = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketInfo' })
    const TicketPurposeTitle = intl.formatMessage({ id: 'TicketPurpose' })
    const AttachedFilesLabel = intl.formatMessage({ id: 'component.uploadlist.AttachedFilesLabel' })
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const FlatNumberLabel = intl.formatMessage({ id: 'field.FlatNumber' })
    const SectionNameLabel = intl.formatMessage({ id: 'pages.condo.property.section.Name' })
    const FloorNameLabel = intl.formatMessage({ id: 'pages.condo.property.floor.Name' })
    const DescriptionLabel = intl.formatMessage({ id: 'pages.condo.ticket.field.Description' })
    const ClassifierLabel = intl.formatMessage({ id: 'Classifier' })
    const ExecutorLabel = intl.formatMessage({ id: 'field.Executor' })
    const ResponsibleLabel = intl.formatMessage({ id: 'field.Responsible' })
    const EmergencyLabel = intl.formatMessage({ id: 'Emergency' })
    const PaidLabel = intl.formatMessage({ id: 'Paid' })
    const AddressPlaceholder = intl.formatMessage({ id: 'placeholder.Address' })
    const DescriptionPlaceholder = intl.formatMessage({ id: 'placeholder.Description' })
    const ExecutorExtra = intl.formatMessage({ id: 'field.Executor.description' })
    const ResponsibleExtra = intl.formatMessage({ id: 'field.Responsible.description' })
    const NotImplementedYetMessage = intl.formatMessage({ id: 'NotImplementedYet' })
    const TicketFromResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketFromResident' })
    const TicketNotFromResidentMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketNotFromResident' })
    const AddressNotFoundContent = intl.formatMessage({ id: 'field.Address.notFound' })
    const PromptTitle = intl.formatMessage({ id: 'pages.condo.ticket.warning.modal.Title' })
    const PromptHelpMessage = intl.formatMessage({ id: 'pages.condo.ticket.warning.modal.HelpMessage' })

    const { action: _action, initialValues, organization, afterActionCompleted, files } = props
    const validations = useTicketValidations()
    const [selectedPropertyId, setSelectedPropertyId] = useState(get(initialValues, 'property'))
    const selectPropertyIdRef = useRef(selectedPropertyId)

    const { loading, obj: property } = useObject({ where: { id: selectedPropertyId ? selectedPropertyId : null } })

    const [selectedUnitName, setSelectedUnitName] = useState(get(initialValues, 'unitName'))
    const selectedUnitNameRef = useRef(selectedUnitName)

    const [currentDetailsLength, setCurrentDetailsLength] = useState<number>(initialValues.details ? initialValues.details.length : 0)

    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
    }, [selectedPropertyId])

    useEffect(() => {
        selectedUnitNameRef.current = selectedUnitName
    }, [selectedUnitName])

    const { UploadComponent, syncModifiedFiles } = useMultipleFileUploadHook({
        Model: TicketFile,
        relationField: 'ticket',
        initialFileList: files,
        initialCreateValues: { organization: organization.id },
    })

    const { createContact, canCreateContact, ContactsEditorComponent } = useContactsEditorHook({
        organization: organization.id,
    })

    const canCreateContactRef = useRef(canCreateContact)

    useEffect(() => {
        canCreateContactRef.current = canCreateContact
    }, [canCreateContact])

    const { link: { role } } = useOrganization()

    const action = async (variables, ...args) => {
        const { details, ...otherVariables } = variables
        let createdContact
        if (role.canManageContacts && canCreateContactRef.current) {
            createdContact = await createContact(organization.id, selectPropertyIdRef.current, selectedUnitNameRef.current)
        }
        const result = await _action({
            ...otherVariables,
            details: normalizeText(details),
            contact: get(createdContact, 'id') || variables.contact,
        }, ...args)
        await syncModifiedFiles(result.id)
        if (afterActionCompleted) {
            return afterActionCompleted(result)
        }
        return result
    }

    const formatUserFieldLabel = ({ text, value }) => (
        <UserNameField user={{ name: text, id: value }}>
            {({ name, postfix }) => <>{name} {postfix}</>}
        </UserNameField>
    )

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
                        <Col span={13}>
                            <Row gutter={[0, 40]}>
                                <Col span={24}>
                                    <Row justify={'space-between'} gutter={[0, 15]}>
                                        <Col span={24}>
                                            <Typography.Title level={5} style={{ margin: '0' }}>{UserInfoTitle}</Typography.Title>
                                        </Col>
                                        <Col span={24}>
                                            <Form.Item name={'property'} label={AddressLabel} rules={validations.property}>
                                                <PropertyAddressSearchInput
                                                    autoFocus={true}
                                                    onSelect={(_, option) => {
                                                        form.setFieldsValue({ unitName: null, sectionName: null, floorName: null })
                                                        setSelectedPropertyId(option.key)
                                                    }}
                                                    placeholder={AddressPlaceholder}
                                                    notFoundContent={AddressNotFoundContent}
                                                />
                                            </Form.Item>
                                        </Col>
                                        {selectedPropertyId && (
                                            <Col span={16}>
                                                <Row justify={'space-between'}>
                                                    <Col span={6}>
                                                        <Form.Item name={'unitName'} label={FlatNumberLabel}>
                                                            <UnitNameInput
                                                                property={property}
                                                                loading={loading}
                                                                allowClear={true}
                                                                onChange={(_, option) => {
                                                                    if (!option) {
                                                                        setSelectedUnitName(null)
                                                                        updateSectionAndFloor(form, null)
                                                                    }
                                                                    else {
                                                                        setSelectedUnitName(option.key)
                                                                        updateSectionAndFloor(form, option.key)
                                                                    }
                                                                }}
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={6}>
                                                        <Form.Item name={'sectionName'} label={SectionNameLabel}>
                                                            <Input disabled />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={6}>
                                                        <Form.Item name={'floorName'} label={FloorNameLabel}>
                                                            <Input disabled />
                                                        </Form.Item>
                                                    </Col>
                                                </Row>
                                            </Col>
                                        )}
                                    </Row>
                                </Col>
                                <Col span={24}>
                                    <Form.Item shouldUpdate noStyle>
                                        {({ getFieldsValue }) => {
                                            const { property, unitName } = getFieldsValue(['property', 'unitName'])

                                            const value = {
                                                id: get(initialValues.contact, 'id'),
                                                name: initialValues.clientName,
                                                phone: initialValues.clientPhone,
                                            }

                                            return (
                                                <FocusContainer className={!property && 'disabled'}>
                                                    <Tabs defaultActiveKey="1" style={{ width: '100%' }}>
                                                        <TabPane tab={TicketFromResidentMessage} key="1">
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
                                                        </TabPane>
                                                        <TabPane
                                                            tab={
                                                                <Tooltip title={NotImplementedYetMessage}>
                                                                    {TicketNotFromResidentMessage}
                                                                </Tooltip>
                                                            }
                                                            key="2"
                                                            disabled
                                                        />
                                                    </Tabs>
                                                </FocusContainer>
                                            )
                                        }}
                                    </Form.Item>
                                </Col>
                                <Form.Item noStyle dependencies={['property']}>
                                    {
                                        ({ getFieldsValue }) => {
                                            const { property } = getFieldsValue(['property'])
                                            const disableUserInteraction = !property

                                            return (
                                                <Col span={24}>
                                                    <FrontLayerContainer showLayer={disableUserInteraction}>
                                                        <Row gutter={[0, 40]}>
                                                            <Col span={24}>
                                                                <Row gutter={[0, 24]}>
                                                                    <Col span={24}>
                                                                        <Typography.Title level={5} style={{ margin: '0' }}>{TicketInfoTitle}</Typography.Title>
                                                                    </Col>
                                                                    <Col span={24}>
                                                                        <Form.Item name={'details'} rules={validations.details} label={DescriptionLabel}>
                                                                            <InputWithCounter
                                                                                InputComponent={Input.TextArea}
                                                                                currentLength={currentDetailsLength}
                                                                                maxLength={500}
                                                                                onChange={e => setCurrentDetailsLength(e.target.value.length)}
                                                                                placeholder={DescriptionPlaceholder}
                                                                                disabled={disableUserInteraction}
                                                                            />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col flex={0}>
                                                                        <Form.Item
                                                                            label={AttachedFilesLabel}
                                                                        >
                                                                            <UploadComponent />
                                                                        </Form.Item>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                            <Col span={24}>
                                                                <Row align={'top'} >
                                                                    <Col span={11}>
                                                                        <Form.Item name={'classifier'} rules={validations.classifier} label={ClassifierLabel} >
                                                                            <GraphQlSearchInput
                                                                                search={searchTicketClassifier}
                                                                                allowClear={false}
                                                                                disabled={disableUserInteraction}
                                                                            />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col push={2} span={11}>
                                                                        <Row>
                                                                            <Col span={12}>
                                                                                <Form.Item name={'isEmergency'} label={' '} valuePropName='checked'>
                                                                                    <Checkbox disabled={disableUserInteraction}>{EmergencyLabel}</Checkbox>
                                                                                </Form.Item>
                                                                            </Col>
                                                                            <Col span={12}>
                                                                                <Form.Item name={'isPaid'} label={' '} valuePropName='checked'>
                                                                                    <Checkbox disabled={disableUserInteraction}>{PaidLabel}</Checkbox>
                                                                                </Form.Item>
                                                                            </Col>
                                                                        </Row>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                            <Col span={24}>
                                                                <Row justify={'space-between'} gutter={[0, 24]}>
                                                                    <Col span={24}>
                                                                        <Typography.Title level={5} style={{ margin: '0' }}>{TicketPurposeTitle}</Typography.Title>
                                                                    </Col>
                                                                    <Col span={11}>
                                                                        <Form.Item
                                                                            name={'executor'}
                                                                            rules={validations.executor}
                                                                            label={<LabelWithInfo title={ExecutorExtra} message={ExecutorLabel} />}
                                                                        >
                                                                            <GraphQlSearchInput
                                                                                formatLabel={formatUserFieldLabel}
                                                                                search={searchEmployee(get(organization, 'id'))}
                                                                                allowClear={false}
                                                                                showArrow={false}
                                                                                disabled={disableUserInteraction}
                                                                            />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={11}>
                                                                        <Form.Item
                                                                            name={'assignee'}
                                                                            rules={validations.assignee}
                                                                            label={<LabelWithInfo title={ResponsibleExtra} message={ResponsibleLabel} />}
                                                                        >
                                                                            <GraphQlSearchInput
                                                                                formatLabel={formatUserFieldLabel}
                                                                                search={searchEmployee(get(organization, 'id'))}
                                                                                allowClear={false}
                                                                                showArrow={false}
                                                                                disabled={disableUserInteraction}
                                                                            />
                                                                        </Form.Item>
                                                                    </Col>
                                                                </Row>
                                                            </Col>
                                                        </Row>
                                                    </FrontLayerContainer>
                                                </Col>
                                            )
                                        }
                                    }
                                </Form.Item>
                                <Form.Item name={'source'} hidden>
                                    <Input />
                                </Form.Item>
                            </Row>
                        </Col>
                        <Prompt
                            title={PromptTitle}
                            form={form}
                            handleSave={handleSave}
                        >
                            <Typography.Paragraph>
                                {PromptHelpMessage}
                            </Typography.Paragraph>
                        </Prompt>
                        {props.children({ handleSave, isLoading, form })}
                    </>
                )}
            </FormWithAction>
        </>
    )
}
