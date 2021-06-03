// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useIntl } from '@core/next/intl'
import { Checkbox, Col, Form, Input, Row, Typography } from 'antd'
import get from 'lodash/get'
import React, { useEffect, useRef, useState } from 'react'
import { ITicketFormState } from '@condo/domains/ticket/utils/clientSchema/Ticket'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { PropertyAddressSearchInput } from '@condo/domains/property/components/PropertyAddressSearchInput'
import { searchEmployee, searchTicketClassifier } from '../../utils/clientSchema/search'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { LabelWithInfo } from '@condo/domains/common/components/LabelWithInfo'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { UnitNameInput } from '@condo/domains/user/components/UnitNameInput'
import { UserNameField } from '@condo/domains/user/components/UserNameField'
import { useTicketValidations } from './useTicketValidations'
import { FrontLayerContainer } from '@condo/domains/common/components/FrontLayerContainer'

import { useMultipleFileUploadHook } from '@condo/domains/common/components/MultipleFileUpload'
import { TicketFile, ITicketFileUIState } from '@condo/domains/ticket/utils/clientSchema'

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
    const AddressLabel = intl.formatMessage({ id: 'field.Address' })
    const FlatNumberLabel = intl.formatMessage({ id: 'field.FlatNumber' })
    const FullNameLabel = intl.formatMessage({ id: 'field.FullName' })
    const PhoneLabel = intl.formatMessage({ id: 'Phone' })
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
    const { action: _action, initialValues, organization, afterActionCompleted, files } = props
    const validations = useTicketValidations()
    const [selectedPropertyId, setSelectedPropertyId] = useState(get(initialValues, 'property'))
    const selectPropertyIdRef = useRef(selectedPropertyId)

    useEffect(() => {
        selectPropertyIdRef.current = selectedPropertyId
    }, [selectedPropertyId])

    const { UploadComponent, syncModifiedFiles } = useMultipleFileUploadHook({
        Model: TicketFile,
        relationField: 'ticket',
        initialFileList: files,
        initialCreateValues: { organization: organization.id },
    })

    const action = async (...args) => {
        const result = await _action(...args)
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

    return (
        <>
            <FormWithAction
                {...LAYOUT}
                action={action}
                initialValues={initialValues}
                validateTrigger={['onBlur', 'onSubmit']}
                formValuesToMutationDataPreprocessor={(values) => {
                    values.property = selectPropertyIdRef.current
                    return values
                }}
            >

                {({ handleSave, isLoading, form }) => (
                    <>
                        <Col span={13}>
                            <Row gutter={[0, 40]}>
                                <Col span={24}>
                                    <FocusContainer>
                                        <Row justify={'space-between'} gutter={[0, 24]}>
                                            <Col span={24}>
                                                <Typography.Title level={5} style={{ margin: '0' }}>{UserInfoTitle}</Typography.Title>
                                            </Col>
                                            <Col span={selectedPropertyId ? 18 : 24}>
                                        <Form.Item name={'property'} label={AddressLabel} rules={validations.property}>
                                            <PropertyAddressSearchInput
                                                onSelect={(_, option) => {
                                                    form.setFieldsValue({ 'unitName': null })
                                                            setSelectedPropertyId(option.key)
                                                }}
                                                placeholder={AddressPlaceholder}
                                            />
                                        </Form.Item>
                                    </Col>
                                    {selectedPropertyId && (
                                        <Col span={4}>
                                            <Form.Item name={'unitName'} label={FlatNumberLabel}>
                                                <UnitNameInput
                                                    propertyId={selectedPropertyId}
                                                    allowClear={false}
                                                />
                                            </Form.Item>
                                        </Col>
                                    )}
                                            <Form.Item shouldUpdate noStyle>
                                                {({ getFieldValue }) => {
                                                    const propertyFieldValue = getFieldValue('property')

                                                    return propertyFieldValue && (
                                                        <>
                                                            <Col span={11}>
                                                                <Form.Item name={'clientName'} rules={validations.clientName} label={FullNameLabel}>
                                                                    <Input />
                                                                </Form.Item>
                                                            </Col>
                                                            <Col span={11}>
                                                                <Form.Item
                                                                    name={'clientPhone'}
                                                                    rules={validations.clientPhone}
                                                                    label={PhoneLabel}
                                                                    validateFirst
                                                                >
                                                                    <PhoneInput />
                                                                </Form.Item>
                                                            </Col>
                                                        </>
                                                    )
                                                }}
                                            </Form.Item>
                                        </Row>
                                    </FocusContainer>
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
                                                                            <Input.TextArea rows={3} placeholder={DescriptionPlaceholder} disabled={disableUserInteraction} />
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

                        {props.children({ handleSave, isLoading, form })}
                    </>
                )}
            </FormWithAction>
        </>
    )
}
