import ActionBar from '@condo/domains/common/components/ActionBar'
import { Button } from '@condo/domains/common/components/Button'
import { BaseTicketForm } from '@condo/domains/ticket/components/BaseTicketForm'
import { ErrorsContainer } from '@condo/domains/ticket/components/BaseTicketForm/ErrorsContainer'
import { REQUIRED_TICKET_FIELDS } from '@condo/domains/ticket/constants/common'
import { useCacheUtils } from '@condo/domains/ticket/hooks/useCacheUtils'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { useOrganization } from '@core/next/organization'
import { Form, Space } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'
import { useApolloClient } from '@core/next/apollo'

const OPEN_STATUS = '6ef3abc4-022f-481b-90fb-8430345ebfc2'
const DEFAULT_TICKET_SOURCE_CALL_ID = '779d7bb6-b194-4d2c-a967-1f7321b2787f'

export const CreateTicketActionBar = ({ handleSave, isLoading }) => {
    const intl = useIntl()
    const CreateTicketMessage = intl.formatMessage({ id: 'CreateTicket' })

    return (
        <Form.Item noStyle shouldUpdate>
            {
                ({ getFieldsValue }) => {
                    const { property, details, placeClassifier, categoryClassifier } = getFieldsValue(REQUIRED_TICKET_FIELDS)
                    const disabledCondition = !property || !details || !placeClassifier || !categoryClassifier

                    return (
                        <ActionBar>
                            <Space size={12}>
                                <Button
                                    key='submit'
                                    onClick={handleSave}
                                    type='sberPrimary'
                                    loading={isLoading}
                                    disabled={disabledCondition}
                                >
                                    {CreateTicketMessage}
                                </Button>
                                <ErrorsContainer
                                    isVisible={disabledCondition}
                                    property={property}
                                    details={details}
                                    placeClassifier={placeClassifier}
                                    categoryClassifier={categoryClassifier}
                                />
                            </Space>
                        </ActionBar>
                    )
                }
            }
        </Form.Item>
    )
}

export const CreateTicketForm: React.FC = () => {
    const { organization, link } = useOrganization()
    const router = useRouter()
    const auth = useAuth() as { user: { id: string } }
    const client = useApolloClient()
    const { addTicketToQueryCacheForTicketCardList } = useCacheUtils(client.cache)

    const action = Ticket.useCreate(
        {
            status: OPEN_STATUS,
            source: DEFAULT_TICKET_SOURCE_CALL_ID,
        },
        (ticket) => {
            addTicketToQueryCacheForTicketCardList(ticket)
            router.push('/ticket')
        })

    const createAction = useCallback((attrs) => action({ ...attrs, organization }), [organization])

    const initialValues = {
        assignee: auth.user.id,
        executor: auth.user.id,
    }

    const MemoizedBaseTicketForm = useCallback(() => (
        <BaseTicketForm
            action={createAction}
            initialValues={initialValues}
            organization={organization}
            role={link.role}
            autoAssign
        >
            {({ handleSave, isLoading }) => <CreateTicketActionBar handleSave={handleSave} isLoading={isLoading}/>}
        </BaseTicketForm>
    ), [createAction, initialValues, link.role, organization])

    return <MemoizedBaseTicketForm />
}
