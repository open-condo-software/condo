import { Col, Form, Row, Typography } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'
import { get } from 'lodash'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'

import { useApolloClient } from '@condo/next/apollo'
import { useAuth } from '@condo/next/auth'
import { useIntl } from '@condo/next/intl'
import { useOrganization } from '@condo/next/organization'

import { colors } from '@condo/domains/common/constants/style'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { BaseTicketForm } from '@condo/domains/ticket/components/BaseTicketForm'
import { ErrorsContainer } from '@condo/domains/ticket/components/BaseTicketForm/ErrorsContainer'
import { REQUIRED_TICKET_FIELDS } from '@condo/domains/ticket/constants/common'
import { useCacheUtils } from '@condo/domains/ticket/hooks/useCacheUtils'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'

dayjs.extend(isToday)

const OPEN_STATUS = '6ef3abc4-022f-481b-90fb-8430345ebfc2'

export const CreateTicketActionBar = ({ handleSave, isLoading }) => {
    const intl = useIntl()
    const CreateTicketMessage = intl.formatMessage({ id: 'CreateTicket' })
    const AddressNotSelected = intl.formatMessage({ id: 'field.Property.nonSelectedError' })

    return (
        <Form.Item noStyle shouldUpdate>
            {
                ({ getFieldsValue, getFieldError }) => {
                    const { property, details, placeClassifier, categoryClassifier, deadline } = getFieldsValue(REQUIRED_TICKET_FIELDS)
                    const propertyMismatchError = getFieldError('property').find((error)=>error.includes(AddressNotSelected))
                    const disabledCondition = !property || !details || !placeClassifier || !categoryClassifier || !deadline

                    return (
                        <ActionBar isFormActionBar>
                            <Col>
                                <Row gutter={[0, 24]}>
                                    <Button
                                        key='submit'
                                        onClick={handleSave}
                                        type='sberDefaultGradient'
                                        loading={isLoading}
                                        disabled={disabledCondition}
                                        data-cy='ticket__submit-button'
                                        style={{ marginRight: '12px' }}
                                    >
                                        {CreateTicketMessage}
                                    </Button>
                                    <ErrorsContainer
                                        isVisible={disabledCondition}
                                        property={property}
                                        details={details}
                                        placeClassifier={placeClassifier}
                                        categoryClassifier={categoryClassifier}
                                        deadline={deadline}
                                        propertyMismatchError={propertyMismatchError}
                                    />
                                </Row>
                            </Col>
                        </ActionBar>
                    )
                }
            }
        </Form.Item>
    )
}

const LINK_STYLES = { color: colors.black, textDecoration: 'underline', textDecorationColor: colors.lightGrey[8] }

export const CreateTicketForm: React.FC = () => {
    const intl = useIntl()
    const SuccessNotificationDescription = intl.formatMessage({ id: 'pages.condo.ticket.notification.success.description' })

    const { organization, link } = useOrganization()
    const router = useRouter()
    const auth = useAuth() as { user: { id: string } }
    const client = useApolloClient()
    const { addTicketToQueryCacheForTicketCardList } = useCacheUtils(client.cache)

    const action = Ticket.useCreate(
        {
            status: { connect: { id: OPEN_STATUS } },
        },
        (ticket) => {
            addTicketToQueryCacheForTicketCardList(ticket)
            router.push('/ticket')
        })

    const createAction = useCallback((variables) => {
        let deadline = get(variables, 'deadline')
        if (deadline.isToday()) {
            deadline = deadline.endOf('day')
        }
        return action({
            ...Ticket.formValuesProcessor({ ...variables, deadline }),
            organization: { connect: { id: organization.id } },
        })
    }, [organization, action])

    const initialValues = useMemo(() => ({
        assignee: auth.user.id,
        executor: auth.user.id,
    }), [auth.user.id])

    const getCompletedNotification = useCallback((data) => ({
        message: (
            <Typography.Text strong>
                {intl.formatMessage({ id: 'pages.condo.ticket.notification.success.message' }, { number: data.number })}
            </Typography.Text>
        ),
        description: (
            <Typography.Link style={LINK_STYLES} href={`/ticket/${data.id}`} target='_blank' rel='noreferrer'>
                {SuccessNotificationDescription}
            </Typography.Link>
        ),
    }), [SuccessNotificationDescription, intl])

    const MemoizedBaseTicketForm = useCallback(() => (
        <BaseTicketForm
            action={createAction}
            initialValues={initialValues}
            organization={organization}
            role={link.role}
            autoAssign
            OnCompletedMsg={getCompletedNotification}
        >
            {({ handleSave, isLoading }) => <CreateTicketActionBar handleSave={handleSave} isLoading={isLoading}/>}
        </BaseTicketForm>
    ), [createAction, getCompletedNotification, initialValues, link.role, organization])

    return <MemoizedBaseTicketForm />
}
