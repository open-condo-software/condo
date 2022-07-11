import { Col, Form, Row, Typography } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'
import { get } from 'lodash'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'

import { useApolloClient } from '@core/next/apollo'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'

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
const DEFAULT_TICKET_SOURCE_CALL_ID = '779d7bb6-b194-4d2c-a967-1f7321b2787f'

export const CreateTicketActionBar = ({ handleSave, isLoading }) => {
    const intl = useIntl()
    const CreateTicketMessage = intl.formatMessage({ id: 'CreateTicket' })

    return (
        <Form.Item noStyle shouldUpdate>
            {
                ({ getFieldsValue }) => {
                    const { property, details, placeClassifier, categoryClassifier, deadline } = getFieldsValue(REQUIRED_TICKET_FIELDS)
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
                                        data-cy={'ticket__submit-button'}
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

    const action = Ticket.useNewCreate(
        {
            status: { connect: { id: OPEN_STATUS } },
            source: { connect: { id: DEFAULT_TICKET_SOURCE_CALL_ID } },
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
            <Typography.Link style={LINK_STYLES} href={`/ticket/${data.id}`} target={'_blank'} rel="noreferrer">
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
    ), [createAction, initialValues, link.role, organization])

    return <MemoizedBaseTicketForm />
}
