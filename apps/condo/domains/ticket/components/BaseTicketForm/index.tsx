// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useIntl } from '@core/next/intl'
import { Checkbox, Col, Form, Input, Row, Typography } from 'antd'
import get from 'lodash/get'
import React, { useCallback, useState, useReducer, useEffect } from 'react'
import { ITicketFormState } from '@condo/domains/ticket/utils/clientSchema/Ticket'
import { FormWithAction } from '@condo/domains/common/components/containers/FormList'
import { searchEmployee, searchProperty, searchTicketClassifier } from '../../utils/clientSchema/search'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { GraphQlSearchInput } from '@condo/domains/common/components/GraphQlSearchInput'
import { LabelWithInfo } from '@condo/domains/common/components/LabelWithInfo'
import { PhoneInput } from '@condo/domains/common/components/PhoneInput'
import { UnitNameInput } from '@condo/domains/user/components/UnitNameInput'
import { UserNameField } from '@condo/domains/user/components/UserNameField'
import { useTicketValidations } from './useTicketValidations'
import { FrontLayerContainer } from '@condo/domains/common/components/FrontLayerContainer'

import MultipleFileUpload from '@condo/domains/common/components/MultipleFileUpload'
import { TicketFile } from '@condo/domains/ticket/utils/clientSchema'

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
}


// TODO(Dimitreee): decompose this huge component to field groups
export const BaseTicketForm: React.FC<ITicketFormProps> = (props) => {
    const intl = useIntl()

    const UserInfoTitle = intl.formatMessage({ id: 'pages.condo.ticket.title.ClientInfo' })
    const TicketInfoTitle = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketInfo' })
    const TicketPurposeTitle = intl.formatMessage({ id: 'TicketPurpose' })
    const UploadedFilesLabel = intl.formatMessage({ id: 'component.uploadlist.AttachedFilesLabel' })

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

    const { action: saveAction, initialValues, organization } = props
    const validations = useTicketValidations()

    const formatUserFieldLabel = ({ text, value }) => (
        <UserNameField user={{ name: text, id: value }}>
            {({ name, postfix }) => <>{name} {postfix}</>}
        </UserNameField>
    )

    const reducer = (state, action) => {
        const { type, payload: file } = action
        let newState
        switch (type) {
            case 'delete':
                newState = {
                    ...state,                    
                    added: [...state.added].filter(addFile => addFile.id !== file.id),
                    deleted: [...state.deleted, file],
                }
                break
            case 'add':
                newState = {
                    ...state,
                    added: [...state.added, file],
                }
                break
            default:
                throw new Error(`unknown action ${type}`)
        }
        return newState
    }

    const [ticketFiles, dispatch] = useReducer(reducer, { added: [], deleted: [] })

    const deleteAction = TicketFile.useSoftDelete({}, () => Promise.resolve())
    const updateAction = TicketFile.useUpdate({}, () => Promise.resolve())

    const syncFiles = async (ticketId, ticketFiles) => {
        const { added, deleted } = ticketFiles
        for (const file of added) {
            await updateAction(file, { ticket: { connect: ticketId } })
        }
        for (const file of deleted) {
            await deleteAction({ id: file.id })
        }
    }

    const action = async (...args) => {
        const result = await saveAction(...args)
        await syncFiles(result.id, ticketFiles)
        return result
    }
    

    return (
        <>
            <FormWithAction
                action={action}
                initialValues={initialValues}
                {...LAYOUT}
                validateTrigger={['onBlur', 'onSubmit']}
                onMutationCompleted={(...args) => {
                    console.log(ticketFiles)
                    console.log('AAAAAAAAAAAA', ...args)
                    alert()
                    console.log(...args)
                }}
            >
                {({ handleSave, isLoading, form }) => (
                    <Row gutter={[0, 40]}>
                        <Col span={24}>
                            <FocusContainer>
                                <Row justify={'space-between'} gutter={[0, 24]}>
                                    <Col span={24}>
                                        <Typography.Title level={5} style={{ margin: '0' }}>{UserInfoTitle}</Typography.Title>
                                    </Col>
                                    <Form.Item dependencies={['property']} noStyle>
                                        {({ getFieldValue }) => {
                                            const propertyFieldValue = getFieldValue('property')

                                            return (
                                                <>
                                                    <Col span={propertyFieldValue ? 18 : 24}>
                                                        <Form.Item name={'property'} label={AddressLabel} rules={validations.property}>
                                                            <GraphQlSearchInput
                                                                search={searchProperty(get(organization, 'id'))}
                                                                onSelect={() => form.setFieldsValue({ 'unitName': null })}
                                                                placeholder={AddressPlaceholder}
                                                                showArrow={false}
                                                                allowClear={false}
                                                                autoFocus
                                                            />
                                                        </Form.Item>
                                                    </Col>
                                                    {propertyFieldValue && (
                                                        <Col span={4}>
                                                            <Form.Item name={'unitName'} label={FlatNumberLabel}>
                                                                <UnitNameInput
                                                                    propertyId={propertyFieldValue}
                                                                    allowClear={false}
                                                                />
                                                            </Form.Item>
                                                        </Col>
                                                    )}
                                                </>
                                            )
                                        }}
                                    </Form.Item>
                                    <Form.Item shouldUpdate noStyle>
                                        {({ getFieldsValue }) => {
                                            const { unitName } = getFieldsValue(['unitName'])

                                            return unitName && (
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
                        <Form.Item noStyle dependencies={['property', 'unitName']}>
                            {
                                ({ getFieldsValue }) => {
                                    const { property, unitName, files } = getFieldsValue(['property', 'unitName', 'files'])
                                    const disableUserInteraction = !property || !unitName
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
                                                                    label={UploadedFilesLabel}
                                                                    shouldUpdate
                                                                >
                                                                    <MultipleFileUpload
                                                                        fileList={files}
                                                                        initialCreateValues={{ ticket: null }}
                                                                        Model={TicketFile}
                                                                        dispatch={dispatch}
                                                                    />
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
                        <Col span={24}>
                            {props.children({ handleSave, isLoading, form })}
                        </Col>
                    </Row>
                )}
            </FormWithAction>
        </>
    )
}
