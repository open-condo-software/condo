import { Invoice as InvoiceType, UserTypeType } from '@app/condo/schema'
import { notification } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import {
    INVOICE_STATUS_PUBLISHED,
    INVOICE_STATUS_DRAFT,
} from '@condo/domains/marketplace/constants'
import { useInvoicePaymentLink } from '@condo/domains/marketplace/hooks/useInvoicePaymentLink'
import { Invoice, InvoiceContext } from '@condo/domains/marketplace/utils/clientSchema'


import { BaseInvoiceForm } from './BaseInvoiceForm'
import { getPaymentLinkNotification } from './CopyButton'


type UpdateInvoiceFormProps = {
    invoice: InvoiceType
}

export const UpdateInvoiceForm: React.FC<UpdateInvoiceFormProps> = ({ invoice }) => {
    const intl = useIntl()
    const router = useRouter()
    const { organization, link } = useOrganization()

    const { obj: invoiceContext } = InvoiceContext.useObject({
        where: {
            organization: { id: organization.id },
        },
    })

    const updateInvoiceAction = Invoice.useUpdate({}, async () => {
        await router.push(`/marketplace/invoice/${invoice.id}`)
    })

    const getPaymentLink = useInvoicePaymentLink()

    const handleUpdateInvoice = useCallback(async (values) => {
        let payloadToProcessor = { ...values, context: invoiceContext.id }
        if (!values.payerData) {
            payloadToProcessor = { ...payloadToProcessor, property: null, contact: null, unitName: null, unitType: null }
        }
        const formattedValues = Invoice.formValuesProcessor(payloadToProcessor, invoiceContext)
        const updatedInvoice = await updateInvoiceAction(formattedValues, invoice)

        if (
            invoice.status === INVOICE_STATUS_DRAFT &&
            values.status === INVOICE_STATUS_PUBLISHED
        ) {
            const paymentLink = await getPaymentLink(updatedInvoice.id)

            notification.success(getPaymentLinkNotification({ intl, number: updatedInvoice.number, url: paymentLink }))
        }

        return updatedInvoice
    }, [getPaymentLink, intl, invoice, invoiceContext, updateInvoiceAction])

    const initialValues = useMemo(() => Invoice.convertToFormState(invoice), [invoice])

    return (
        <BaseInvoiceForm
            organization={organization}
            role={link}
            action={handleUpdateInvoice}
            initialValues={initialValues}
            isCreatedByResident={get(invoice, 'createdBy.type') === UserTypeType.Resident}
            OnCompletedMsg={null}
        />
    )
}
