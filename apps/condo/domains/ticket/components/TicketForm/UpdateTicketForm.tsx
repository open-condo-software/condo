import { Form, Typography } from 'antd'
import { get, isEmpty } from 'lodash'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'

import { Loader } from '@condo/domains/common/components/Loader'
import { BaseTicketForm } from '@condo/domains/ticket/components/BaseTicketForm'
import { TicketSubmitButton } from '@condo/domains/ticket/components/BaseTicketForm/TicketSubmitButton'
import { useTicketFormContext } from '@condo/domains/ticket/components/TicketForm/TicketFormContext'
import { REQUIRED_TICKET_FIELDS, TICKET_SOURCE_TYPES } from '@condo/domains/ticket/constants/common'
import { Ticket, TicketFile } from '@condo/domains/ticket/utils/clientSchema'
import { getTicketDefaultDeadline } from '@condo/domains/ticket/utils/helpers'


export const ApplyChangesActionBar = ({ handleSave, isLoading, form }) => {
    const intl = useIntl()
    const ApplyChangesMessage = intl.formatMessage({ id: 'applyChanges' })
    const CancelLabel = intl.formatMessage({ id: 'cancel' })
    const AddressNotSelected = intl.formatMessage({ id: 'field.property.nonSelectedError' })

    const { push, query: { id } } = useRouter()
    const onCancel = useCallback(() => {
        push(`/ticket/${id}`)
    }, [id, push])

    const { ticketSetting, ticketSettingLoading } = useTicketFormContext()

    return (
        <Form.Item noStyle shouldUpdate>
            {
                ({ getFieldsValue, resetFields, getFieldError }) => {
                    const isPaid = form.getFieldValue('isPaid')
                    const isEmergency = form.getFieldValue('isEmergency')
                    const isWarranty = form.getFieldValue('isWarranty')

                    const isRequiredDeadline = getTicketDefaultDeadline(ticketSetting, isPaid, isEmergency, isWarranty) !== null
                    const { property, details, placeClassifier, categoryClassifier, deadline } = getFieldsValue(REQUIRED_TICKET_FIELDS)
                    const propertyMismatchError = getFieldError('property').find((error)=>error.includes(AddressNotSelected))

                    const disabledCondition = !property
                        || !details
                        || !placeClassifier
                        || !categoryClassifier
                        || !!propertyMismatchError
                        || (isRequiredDeadline && !deadline)
                        || ticketSettingLoading

                    return (
                        <ActionBar
                            actions={[
                                <TicketSubmitButton
                                    key='submit'
                                    ApplyChangesMessage={ApplyChangesMessage}
                                    handleSave={handleSave}
                                    isLoading={isLoading}
                                    data-cy='ticket__apply-changes-button'
                                    disabledCondition={disabledCondition}
                                    property={property}
                                    details={details}
                                    placeClassifier={placeClassifier}
                                    categoryClassifier={categoryClassifier}
                                    deadline={deadline}
                                    propertyMismatchError={propertyMismatchError}
                                    isRequiredDeadline={isRequiredDeadline}
                                />,
                                <Button
                                    key='cancel'
                                    onClick={onCancel}
                                    type='secondary'
                                >
                                    {CancelLabel}
                                </Button>,
                            ]}
                        >
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
    const { replace } = useRouter()
    const { obj, loading, refetch, error } = Ticket.useObject({ where: { id } })
    const { objs: files, refetch: refetchFiles } = TicketFile.useObjects({ where: { ticket: { id } } })
    const { organization, link } = useOrganization()

    // no redirect after mutation as we need to wait for ticket files to save
    const action = Ticket.useUpdate({})
    const updateAction = async (value) => action({
        ...Ticket.formValuesProcessor(value),
    }, obj)

    useEffect(() => {
        refetch()
        refetchFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const ticketSourceType = useMemo(() => get(obj, ['source', 'type']), [obj])
    const ticketAssignee = useMemo(() => get(obj, 'assignee'), [obj])

    const autoAssign = isEmpty(ticketAssignee) && ticketSourceType === TICKET_SOURCE_TYPES.MOBILE_APP

    if (error || loading) {
        return (
            <>
                {(loading) ? <Loader fill size='large'/> : null}
                {(error) ? <Typography.Title>{error}</Typography.Title> : null}
            </>
        )
    }

    return (
        <BaseTicketForm
            autoAssign={autoAssign}
            action={updateAction}
            initialValues={Ticket.convertToFormState(obj)}
            organization={organization}
            role={link.role}
            files={files}
            afterActionCompleted={(ticket) => {
                replace(`/ticket/${ticket.id}`)
            }}
            isExisted={Boolean(obj)}
        >
            {({ handleSave, isLoading, form }) => <ApplyChangesActionBar handleSave={handleSave} isLoading={isLoading} form={form} />}
        </BaseTicketForm>
    )
}
