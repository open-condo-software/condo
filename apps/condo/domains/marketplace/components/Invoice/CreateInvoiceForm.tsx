import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useMutation } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { REGISTER_MULTI_PAYMENT_MUTATION } from '@condo/domains/acquiring/gql'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { INVOICE_PAYMENT_TYPE_ONLINE, INVOICE_STATUS_DRAFT, INVOICE_STATUS_PUBLISHED } from '@condo/domains/marketplace/constants'
import { Invoice, InvoiceContext } from '@condo/domains/marketplace/utils/clientSchema'

import { BaseInvoiceForm } from './BaseInvoiceForm'
import { getPaymentLinkNotification } from './CopyButton'


export const CreateInvoiceForm: React.FC = () => {
    const intl = useIntl()
    const router = useRouter()
    const { organization, link } = useOrganization()

    const createInvoiceAction = Invoice.useCreate({}, async () => {
        // replace after create marketplace/index page
        await router.push('/marketplace?tab=bills')
    })

    const { obj: invoiceContext } = InvoiceContext.useObject({
        where: {
            organization: { id: organization.id },
        },
    })

    const [registerMultiPayment] = useMutation(REGISTER_MULTI_PAYMENT_MUTATION)

    const handleCreateInvoice = useCallback(async (values) => {
        const payload = Invoice.formValuesProcessor({ ...values, context: invoiceContext.id }, invoiceContext)
        const createdInvoice = await createInvoiceAction(payload)

        const { status } = values
        if (status === INVOICE_STATUS_PUBLISHED) {
            await runMutation({
                mutation: registerMultiPayment,
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        invoices: [{ id: createdInvoice.id }],
                    },
                },
                OnCompletedMsg: (data) => {
                    const { data: { result } } = data
                    return getPaymentLinkNotification({ intl, number: createdInvoice.number, url: result.webViewUrl })
                },
                onError: (err) => {
                    console.log(err)
                },
                intl,
            })
        }

        return createdInvoice
    }, [createInvoiceAction, intl, invoiceContext, registerMultiPayment])

    const initialValues = useMemo(() =>
        ({ rows: [{ name: '', count: 1, toPay: '0', isMin: false }], paymentType: INVOICE_PAYMENT_TYPE_ONLINE, status: INVOICE_STATUS_DRAFT, payerData: true }),
    [])

    return (
        <BaseInvoiceForm
            isCreateForm
            action={handleCreateInvoice}
            organization={organization}
            role={link}
            initialValues={initialValues}
            OnCompletedMsg={null}
        />
    )
}
