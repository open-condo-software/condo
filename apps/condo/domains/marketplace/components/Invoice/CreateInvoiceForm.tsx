import { Invoice as InvoiceType } from '@app/condo/schema'
import { Col, Form, notification } from 'antd'
import isEmpty from 'lodash/isEmpty'
import omit from 'lodash/omit'
import React, { ComponentProps, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Tooltip } from '@open-condo/ui'

import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import {
    INVOICE_PAYMENT_TYPE_ONLINE,
    INVOICE_STATUS_DRAFT,
    INVOICE_STATUS_PUBLISHED,
    INITIAL_ROWS_VALUE,
    INVOICE_STATUS_CANCELED,
} from '@condo/domains/marketplace/constants'
import { useInvoicePaymentLink } from '@condo/domains/marketplace/hooks/useInvoicePaymentLink'
import { Invoice } from '@condo/domains/marketplace/utils/clientSchema'
import {
    getSaveButtonTooltipMessage,
    InvoiceFormValuesType,
} from '@condo/domains/marketplace/utils/clientSchema/Invoice'

import { BaseInvoiceForm } from './BaseInvoiceForm'
import { getPaymentLinkNotification } from './CopyButton'


type CreateInvoiceFormProps = {
    organizationId: string
    afterAction: (invoice?: InvoiceType) => Promise<void>
    modalFormProps?: ComponentProps<typeof BaseModalForm>
    initialValues?: InvoiceFormValuesType
    ticketCreatedByResident?: boolean
}

export const CreateInvoiceForm: React.FC<CreateInvoiceFormProps> = ({ organizationId, afterAction, modalFormProps, initialValues, ticketCreatedByResident }) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })
    const CancelLabel = intl.formatMessage({ id: 'Cancel' })

    const { link } = useOrganization()

    const isModalForm = useMemo(() => !isEmpty(modalFormProps), [modalFormProps])

    const createInvoiceAction = Invoice.useCreate({
        organization: { connect: { id: organizationId } },
    }, afterAction)

    const getPaymentLink = useInvoicePaymentLink()
    const [submitLoading, setSubmitLoading] = useState<boolean>(false)

    const handleCreateInvoice = useCallback(async (values) => {
        setSubmitLoading(true)
        const valuesFromForm = isModalForm ? omit(values, ['clientName', 'clientPhone', 'contact', 'property', 'unitName', 'unitPhone']) : values
        const payload = Invoice.formValuesProcessor({ ...valuesFromForm }, intl)

        const createdInvoice = await createInvoiceAction(payload)

        const { status } = values
        if (status === INVOICE_STATUS_PUBLISHED && !isModalForm && createdInvoice.contact) {
            const { error, paymentLink } = await getPaymentLink([createdInvoice.id])

            if (paymentLink) {
                notification.success(getPaymentLinkNotification({ intl, number: createdInvoice.number, url: paymentLink }))
            } else {
                notification.error(getPaymentLinkNotification({ intl, number: createdInvoice.number, linkError: error }))
            }
        }

        setSubmitLoading(false)
        return createdInvoice
    }, [intl, createInvoiceAction, isModalForm, getPaymentLink])

    const formInitialValues: InvoiceFormValuesType = useMemo(() =>
        ({
            rows: INITIAL_ROWS_VALUE, paymentType: INVOICE_PAYMENT_TYPE_ONLINE, status: INVOICE_STATUS_DRAFT, payerData: true,
            ...initialValues,
        }),
    [initialValues])

    const [form] = Form.useForm()

    const tooltipTitle = getSaveButtonTooltipMessage(form, intl)

    const modalProps: ComponentProps<typeof BaseModalForm> = isModalForm && {
        ...modalFormProps,
        submitButtonProps: { hidden: !isEmpty(tooltipTitle), loading: submitLoading },
    }

    return (
        <BaseInvoiceForm
            isCreateForm
            action={handleCreateInvoice}
            organizationId={organizationId}
            role={link}
            initialValues={formInitialValues}
            OnCompletedMsg={null}
            modalFormProps={modalProps}
            isCreatedByResident={ticketCreatedByResident}
            formInstance={form}
        >
            {
                ({ handleSave }) => {
                    return !isModalForm && (
                        <Form.Item
                            noStyle
                            shouldUpdate
                        >
                            {
                                (form) => {
                                    const tooltipTitle = getSaveButtonTooltipMessage(form, intl)
                                    const disabled = submitLoading || !isEmpty(tooltipTitle)

                                    return (
                                        <Col span={24}>
                                            <ActionBar
                                                actions={[
                                                    <Tooltip
                                                        title={tooltipTitle}
                                                        key='submit'
                                                    >
                                                        <span>
                                                            <Button
                                                                onClick={handleSave}
                                                                type='primary'
                                                                loading={submitLoading}
                                                                disabled={disabled}
                                                            >
                                                                {SaveLabel}
                                                            </Button>
                                                        </span>
                                                    </Tooltip>,
                                                    <Button
                                                        key='cancel'
                                                        onClick={() => afterAction()}
                                                        type='secondary'
                                                    >
                                                        {CancelLabel}
                                                    </Button>,
                                                ]}
                                            />
                                        </Col>
                                    )
                                }
                            }
                        </Form.Item>
                    )
                }
            }
        </BaseInvoiceForm>
    )
}
