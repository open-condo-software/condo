import React from 'react'
import { Button, Form, Typography, Input, Row, Col } from 'antd'
import { Rule } from 'rc-field-form/lib/interface'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { FormWithAction } from '../containers/FormList'
import { SearchInput } from '../containers/FormBlocks'
import countries from '../constants/countries'
import {
    searchEmployee,
    searchProperty,
    searchTicketClassifier,
    searchTicketSources
} from '../utils/clientSchema/search'

const LAYOUT = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
}

type IFormFieldsRuleMap = {
    [key: string]: Rule[]
}

function useTicketValidations (): IFormFieldsRuleMap {
    const intl = useIntl()
    const { organization } = useOrganization()

    return {
        property: [
            {
                required: true,
                message: intl.formatMessage({ id: 'SelectIsRequired' }),
            },
        ],
        unitName: [],
        source: [
            {
                required: true,
                message: intl.formatMessage({ id: 'SelectIsRequired' }),
            },
        ],
        clientName: [],
        clientPhone: [
            {
                pattern: countries[organization.country].phonePattern,
                message: intl.formatMessage({ id: 'pages.auth.PhoneIsNotValid' }),
            },
        ],
        clientEmail: [
            {
                type: 'email',
                message: intl.formatMessage({ id: 'pages.auth.EmailIsNotValid' }),
            },
        ],
        details: [
            {
                required: true,
                message: intl.formatMessage({ id: 'SelectIsRequired' }),
            },
        ],
        classifier: [
            {
                required: true,
                message: intl.formatMessage({ id: 'SelectIsRequired' }),
            },
        ],
        executor: [],
        assignee: [
            {
                required: true,
                message: intl.formatMessage({ id: 'SelectIsRequired' }),
            },
        ],
    }
}

interface IOrganization {
    id: string
}

interface ITicketFormProps {
    initialValues: Record<string, string|number|null|undefined>
    action?: (...args) => void,
    organization: IOrganization
}

export const BaseTicketForm:React.FunctionComponent<ITicketFormProps> = (props) => {
    const intl = useIntl()
    const UserInfoMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.UserInfo' })
    const AddressMessage = intl.formatMessage({ id: 'field.Address' })
    const FlatNumberMessage = intl.formatMessage({ id: 'field.FlatNumber' })
    const FullNameMessage = intl.formatMessage({ id: 'field.FullName' })
    const PhoneMessage = intl.formatMessage({ id: 'Phone' })
    const EmailMessage = intl.formatMessage({ id: 'field.EMail' })
    const TicketInfoMessage = intl.formatMessage({ id: 'pages.condo.ticket.title.TicketInfo' })
    const DescriptionMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Description' })
    const TypeMessage = intl.formatMessage({ id: 'pages.condo.ticket.field.Type' })
    const ExecutorMessage = intl.formatMessage({ id: 'field.Executor' })
    const ExecutorExtraMessage = intl.formatMessage({ id: 'field.Executor.description' })
    const ResponsibleMessage = intl.formatMessage({ id: 'field.Responsible' })
    const ResponsibleExtraMessage = intl.formatMessage({ id: 'field.Responsible.description' })
    const SaveMessage = intl.formatMessage({ id: 'Save' })
    const SourceMessage = intl.formatMessage({ id: 'field.Source' })

    const { action, initialValues, organization } = props
    const validations = useTicketValidations()

    return (
        <>
            <FormWithAction action={action} initialValues={initialValues} {...LAYOUT}>
                {({ handleSave, isLoading }) => (
                    <>
                        <Typography.Title level={4}>{UserInfoMessage}</Typography.Title>
                        <Row gutter={[12, 12]}>
                            <Col span={12}>
                                <Form.Item name={'property'} rules={validations.property}>
                                    <SearchInput placeholder={AddressMessage} search={searchProperty}/>
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item name={'unitName'}>
                                    <Input type={'number'} min={0} placeholder={FlatNumberMessage}/>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name={'source'} rules={validations.source}>
                                    <SearchInput placeholder={SourceMessage} search={searchTicketSources}/>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={[12, 12]}>
                            <Col span={12}>
                                <Form.Item name={'clientName'} rules={validations.clientName}>
                                    <Input placeholder={FullNameMessage}/>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name={'clientPhone'} rules={validations.clientPhone}>
                                    <Input placeholder={PhoneMessage}/>
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item name={'clientEmail'} rules={validations.clientEmail}>
                                    <Input type={'email'} placeholder={EmailMessage}/>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Typography.Title level={4}>{TicketInfoMessage}</Typography.Title>

                        <Row gutter={[12, 12]}>
                            <Col span={24}>
                                <Form.Item name={'details'} rules={validations.details}>
                                    <Input.TextArea rows={4} placeholder={DescriptionMessage}/>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={[12, 12]}>
                            <Col span={8}>
                                <Form.Item name={'classifier'} rules={validations.classifier}>
                                    <SearchInput placeholder={TypeMessage} search={searchTicketClassifier}/>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name={'executor'} rules={validations.executor} extra={ExecutorExtraMessage}>
                                    <SearchInput placeholder={ExecutorMessage} search={searchEmployee(organization.id)}/>
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item name={'assignee'} rules={validations.assignee} extra={ResponsibleExtraMessage}>
                                    <SearchInput placeholder={ResponsibleMessage} search={searchEmployee(organization.id)}/>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Row gutter={[12, 12]}>
                            <Form.Item>
                                <Button key="submit" onClick={handleSave} type="primary" loading={isLoading}>
                                    {SaveMessage}
                                </Button>
                            </Form.Item>
                        </Row>
                    </>
                )}
            </FormWithAction>
        </>
    )
}
