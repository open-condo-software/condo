import { Form, Space } from 'antd'
import React from 'react'
import { useOrganization } from '@core/next/organization'
import { useRouter } from 'next/router'
import { useAuth } from '@core/next/auth'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import ActionBar from '@condo/domains/common/components/ActionBar'


import { BaseMeterForm } from './BaseMeterForm'
import { ErrorsContainer } from './BaseMeterForm/ErrorsContainer'

const DEFAULT_TICKET_SOURCE_CALL_ID = '779d7bb6-b194-4d2c-a967-1f7321b2787f'

export const CreateTicketActionBar = ({ handleSave, isLoading }) => {
    const intl = useIntl()
    const SendMetersReadingMessage = intl.formatMessage({ id: 'SendMetersReading' })

    return (
        <Form.Item noStyle dependencies={['property']}>
            {
                ({ getFieldsValue }) => {
                    const { property } = getFieldsValue(['property'])

                    return (
                        <ActionBar>
                            <Space size={12}>
                                <Button
                                    key='submit'
                                    onClick={handleSave}
                                    type='sberPrimary'
                                    loading={isLoading}
                                    disabled={!property}
                                >
                                    {SendMetersReadingMessage}
                                </Button>
                                <ErrorsContainer property={property}/>
                            </Space>
                        </ActionBar>
                    )
                }
            }
        </Form.Item>
    )
}

export const CreateMeterForm: React.FC = () => {
    const { organization, link } = useOrganization()
    const router = useRouter()
    const auth = useAuth() as { user: { id: string } }

    const action = Ticket.useCreate(
        {
            organization: organization.id,
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
        <BaseMeterForm
            action={action}
            initialValues={initialValues}
            organization={organization}
            role={link.role}
        >
            {({ handleSave, isLoading }) => <CreateTicketActionBar handleSave={handleSave} isLoading={isLoading}/>}
        </BaseMeterForm>
    )
}
