// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useIntl } from '@core/next/intl'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useOrganization } from '@core/next/organization'
import { Checkbox, Col, Form, Input, Row, Typography } from 'antd'
import { Rule } from 'rc-field-form/lib/interface'
import React from 'react'
import countries from '../constants/countries'
import { FormWithAction } from '../containers/FormList'
import { searchEmployee, searchProperty, searchTicketClassifier } from '../utils/clientSchema/Ticket/search'
import { Button } from './Button'
import { FocusContainer } from './FocusContainer'
import { GraphQlSearchInput } from './GraphQlSearchInput'
import { LabelWithInfo } from './LabelWithInfo'
import { UnitNameInput } from './UnitNameInput'

const LAYOUT = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
}

type IFormFieldsRuleMap = {
    [key: string]: Rule[]
}

function useTicketValidations (): IFormFieldsRuleMap {
    const intl = useIntl()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
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

    const CreateTicketMessage = intl.formatMessage({ id: 'CreateTicket' })

    const ExecutorExtra = intl.formatMessage({ id: 'field.Executor.description' })
    const ResponsibleExtra = intl.formatMessage({ id: 'field.Responsible.description' })

    const { action, initialValues, organization } = props
    const validations = useTicketValidations()

    return (
        <>
            <FormWithAction action={action} initialValues={initialValues} {...LAYOUT}>
                {({ handleSave, isLoading, form }) => (
                    <Row gutter={[0, 40]}>
                        <Col span={24}>
                            <FocusContainer>
                                <Row justify={'space-between'} gutter={[0, 24]}>
                                    <Col span={24}>
                                        <Typography.Title level={5} style={{ margin: '0' }}>{UserInfoTitle}</Typography.Title>
                                    </Col>
                                    <Col span={18}>
                                        <Form.Item name={'property'} label={AddressLabel} rules={validations.property} style={{ margin: 0 }}>
                                            <GraphQlSearchInput
                                                search={searchProperty}
                                                onSelect={() => form.setFieldsValue({ 'unitName': null })}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col span={4}>
                                        <Form.Item dependencies={['property']} noStyle>
                                            {({ getFieldValue }) => (
                                                <Form.Item name={'unitName'} label={FlatNumberLabel}>
                                                    <UnitNameInput propertyId={getFieldValue('property')}/>
                                                </Form.Item>
                                            )}
                                        </Form.Item>
                                    </Col>
                                    <Col span={11}>
                                        <Form.Item name={'clientName'} rules={validations.clientName} label={FullNameLabel}>
                                            <Input/>
                                        </Form.Item>
                                    </Col>
                                    <Col span={11}>
                                        <Form.Item name={'clientPhone'} rules={validations.clientPhone} label={PhoneLabel}>
                                            <Input/>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </FocusContainer>
                        </Col>
                        <Col span={24}>
                            <Row gutter={[0, 24]}>
                                <Col span={24}>
                                    <Typography.Title level={5} style={{ margin: '0' }}>{TicketInfoTitle}</Typography.Title>
                                </Col>
                                <Col span={24}>
                                    <Form.Item name={'details'} rules={validations.details} label={DescriptionLabel}>
                                        <Input.TextArea rows={3}/>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Row align={'top'} >
                                <Col span={11}>
                                    <Form.Item name={'classifier'} rules={validations.classifier} label={ClassifierLabel} >
                                        <GraphQlSearchInput search={searchTicketClassifier}/>
                                    </Form.Item>
                                </Col>
                                <Col push={2} span={11}>
                                    <Row>
                                        <Col span={12}>
                                            <Form.Item name={'emergency'} label={' '} valuePropName='checked'>
                                                <Checkbox>{EmergencyLabel}</Checkbox>
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name={'paid'} label={' '} valuePropName='checked'>
                                                <Checkbox>{PaidLabel}</Checkbox>
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
                                        label={<LabelWithInfo title={ExecutorExtra} message={ExecutorLabel}/>}
                                    >
                                        <GraphQlSearchInput search={searchEmployee(organization.id)}/>
                                    </Form.Item>
                                </Col>
                                <Col span={11}>
                                    <Form.Item
                                        name={'assignee'}
                                        rules={validations.assignee}
                                        label={<LabelWithInfo title={ResponsibleExtra} message={ResponsibleLabel}/>}
                                    >
                                        <GraphQlSearchInput search={searchEmployee(organization.id)}/>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                        <Col span={24}>
                            <Row style={{ paddingTop: '20px' }}>
                                <Form.Item>
                                    <Button key='submit' onClick={handleSave} type='sberPrimary' loading={isLoading}>
                                        {CreateTicketMessage}
                                    </Button>
                                </Form.Item>
                            </Row>
                        </Col>
                    </Row>
                )}
            </FormWithAction>
        </>
    )
}
