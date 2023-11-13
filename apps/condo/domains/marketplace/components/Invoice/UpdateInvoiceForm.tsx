import { Invoice as InvoiceType } from '@app/condo/schema'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { Invoice, InvoiceContext } from '@condo/domains/marketplace/utils/clientSchema'


import { BaseInvoiceForm } from './BaseInvoiceForm'

type UpdateInvoiceFormProps = {
    invoice: InvoiceType
}

export const UpdateInvoiceForm: React.FC<UpdateInvoiceFormProps> = ({ invoice }) => {
    const intl = useIntl()

    const router = useRouter()
    const { organization, link } = useOrganization()

    const updateInvoiceAction = Invoice.useUpdate({}, async () => {
        //
    })

    const handleUpdateInvoice = useCallback(async (values) => {
        console.log(values)
    }, [])

    return (
        <BaseInvoiceForm
            organization={organization}
            role={link}
            action={handleUpdateInvoice}
            initialValues={{
                payerData: !!get(invoice, 'contact.id'),
                paymentType: get(invoice, 'paymentType'),
                status: get(invoice, 'status'),
                contact: get(invoice, 'contact.id'),
                propertyId: get(invoice, 'property.id'),
                unitName: get(invoice, 'unitName'),
                unitType: get(invoice, 'unitType'),
                clientName: get(invoice, 'clientName'),
                clientPhone: get(invoice, 'clientPhone'),
                rows: get(invoice, 'rows', []).map(row => ({ ...row, price: row.toPay })),
            }}
        />
    )
}
