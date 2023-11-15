import { Invoice as InvoiceType, UserTypeType } from '@app/condo/schema'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useMutation } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { REGISTER_MULTI_PAYMENT_MUTATION } from '@condo/domains/acquiring/gql'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import {
    INVOICE_STATUS_PUBLISHED,
    INVOICE_STATUS_DRAFT,
} from '@condo/domains/marketplace/constants'
import { Invoice, InvoiceContext } from '@condo/domains/marketplace/utils/clientSchema'

import { BaseInvoiceForm } from './BaseInvoiceForm'
import { getPaymentLinkNotification } from './PaymentLinkButton'


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

    const [registerMultiPayment] = useMutation(REGISTER_MULTI_PAYMENT_MUTATION)

    const updateInvoiceAction = Invoice.useUpdate({}, async () => {
        await router.push(`/marketplace/invoice/${invoice.id}`)
    })

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
            await runMutation({
                mutation: registerMultiPayment,
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        invoices: [{ id: updatedInvoice.id }],
                    },
                },
                OnCompletedMsg: (data) => {
                    const { data: { result } } = data
                    return getPaymentLinkNotification({ intl, number: updatedInvoice.number, url: result.webViewUrl })
                },
                onError: (err) => {
                    console.log(err)
                },
                intl,
            })
        }

        return updatedInvoice
    }, [intl, invoice, invoiceContext, registerMultiPayment, updateInvoiceAction])

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
