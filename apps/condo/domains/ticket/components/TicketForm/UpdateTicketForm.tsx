import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { useOrganization } from '@core/next/organization'
import { Form, Typography, Space } from 'antd'
import { useIntl } from '@core/next/intl'
import { BaseTicketForm } from '../BaseTicketForm'
import { Button } from '@condo/domains/common/components/Button'
import { ErrorsContainer } from '../BaseTicketForm/ErrorsContainer'
import { FormResetButton } from '@condo/domains/common/components/FormResetButton'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Ticket, TicketFile } from '@condo/domains/ticket/utils/clientSchema'
import ActionBar from '@condo/domains/common/components/ActionBar'
interface IUpdateTicketForm {
    id: string
}

export const UpdateTicketForm: React.FC<IUpdateTicketForm> = ({ id }) => {
    const intl = useIntl()
    const ApplyChangesMessage = intl.formatMessage({ id: 'ApplyChanges' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })

    const { push } = useRouter()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { organization } = useOrganization()
    const { obj, loading, refetch, error } = Ticket.useObject({ where: { id } })
    const { objs: files, refetch: refetchFiles } = TicketFile.useObjects({ where: { ticket: { id } } })
    
    // no redirect after mutation as we need to wait for ticket files to save
    const action = Ticket.useUpdate({}, () => null)
    const updateAction = (value) => action(value, obj)

    useEffect(() => {
        refetch()
        refetchFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
        
    if (error || loading) {
        return (
            <>
                {(loading) ? <Typography.Title>{LoadingMessage}</Typography.Title> : null}
                {(error) ? <Typography.Title>{error}</Typography.Title> : null}
            </>
        )
    }

    return (
        <BaseTicketForm
            action={updateAction}
            initialValues={Ticket.convertToUIFormState(obj)}
            organization={organization}
            files={files}
            afterActionCompleted={(ticket) => {
                push(`/ticket/${ticket.id}`)
            }}
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
                                            <FormResetButton
                                                type='sberPrimary'
                                                secondary
                                            />
                                            <Button
                                                key='submit'
                                                onClick={handleSave}
                                                type='sberPrimary'
                                                loading={isLoading}
                                                disabled={!property}
                                            >
                                                {ApplyChangesMessage}
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
