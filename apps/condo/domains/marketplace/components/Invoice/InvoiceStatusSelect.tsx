import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { INVOICE_STATUS_CANCELED, INVOICE_STATUS_COLORS, INVOICE_STATUS_TRANSITIONS, INVOICE_PAYMENT_TYPE_ONLINE, INVOICE_STATUS_PAID } from '@condo/domains/marketplace/constants'
import { Invoice } from '@condo/domains/marketplace/utils/clientSchema'
import { StatusSelect } from '@condo/domains/ticket/components/TicketStatusSelect'

import { useCancelStatusModal } from '../../hooks/useCancelStatusModal'


type InvoiceStatusOptionType = {
    label: string,
    value: string,
    color: string,
    bgColor: string,
    statusTransitions: string[]
}

const mapStatusToOption = (intl, status, invoicePaymentType): InvoiceStatusOptionType => {
    const mappedStatus = {
        value: status,
        label: intl.formatMessage({ id: `pages.condo.marketplace.invoice.invoiceStatus.${status}` }),
        color: INVOICE_STATUS_COLORS[status].color,
        bgColor: INVOICE_STATUS_COLORS[status].bgColor,
        statusTransitions: INVOICE_STATUS_TRANSITIONS[status],
    }

    if (invoicePaymentType === INVOICE_PAYMENT_TYPE_ONLINE) {
        mappedStatus.statusTransitions = mappedStatus.statusTransitions.filter(status => status !== INVOICE_STATUS_PAID)
    }

    return mappedStatus
}

export const InvoiceStatusSelect = ({ invoice, onUpdate, organization, employee, ...props }) => {
    const intl = useIntl()

    const [isUpdating, setUpdating] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState<InvoiceStatusOptionType>(
        mapStatusToOption(intl, invoice.status, invoice.paymentType)
    )
    const selectOptions: InvoiceStatusOptionType[] = useMemo(() =>
        selectedStatus && selectedStatus.statusTransitions.map(status =>  mapStatusToOption(intl, status, invoice.paymentType)),
    [intl, invoice.paymentType, selectedStatus])

    const canManageInvoices = useMemo(() => get(employee, ['role', 'canManageInvoices'], false), [employee])

    const { CancelStatusModal, setIsCancelModalOpen } = useCancelStatusModal()

    const handleUpdate = useCallback(() => {
        if (isFunction(onUpdate)) onUpdate()
        setUpdating(false)
    }, [onUpdate, setUpdating])

    const updateInvoiceAction = Invoice.useUpdate({}, handleUpdate)

    const updateInvoice = useCallback(async (value) => {
        setUpdating(true)
        setSelectedStatus(mapStatusToOption(intl, value, invoice.paymentType))
        setUpdating(false)
        await updateInvoiceAction({ status: value }, invoice)
    }, [intl, invoice, updateInvoiceAction])

    const handleChange = useCallback(async (value) => {
        if (value === INVOICE_STATUS_CANCELED) {
            setIsCancelModalOpen(true)
        } else {
            await updateInvoice(value)
        }
    }, [setIsCancelModalOpen, updateInvoice])

    const options = useMemo(() => selectOptions.map((status) => ({
        key: status.value,
        value: status.value,
        label: status.label,
        style: { color: status.bgColor },
    })), [selectOptions])
    const optionsWithSelected = [...options, { ...selectedStatus, hidden: true }]

    const isLoading = isUpdating
    const isDisabled = isLoading || !canManageInvoices || isEmpty(get(selectedStatus, 'statusTransitions'))

    return (
        <>
            <StatusSelect
                color={selectedStatus.color}
                backgroundColor={selectedStatus.bgColor}
                disabled={isDisabled}
                loading={isLoading}
                onChange={handleChange}
                value={selectedStatus.value}
                bordered={false}
                eventName='InvoiceStatusSelect'
                options={optionsWithSelected}
                {...props}
            />
            <CancelStatusModal
                onButtonClick={async () => {
                    await updateInvoice(INVOICE_STATUS_CANCELED)
                }}
            />
        </>
    )
}
