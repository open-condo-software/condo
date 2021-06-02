import { Space, Form } from 'antd'
import React from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useOrganization } from '@core/next/organization'
import { useRouter } from 'next/router'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { BaseTicketForm } from '../BaseTicketForm'
import { Button } from '@condo/domains/common/components/Button'
import { ErrorsContainer } from '../BaseTicketForm/ErrorsContainer'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import ActionBar from '@condo/domains/common/components/ActionBar'

const OPEN_STATUS = '6ef3abc4-022f-481b-90fb-8430345ebfc2'
const DEFAULT_TICKET_SOURCE_CALL_ID = '779d7bb6-b194-4d2c-a967-1f7321b2787f'

export const CreateTicketForm: React.FC = () => {
    const intl = useIntl()
    const CreateTicketMessage = intl.formatMessage({ id: 'CreateTicket' })

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { organization } = useOrganization()
    const router = useRouter()
    // TODO(Dimitreee):remove after typo inject
    const auth = useAuth() as { user: { id: string } }

    const action = Ticket.useCreate(
        {
            organization: organization.id,
            status: OPEN_STATUS,
            source: DEFAULT_TICKET_SOURCE_CALL_ID,
        },
        () => {
            router.push('/ticket/')
        })

    const initialValues = {
        assignee: auth.user.id,
        executor: auth.user.id,
    }

    return (
        <BaseTicketForm
            action={action}
            initialValues={initialValues}
            organization={organization}
        >
            {({ handleSave, isLoading }) => {
                return (
                    <Form.Item noStyle dependencies={['property']}>
                        {
                            ({ getFieldsValue }) => {
                                const { property } = getFieldsValue(['property'])

                                return (
                                    <ActionBar>
                                        <Space size={40}>
                                            <Button
                                                key='submit'
                                                onClick={handleSave}
                                                type='sberPrimary'
                                                loading={isLoading}
                                                disabled={!property}
                                            >
                                                {CreateTicketMessage}
                                            </Button>
                                            <ErrorsContainer property={property}/>
                                        </Space>
                                    </ActionBar>
                                )
                            }
                        }
                    </Form.Item>
                )
            }}
        </BaseTicketForm>
    )
}
