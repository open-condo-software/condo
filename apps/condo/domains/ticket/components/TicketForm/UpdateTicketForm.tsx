import {
    useUpdateTicketMutation,
} from '@app/condo/gql'
import { Form, Typography } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import pick from 'lodash/pick'
import reduce from 'lodash/reduce'
import { useRouter } from 'next/router'
import React, { useCallback, useEffect, useMemo } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useIntl } from '@open-condo/next/intl'
import { ActionBar, Button } from '@open-condo/ui'

import { Loader } from '@condo/domains/common/components/Loader'
import { Invoice } from '@condo/domains/marketplace/utils/clientSchema'
import { BaseTicketForm } from '@condo/domains/ticket/components/BaseTicketForm'
import { TicketSubmitButton } from '@condo/domains/ticket/components/BaseTicketForm/TicketSubmitButton'
import { useTicketFormContext } from '@condo/domains/ticket/components/TicketForm/TicketFormContext'
import { REQUIRED_TICKET_FIELDS, TICKET_SOURCE_TYPES } from '@condo/domains/ticket/constants/common'
import { Ticket, TicketFile } from '@condo/domains/ticket/utils/clientSchema'
import { getTicketDefaultDeadline } from '@condo/domains/ticket/utils/helpers'


export const ApplyChangesActionBar = ({ handleSave, isLoading, form }) => {
    const intl = useIntl()
    const ApplyChangesMessage = intl.formatMessage({ id: 'ApplyChanges' })
    const CancelLabel = intl.formatMessage({ id: 'Cancel' })
    const AddressNotSelected = intl.formatMessage({ id: 'field.Property.nonSelectedError' })

    const { push, query: { id } } = useRouter()
    const onCancel = useCallback(() => {
        push(`/ticket/${id}`)
    }, [id, push])

    const { ticketSetting, ticketSettingLoading } = useTicketFormContext()

    return (
        <Form.Item noStyle shouldUpdate>
            {
                ({ getFieldsValue, getFieldError }) => {
                    const isPayable = form.getFieldValue('isPayable')
                    const isEmergency = form.getFieldValue('isEmergency')
                    const isWarranty = form.getFieldValue('isWarranty')

                    const isRequiredDeadline = getTicketDefaultDeadline(ticketSetting, isPayable, isEmergency, isWarranty) !== null
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
    const intl = useIntl()

    const { replace } = useRouter()
    const { obj, loading: ticketLoading, refetch, error } = Ticket.useObject({ where: { id } })
    const { objs: files, refetch: refetchFiles } = TicketFile.useObjects({ where: { ticket: { id } } })
    const { objs: invoices, loading: invoicesLoading } = Invoice.useObjects({ where: { ticket: { id } } })

    // no redirect after mutation as we need to wait for ticket files to save
    const [action] = useUpdateTicketMutation({})
    const createInvoiceAction = Invoice.useCreate({})
    const updateInvoiceAction = Invoice.useUpdate({})
    const updateAction = async (values) => {
        const { existedInvoices, newInvoices, ...ticketValues } = values

        const ticketData = await action({
            variables: {
                id: obj.id,
                data: {
                    ...Ticket.formValuesProcessor(ticketValues),
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                },
            },
        })
        const ticket = ticketData?.data?.ticket

        if (!isEmpty(newInvoices)) {
            for (const invoiceFromForm of newInvoices) {
                const payload = Invoice.formValuesProcessor({
                    ...invoiceFromForm,
                    ticket: ticket.id,
                }, intl, true)

                await createInvoiceAction(payload)
            }
        }

        if (!isEmpty(existedInvoices)) {
            const notUpdatableFields = ['ticket', 'property', 'unitName', 'unitType', 'contact', 'clientName', 'clientPhone', 'client']

            for (const existedInvoice of existedInvoices) {
                const initialInvoice = invoices.find(invoice => invoice.id === existedInvoice.id)

                const editedFields = reduce(initialInvoice, (result, value, key) => {
                    if (notUpdatableFields.includes(key)) {
                        return result
                    }

                    if (key === 'rows') {
                        const fieldsToPick = ['count', 'isMin', 'name', 'sku', 'toPay']
                        const updatedRows = existedInvoice[key]

                        if (get(value, 'length') !== updatedRows.length) {
                            return result.concat(key)
                        }

                        for (let i = 0; i < updatedRows.length; i++) {
                            const updatedRow = updatedRows[i]
                            const initialRow = value[i]

                            if (!isEqual(pick(initialRow, fieldsToPick), pick(updatedRow, fieldsToPick))) {
                                return result.concat(key)
                            }
                        }

                        return result
                    } else {
                        return isEqual(value, existedInvoice[key]) ?
                            result : result.concat(key)
                    }
                }, [])

                if (!isEmpty(editedFields)) {
                    await updateInvoiceAction(pick(existedInvoice, editedFields), existedInvoice)
                }
            }
        }

        return ticket
    }

    useEffect(() => {
        refetch()
        refetchFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const ticketSourceType = useMemo(() => get(obj, ['source', 'type']), [obj])
    const ticketAssignee = useMemo(() => get(obj, 'assignee'), [obj])

    const autoAssign = isEmpty(ticketAssignee) && ticketSourceType === TICKET_SOURCE_TYPES.MOBILE_APP

    const initialValues = useMemo(() => {
        const result = { ...Ticket.convertToFormState(obj) }
        if (invoices) {
            result['invoices'] = invoices.map(invoice => invoice.id)
        }

        return result
    }, [invoices, obj])

    const loading = ticketLoading || invoicesLoading
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
            initialValues={initialValues}
            organization={get(obj, 'organization')}
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
