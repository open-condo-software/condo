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
import { Loader } from '@condo/domains/common/components/Loader'
import { REQUIRED_TICKET_FIELDS } from '@condo/domains/ticket/constants/common'

export const ApplyChangesActionBar = ({ handleSave, isLoading }) => {
    const intl = useIntl()
    const ApplyChangesMessage = intl.formatMessage({ id: 'ApplyChanges' })

    return (
        <Form.Item noStyle shouldUpdate>
            {
                ({ getFieldsValue }) => {
                    const { property, details, placeClassifier, categoryClassifier } = getFieldsValue(REQUIRED_TICKET_FIELDS)
                    const disabledCondition = !property || !details || !placeClassifier || !categoryClassifier

                    return (
                        <ActionBar>
                            <FormResetButton
                                type='sberPrimary'
                                secondary
                            />
                            <Space size={12}>
                                <Button
                                    key='submit'
                                    onClick={handleSave}
                                    type='sberPrimary'
                                    loading={isLoading}
                                    disabled={!property}
                                >
                                    {ApplyChangesMessage}
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

interface IUpdateTicketForm {
    id: string
}

export const UpdateTicketForm: React.FC<IUpdateTicketForm> = ({ id }) => {
    const { push } = useRouter()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { obj, loading, refetch, error } = Ticket.useObject({ where: { id } })
    const { objs: files, refetch: refetchFiles } = TicketFile.useObjects({ where: { ticket: { id } } })
    const { organization, link } = useOrganization()
    
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
                {(loading) ? <Loader fill size={'large'}/> : null}
                {(error) ? <Typography.Title>{error}</Typography.Title> : null}
            </>
        )
    }

    return (
        <BaseTicketForm
            action={updateAction}
            initialValues={Ticket.convertToUIFormState(obj)}
            organization={organization}
            role={link.role}
            files={files}
            afterActionCompleted={(ticket) => {
                push(`/ticket/${ticket.id}`)
            }}
        >
            {({ handleSave, isLoading }) => <ApplyChangesActionBar handleSave={handleSave} isLoading={isLoading}/>}
        </BaseTicketForm>
    )
}
