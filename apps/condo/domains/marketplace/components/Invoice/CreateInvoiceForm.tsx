import { Typography } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { CheckCircle, Copy } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Space } from '@open-condo/ui'

import { INVOICE_PAYMENT_TYPE_ONLINE, INVOICE_STATUS_DRAFT } from '@condo/domains/marketplace/constants'
import { Invoice, InvoiceContext } from '@condo/domains/marketplace/utils/clientSchema'

import { BaseInvoiceForm } from './BaseInvoiceForm'

const REFRESH_COPY_BUTTON_INTERVAL_IN_MS = 3000

const PaymentLinkButton = ({ invoice, copyMessage, copiedMessage }) => {

    // generate link

    const [copied, setCopied] = useState<boolean>()

    const handleCopyClick = () => {
        if (copied) return

        // copy link

        setCopied(true)
        setTimeout(() => setCopied(false), REFRESH_COPY_BUTTON_INTERVAL_IN_MS)
    }

    return (
        <Button
            disabled={copied}
            type='secondary'
            icon={copied ? <CheckCircle size='medium' /> : <Copy size='medium' />}
            onClick={handleCopyClick}
        >
            {copied ? copiedMessage : copyMessage}
        </Button>
    )
}

export const CreateInvoiceForm: React.FC = () => {
    const intl = useIntl()
    const SuccessNotificationDescription = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.create.notification.description' })
    const CopyLinkMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.create.notification.copyLink' })
    const CopiedLinkMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.create.notification.copiedLink' })

    const router = useRouter()
    const { organization, link } = useOrganization()

    const createInvoiceAction = Invoice.useCreate({}, async () => {
        // replace after create marketplace/index page
        await router.push('/ticket')
    })

    const { obj: invoiceContext } = InvoiceContext.useObject({
        where: {
            organization: { id: organization.id },
        },
    })

    const handleCreateInvoice = useCallback(async (values) => {
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
        const vatPercent = String(get(invoiceContext, 'vatPercent'))
        const salesTaxPercent = String(get(invoiceContext, 'salesTaxPercent'))
        const currencyCode = String(get(invoiceContext, 'currencyCode'))

        const rows = rawRows.map(row => ({
            name: row.name, toPay: String(row.price), count: row.count, sku: row.sku, isMin: row.isMin,
            currencyCode, vatPercent, salesTaxPercent,
        }))

        newInvoiceData = {
            ...newInvoiceData,
            context: { connect: { id: invoiceContext.id } },
            status: get(values, 'status'),
            paymentType: get(values, 'paymentType'),
            clientName: get(values, 'clientName'),
            clientPhone: get(values, 'clientPhone'),
            unitName: get(values, 'unitName'),
            unitType: get(values, 'unitType'),
            rows,
        }

        return await createInvoiceAction(newInvoiceData)
    }, [createInvoiceAction, invoiceContext])

    const initialValues = useMemo(() =>
        ({ rows: [{ name: '', count: 1, price: '0', isMin: false }], paymentType: INVOICE_PAYMENT_TYPE_ONLINE, status: INVOICE_STATUS_DRAFT, payerData: true }),
    [])

    const getCompletedNotification = useCallback((data) => ({
        message: (
            <Typography.Text strong>
                {intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.create.notification.message' }, { number: data.number })}
            </Typography.Text>
        ),
        description: (
            <Space size={16} direction='vertical'>
                <Typography.Text>
                    {SuccessNotificationDescription}
                </Typography.Text>
                <PaymentLinkButton invoice={data} copyMessage={CopyLinkMessage} copiedMessage={CopiedLinkMessage}/>
            </Space>
        ),
        duration: 0,
    }), [CopiedLinkMessage, CopyLinkMessage, SuccessNotificationDescription, intl])


    return (
        <BaseInvoiceForm
            isCreateForm
            action={handleCreateInvoice}
            organization={organization}
            role={link}
            initialValues={initialValues}
            OnCompletedMsg={getCompletedNotification}
        />
    )
}
