import { Invoice as InvoiceType, UserTypeType } from '@app/condo/schema'
import { Col, notification } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import React, { ComponentProps, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button } from '@open-condo/ui'

import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import {
    INVOICE_STATUS_PUBLISHED,
    INVOICE_STATUS_DRAFT,
} from '@condo/domains/marketplace/constants'
import { useInvoicePaymentLink } from '@condo/domains/marketplace/hooks/useInvoicePaymentLink'
import { Invoice, InvoiceContext } from '@condo/domains/marketplace/utils/clientSchema'

import { BaseInvoiceForm } from './BaseInvoiceForm'
import { getPaymentLinkNotification } from './CopyButton'


type UpdateInvoiceFormProps = {
    invoice: InvoiceType
    modalFormProps?: ComponentProps<typeof BaseModalForm>
    afterAction: () => Promise<void>
}

export const UpdateInvoiceForm: React.FC<UpdateInvoiceFormProps> = ({ invoice, modalFormProps, afterAction }) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })

    const { organization, link } = useOrganization()

    const { obj: invoiceContext } = InvoiceContext.useObject({
        where: {
            organization: { id: organization.id },
        },
    })

    const isModalForm = useMemo(() => !isEmpty(modalFormProps), [modalFormProps])

    const updateInvoiceAction = Invoice.useUpdate({}, afterAction)

    const getPaymentLink = useInvoicePaymentLink()
    const [submitLoading, setSubmitLoading] = useState<boolean>(false)

    const handleUpdateInvoice = useCallback(async (values) => {
        setSubmitLoading(true)
        let payloadToProcessor = { ...values, context: invoiceContext.id }
        if (!values.payerData) {
            payloadToProcessor = { ...payloadToProcessor, property: null, contact: null, unitName: null, unitType: null }
        }
        const formattedValues = Invoice.formValuesProcessor(payloadToProcessor, invoiceContext, intl)
        const updatedInvoice = await updateInvoiceAction(formattedValues, invoice)

        if (
            invoice.status === INVOICE_STATUS_DRAFT &&
            values.status === INVOICE_STATUS_PUBLISHED
        ) {
            const { error, paymentLink } = await getPaymentLink([updatedInvoice.id])

            if (paymentLink) {
                notification.success(getPaymentLinkNotification({ intl, number: updatedInvoice.number, url: paymentLink }))
            } else {
                notification.error(getPaymentLinkNotification({ intl, number: updatedInvoice.number, linkError: error }))
            }
        }

        setSubmitLoading(false)
        return updatedInvoice
    }, [getPaymentLink, intl, invoice, invoiceContext, updateInvoiceAction])

    const initialValues = useMemo(() => Invoice.convertToFormState(invoice, intl), [intl, invoice])

    return (
        <BaseInvoiceForm
            organization={organization}
            role={link}
            action={handleUpdateInvoice}
            initialValues={initialValues}
            isCreatedByResident={get(invoice, 'createdBy.type') === UserTypeType.Resident}
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
