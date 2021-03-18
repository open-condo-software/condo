// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useIntl } from '@core/next/intl'
import { Checkbox, Col, Form, Input, Row, Typography } from 'antd'
import { useRouter } from 'next/router'
import { Rule } from 'rc-field-form/lib/interface'
import React from 'react'
import styled from '@emotion/styled'
import { useAuth } from '@core/next/auth'
import { FormWithAction } from '../containers/FormList'
import { searchEmployee, searchProperty, searchTicketClassifier } from '../utils/clientSchema/Ticket/search'
import { Button } from './Button'
import { FocusContainer } from './FocusContainer'
import { GraphQlSearchInput } from './GraphQlSearchInput'
import { LabelWithInfo } from './LabelWithInfo'
import { UnitNameInput } from './UnitNameInput'
import { colors } from '../constants/style'
import MaskedInput from 'antd-mask-input'
import { UserNameField } from './UserNameField'

const LAYOUT = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
}

type IFormFieldsRuleMap = {
    [key: string]: Rule[]
}

function useTicketValidations (): IFormFieldsRuleMap {
    const intl = useIntl()

    return {
        property: [
            {
                required: true,
                message: intl.formatMessage({ id: 'field.Property.requiredError' }),
            },
        ],
        unitName: [],
        source: [
            {
                required: true,
                message: intl.formatMessage({ id: 'SelectIsRequired' }),
            },
        ],
        clientName: [
            {
                required: true,
                min: 2,
                type: 'string',
                message: intl.formatMessage({ id: 'field.ClientName.minLengthError' }),
            },
        ],
        clientPhone: [
            {
                required: true,
                message: intl.formatMessage({ id: 'field.Phone.requiredError' }),
            },
            {
                validator: (_, value) => {
                    const phone = value.replace(/\D/g, '')

                    if (phone.length != 11) {
                        return Promise.reject(new Error(intl.formatMessage({ id: 'field.Phone.lengthError' })))
                    }

                    return Promise.resolve()
                },
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
                min: 20,
                message: intl.formatMessage({ id: 'field.Description.lengthError' }),
            },
        ],
        classifier: [
            {
                required: true,
                message: intl.formatMessage({ id: 'field.Classifier.requiredError' }),
            },
        ],
        executor: [],
        assignee: [
            {
                required: true,
                message: intl.formatMessage({ id: 'field.Assignee.requiredError' }),
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

const FrontLayerContainer = styled.div`
  margin: 0 -24px;
  padding: 0 24px 24px;
  position: relative;
  user-select: none;
  ${(props) => props.showLayer && `
    &:before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        background-color: ${colors.white};
        opacity: 0.5;
        z-index: 1;
    }
  `}
`

const DEFAULT_TICKET_SOURCE_CALL_ID = '779d7bb6-b194-4d2c-a967-1f7321b2787f'

const ErrorsContainer = styled.div`
  padding: 9px 16px;
  border-radius: 8px;
  background-color: ${colors.beautifulBlue[5]};
`

// TODO(Dimitreee): decompose this huge component to field groups
export const BaseTicketForm:React.FC<ITicketFormProps> = (props) => {
    const intl = useIntl()
    // TODO(Dimitreee):remove after typo inject
    const auth = useAuth() as { user: {id:string} }
    const router = useRouter()

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
    const ErrorsContainerTitle = intl.formatMessage({ id: 'errorsContainer.requiredErrors' })

    const CreateTicketMessage = intl.formatMessage({ id: 'CreateTicket' })
    const UpdateTicketMessage = intl.formatMessage({ id: 'UpdateTicket' })

    const ExecutorExtra = intl.formatMessage({ id: 'field.Executor.description' })
    const ResponsibleExtra = intl.formatMessage({ id: 'field.Responsible.description' })

    const { action, initialValues, organization } = props
    const validations = useTicketValidations()

    const formatUserFieldLabel = ({ text, value }) => (
        <UserNameField user={{ name: text, id: value }}>
            {({ name, postfix }) => <>{name} {postfix}</>}
        </UserNameField>
    )

    return (
        <>
            <FormWithAction action={action} initialValues={initialValues} {...LAYOUT} validateTrigger={['onBlur', 'onSubmit']}>
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
                                                                search={searchProperty}
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
                                                            <Input/>
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={11}>
                                                        <Form.Item name={'clientPhone'} rules={validations.clientPhone} label={PhoneLabel} validateFirst>
                                                            <MaskedInput mask={'+1 (111) 111-11-11'} placeholderChar={'0'}/>
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
                                    const { property, unitName } = getFieldsValue(['property', 'unitName'])
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
                                                                    <Input.TextArea rows={3} placeholder={DescriptionPlaceholder} disabled={disableUserInteraction}/>
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
                                                                    label={<LabelWithInfo title={ExecutorExtra} message={ExecutorLabel}/>}
                                                                    initialValue={auth.user.id}
                                                                >
                                                                    <GraphQlSearchInput
                                                                        formatLabel={formatUserFieldLabel}
                                                                        search={searchEmployee(organization.id)}
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
                                                                    label={<LabelWithInfo title={ResponsibleExtra} message={ResponsibleLabel}/>}
                                                                    initialValue={auth.user.id}
                                                                >
                                                                    <GraphQlSearchInput
                                                                        formatLabel={formatUserFieldLabel}
                                                                        search={searchEmployee(organization.id)}
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
                        <Col span={24}>
                            <Row style={{ paddingTop: '20px' }}>
                                <Form.Item noStyle dependencies={['property', 'unitName']}>
                                    {
                                        ({ getFieldsValue }) => {
                                            const { property, unitName } = getFieldsValue(['property', 'unitName'])
                                            const disableUserInteraction = !property || !unitName

                                            return (
                                                <>
                                                    <Col>
                                                        <Button
                                                            key='submit'
                                                            onClick={handleSave}
                                                            type='sberPrimary'
                                                            loading={isLoading} disabled={disableUserInteraction}
                                                        >
                                                            {router.query.id ? UpdateTicketMessage : CreateTicketMessage}
                                                        </Button>
                                                    </Col>
                                                    <Col span={11} push={1}>
                                                        {disableUserInteraction && (
                                                            <ErrorsContainer>
                                                                {ErrorsContainerTitle}&nbsp;
                                                                {
                                                                    [!property && AddressLabel, !unitName && FlatNumberLabel]
                                                                        .filter(Boolean)
                                                                        .join(', ')
                                                                        .toLowerCase()
                                                                }
                                                            </ErrorsContainer>
                                                        )}
                                                    </Col>
                                                </>
                                            )
                                        }
                                    }
                                </Form.Item>
                            </Row>
                        </Col>
                        <Form.Item name={'source'} hidden initialValue={DEFAULT_TICKET_SOURCE_CALL_ID}>
                            <Input/>
                        </Form.Item>
                    </Row>
                )}
            </FormWithAction>
        </>
    )
}
