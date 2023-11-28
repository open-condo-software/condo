import { Invoice as InvoiceType } from '@app/condo/schema'
import { Col, notification } from 'antd'
import isEmpty from 'lodash/isEmpty'
import omit from 'lodash/omit'
import React, { ComponentProps, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'

import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import { INVOICE_PAYMENT_TYPE_ONLINE, INVOICE_STATUS_DRAFT, INVOICE_STATUS_PUBLISHED, INITIAL_ROWS_VALUE } from '@condo/domains/marketplace/constants'
import { useInvoicePaymentLink } from '@condo/domains/marketplace/hooks/useInvoicePaymentLink'
import { Invoice, InvoiceContext } from '@condo/domains/marketplace/utils/clientSchema'
import { InvoiceFormValuesType } from '@condo/domains/marketplace/utils/clientSchema/Invoice'

import { BaseInvoiceForm } from './BaseInvoiceForm'
import { getPaymentLinkNotification } from './CopyButton'


type CreateInvoiceFormProps = {
    organizationId: string
    afterAction: (invoice: InvoiceType) => Promise<void>
    modalFormProps?: ComponentProps<typeof BaseModalForm>
    initialValues?: InvoiceFormValuesType
    ticketCreatedByResident?: boolean
}

export const CreateInvoiceForm: React.FC<CreateInvoiceFormProps> = ({ organizationId, afterAction, modalFormProps, initialValues, ticketCreatedByResident }) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })

    const { link } = useOrganization()

    const isModalForm = useMemo(() => !isEmpty(modalFormProps), [modalFormProps])

    const createInvoiceAction = Invoice.useCreate({}, afterAction)

    const { obj: invoiceContext } = InvoiceContext.useObject({
        where: {
            organization: { id: organizationId },
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
            rows: INITIAL_ROWS_VALUE, paymentType: INVOICE_PAYMENT_TYPE_ONLINE, status: INVOICE_STATUS_DRAFT, payerData: true,
            ...initialValues,
        }),
    [initialValues])

    return (
        <BaseInvoiceForm
            isCreateForm
            action={handleCreateInvoice}
            organizationId={organizationId}
            role={link}
            initialValues={formInitialValues}
            OnCompletedMsg={null}
            modalFormProps={modalFormProps}
            isCreatedByResident={ticketCreatedByResident}
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
