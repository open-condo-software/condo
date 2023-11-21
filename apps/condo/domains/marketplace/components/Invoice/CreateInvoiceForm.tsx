import { Invoice as InvoiceType } from '@app/condo/schema'
import { Col, notification } from 'antd'
import isEmpty from 'lodash/isEmpty'
import omit from 'lodash/omit'
import React, { ComponentProps, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'

import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import { INVOICE_PAYMENT_TYPE_ONLINE, INVOICE_STATUS_DRAFT, INVOICE_STATUS_PUBLISHED } from '@condo/domains/marketplace/constants'
import { useInvoicePaymentLink } from '@condo/domains/marketplace/hooks/useInvoicePaymentLink'
import { Invoice, InvoiceContext } from '@condo/domains/marketplace/utils/clientSchema'
import { InvoiceFormValuesType } from '@condo/domains/marketplace/utils/clientSchema/Invoice'

import { BaseInvoiceForm } from './BaseInvoiceForm'
import { getPaymentLinkNotification } from './CopyButton'


type CreateInvoiceFormProps = {
    afterAction: (invoice: InvoiceType) => Promise<void>
    modalFormProps?: ComponentProps<typeof BaseModalForm>
    initialValues?: InvoiceFormValuesType
}

export const CreateInvoiceForm: React.FC<CreateInvoiceFormProps> = ({ afterAction, modalFormProps, initialValues }) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })

    const { organization, link } = useOrganization()

    const isModalForm = useMemo(() => !isEmpty(modalFormProps), [modalFormProps])

    const createInvoiceAction = Invoice.useCreate({}, afterAction)

    const { obj: invoiceContext } = InvoiceContext.useObject({
        where: {
            organization: { id: organization.id },
        },
    })

    const getPaymentLink = useInvoicePaymentLink()
    const [submitLoading, setSubmitLoading] = useState<boolean>(false)

    const handleCreateInvoice = useCallback(async (values) => {
        setSubmitLoading(true)
        const valuesFromForm = isModalForm ? omit(values, ['clientName', 'clientPhone', 'contact', 'property', 'unitName', 'unitPhone']) : values
        const payload = Invoice.formValuesProcessor({ ...valuesFromForm, context: invoiceContext.id }, invoiceContext, intl)

        const createdInvoice = await createInvoiceAction(payload)

        const { status } = values
        if (status === INVOICE_STATUS_PUBLISHED && !isModalForm) {
            const { error, paymentLink } = await getPaymentLink([createdInvoice.id])

            if (paymentLink) {
                notification.success(getPaymentLinkNotification({ intl, number: createdInvoice.number, url: paymentLink }))
            } else {
                notification.error(getPaymentLinkNotification({ intl, number: createdInvoice.number, linkError: error }))
            }
        }

        setSubmitLoading(false)
        return createdInvoice
    }, [invoiceContext, intl, createInvoiceAction, isModalForm, getPaymentLink])

    const formInitialValues: InvoiceFormValuesType = useMemo(() =>
        ({
            rows: [{ name: '', count: 1, toPay: '0', isMin: false }], paymentType: INVOICE_PAYMENT_TYPE_ONLINE, status: INVOICE_STATUS_DRAFT, payerData: true,
            ...initialValues,
        }),
    [initialValues])

    return (
        <BaseInvoiceForm
            isCreateForm
            action={handleCreateInvoice}
            organization={organization}
            role={link}
            initialValues={formInitialValues}
            OnCompletedMsg={null}
            modalFormProps={modalFormProps}
        >
            {
                ({ handleSave }) => !isModalForm && (
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
