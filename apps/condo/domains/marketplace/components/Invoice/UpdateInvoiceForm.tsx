import { Invoice as InvoiceType, UserTypeType } from '@app/condo/schema'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { Invoice } from '@condo/domains/marketplace/utils/clientSchema'


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

    const initialValues = useMemo(() => ({
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
    }), [invoice])

    return (
        <BaseInvoiceForm
            organization={organization}
            role={link}
            action={handleUpdateInvoice}
            initialValues={initialValues}
            isCreatedByResident={get(invoice, 'createdBy.type') === UserTypeType.Resident}
        />
    )
}
