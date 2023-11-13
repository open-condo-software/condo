import { Typography } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { CheckCircle, Copy } from '@open-condo/icons'
import { useMutation } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Space } from '@open-condo/ui'

import { REGISTER_MULTI_PAYMENT_MUTATION } from '@condo/domains/acquiring/gql'
import { runMutation } from '@condo/domains/common/utils/mutations.utils'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { INVOICE_PAYMENT_TYPE_ONLINE, INVOICE_STATUS_DRAFT } from '@condo/domains/marketplace/constants'
import { Invoice, InvoiceContext } from '@condo/domains/marketplace/utils/clientSchema'

import { BaseInvoiceForm } from './BaseInvoiceForm'


const REFRESH_COPY_BUTTON_INTERVAL_IN_MS = 3000

const PaymentLinkButton = ({ url, copyMessage, copiedMessage }) => {
    const [copied, setCopied] = useState<boolean>()

    const handleCopyClick = useCallback(async () => {
        if (copied) return

        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)

            setTimeout(() => setCopied(false), REFRESH_COPY_BUTTON_INTERVAL_IN_MS)
        } catch (e) {
            console.error('Unable to copy to clipboard', e)
        }
    }, [copied, url])

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

    const [registerMultiPayment] = useMutation(REGISTER_MULTI_PAYMENT_MUTATION)

    const getCompletedNotification = useCallback(({ number, url }) => ({
        message: (
            <Typography.Text strong>
                {intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.create.notification.message' }, { number })}
            </Typography.Text>
        ),
        description: (
            <Space size={16} direction='vertical'>
                <Typography.Text>
                    {SuccessNotificationDescription}
                </Typography.Text>
                <PaymentLinkButton url={url} copyMessage={CopyLinkMessage} copiedMessage={CopiedLinkMessage}/>
            </Space>
        ),
        duration: 0,
    }), [CopiedLinkMessage, CopyLinkMessage, SuccessNotificationDescription, intl])

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
            name: row.name, toPay: String(row.toPay), count: row.count, sku: row.sku, isMin: row.isMin,
            currencyCode, vatPercent, salesTaxPercent,
        }))
        const toPay = rows.every(row => !row.isMin) ? rows.reduce((acc, row) => +row.toPay * row.count, 0) : 0

        newInvoiceData = {
            ...newInvoiceData,
            context: { connect: { id: invoiceContext.id } },
            status: get(values, 'status'),
            paymentType: get(values, 'paymentType'),
            clientName: get(values, 'clientName'),
            clientPhone: get(values, 'clientPhone'),
            unitName: get(values, 'unitName'),
            unitType: get(values, 'unitType'),
            toPay: String(toPay),
            rows,
        }

        const createdInvoice = await createInvoiceAction(newInvoiceData)

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
                return getCompletedNotification({ number: createdInvoice.number, url: result.webViewUrl })
            },
            onError: (err) => {
                console.log(err)
            },
            intl,
        })

        return createdInvoice
    }, [createInvoiceAction, getCompletedNotification, intl, invoiceContext, registerMultiPayment])

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
