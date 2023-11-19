import { Col, notification } from 'antd'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'

import { INVOICE_PAYMENT_TYPE_ONLINE, INVOICE_STATUS_DRAFT, INVOICE_STATUS_PUBLISHED } from '@condo/domains/marketplace/constants'
import { useInvoicePaymentLink } from '@condo/domains/marketplace/hooks/useInvoicePaymentLink'
import { Invoice, InvoiceContext } from '@condo/domains/marketplace/utils/clientSchema'

import { BaseInvoiceForm } from './BaseInvoiceForm'
import { getPaymentLinkNotification } from './CopyButton'


export const CreateInvoiceForm: React.FC = () => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })

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

    const getPaymentLink = useInvoicePaymentLink()
    const [submitLoading, setSubmitLoading] = useState<boolean>(false)

    const handleCreateInvoice = useCallback(async (values) => {
        setSubmitLoading(true)
        const payload = Invoice.formValuesProcessor({ ...values, context: invoiceContext.id }, invoiceContext, intl)
        const createdInvoice = await createInvoiceAction(payload)

        const { status } = values
        if (status === INVOICE_STATUS_PUBLISHED) {
            const { error, paymentLink } = await getPaymentLink([createdInvoice.id])

            if (paymentLink) {
                notification.success(getPaymentLinkNotification({ intl, number: createdInvoice.number, url: paymentLink }))
            } else {
                notification.error(getPaymentLinkNotification({ intl, number: createdInvoice.number, linkError: error }))
            }
        }

        setSubmitLoading(false)
        return createdInvoice
    }, [invoiceContext, createInvoiceAction, getPaymentLink, intl])

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
        >
            {
                ({ handleSave }) => (
                    <Col span={24}>
                        <ActionBar
                            actions={[
                                <Button
                                    key='submit'
                                    onClick={handleSave}
                                    type='primary'
                                    loading={submitLoading}
                                    disabled={submitLoading}
                                >
                                    {SaveLabel}
                                </Button>,
                            ]}
                        />
                    </Col>
                )
            }
        </BaseInvoiceForm>
    )
}
