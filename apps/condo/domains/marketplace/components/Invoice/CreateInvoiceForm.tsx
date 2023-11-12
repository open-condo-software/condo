import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { Invoice, InvoiceContext } from '@condo/domains/marketplace/utils/clientSchema'

import { BaseInvoiceForm } from './BaseInvoiceForm'


export const CreateInvoiceForm: React.FC = () => {
    const intl = useIntl()
    const CreatePropertyMessage = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })

    const router = useRouter()
    const { organization, link } = useOrganization()

    const createInvoiceAction = Invoice.useCreate({}, async () => {
        //
    })

    const { obj: invoiceContext } = InvoiceContext.useObject({
        where: {
            organization: { id: organization.id },
        },
    })

    const handleCreateInvoice = useCallback(async (values) => {
        console.log('values', values)
        let newInvoiceData = {}

        const contact = get(values, 'contact')
        if (contact) {
            newInvoiceData = { ...newInvoiceData, contact: { connect: { id: contact } } }
        }
        const property = get(values, 'propertyId')
        if (property) {
            newInvoiceData = { ...newInvoiceData, property: { connect: { id: property } } }
        }

        const rawRows = get(values, 'rows', [])
        const vatPercent = get(invoiceContext, 'vatPercent')
        const salesTaxPercent = get(invoiceContext, 'salesTaxPercent')
        const currencyCode = get(invoiceContext, 'currencyCode')

        const rows = rawRows.map(row => ({
            name: row.name, toPay: row.price, count: row.count, sku: row.sku, isMin: row.isMin,
            currencyCode, vatPercent, salesTaxPercent,
        }))

        newInvoiceData = {
            ...newInvoiceData,
            context: { connect: { id: invoiceContext.id } },
            status: get(values, 'status'),
            paymentType: get(values, 'paymentType'),
            unitName: get(values, 'unitName'),
            unitType: get(values, 'unitType'),
            rows,
        }

        return await createInvoiceAction(newInvoiceData)
    }, [createInvoiceAction, invoiceContext])

    return (
        <BaseInvoiceForm
            isCreateForm
            action={handleCreateInvoice}
            organization={organization}
            role={link}
        />
    )
}
