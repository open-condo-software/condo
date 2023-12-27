import { Invoice as InvoiceType, UserTypeType } from '@app/condo/schema'
import { Col, Form, notification } from 'antd'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import omit from 'lodash/omit'
import React, { ComponentProps, useCallback, useMemo, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Button, Tooltip } from '@open-condo/ui'

import { BaseModalForm } from '@condo/domains/common/components/containers/FormList'
import {
    INVOICE_STATUS_PUBLISHED,
    INVOICE_STATUS_DRAFT,
    INVOICE_STATUS_CANCELED,
    INVOICE_STATUS_PAID,
} from '@condo/domains/marketplace/constants'
import { useInvoicePaymentLink } from '@condo/domains/marketplace/hooks/useInvoicePaymentLink'
import { Invoice } from '@condo/domains/marketplace/utils/clientSchema'
import {
    getSaveButtonTooltipMessage,
    InvoiceFormValuesType,
} from '@condo/domains/marketplace/utils/clientSchema/Invoice'

import { BaseInvoiceForm } from './BaseInvoiceForm'
import { getPaymentLinkNotification } from './CopyButton'

type UpdateInvoiceFormProps = {
    invoice: InvoiceType
    organizationId: string
    action?: (values: InvoiceFormValuesType) => Promise<void>
    afterAction?: () => Promise<void>
    modalFormProps?: ComponentProps<typeof BaseModalForm>
    initialValues?: InvoiceFormValuesType
    isAllFieldsDisabled?: boolean
    ticketCreatedByResident?: boolean
}

export const UpdateInvoiceForm: React.FC<UpdateInvoiceFormProps> = ({
    invoice, organizationId, modalFormProps, action, afterAction, initialValues, isAllFieldsDisabled, ticketCreatedByResident,
}) => {
    const intl = useIntl()
    const SaveLabel = intl.formatMessage({ id: 'Save' })

    const isModalForm = useMemo(() => !isEmpty(modalFormProps), [modalFormProps])
    const CancelLabel = intl.formatMessage({ id: 'Cancel' })

    const { link } = useOrganization()
    const canManageInvoices = get(link, 'role.canManageInvoices', false)

    const updateInvoiceAction = Invoice.useUpdate({}, afterAction)

    const getPaymentLink = useInvoicePaymentLink()
    const [submitLoading, setSubmitLoading] = useState<boolean>(false)

    const handleUpdateInvoice = useCallback(async (values) => {
        setSubmitLoading(true)
        let valuesFromForm = { ...values }
        if (isModalForm) {
            valuesFromForm = omit(values, ['clientName', 'clientPhone', 'contact', 'property', 'unitName', 'unitType'])
        }
        if (!values.payerData) {
            valuesFromForm = {
                ...valuesFromForm,
                clientName: null,
                clientPhone: null,
                contact: null,
                property: null,
                unitName: null,
                unitType: null,
                client: null,
            }
        }

        const formattedValues = Invoice.formValuesProcessor(valuesFromForm, intl)
        const updatedInvoice = await updateInvoiceAction(formattedValues, invoice)

        if (
            invoice.status === INVOICE_STATUS_DRAFT &&
            values.status === INVOICE_STATUS_PUBLISHED &&
            !isModalForm &&
            updatedInvoice.contact
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
    }, [getPaymentLink, intl, invoice, isModalForm, updateInvoiceAction])

    const formInitialValues = useMemo(() => ({
        ...Invoice.convertToFormState(invoice, intl),
        ...initialValues,
    }), [initialValues, intl, invoice])

    const [form] = Form.useForm()

    const tooltipTitle = getSaveButtonTooltipMessage(form, intl)

    const modalProps: ComponentProps<typeof BaseModalForm> = isModalForm && {
        ...modalFormProps,
        submitButtonProps: {
            hidden: !isEmpty(tooltipTitle) ||
                invoice.status === INVOICE_STATUS_CANCELED ||
                invoice.status === INVOICE_STATUS_PAID,
            loading: submitLoading,
        },
    }

    return (
        <BaseInvoiceForm
            organizationId={organizationId}
            role={link}
            action={action || handleUpdateInvoice}
            initialValues={formInitialValues}
            isCreatedByResident={get(invoice, 'createdBy.type') === UserTypeType.Resident || ticketCreatedByResident}
            OnCompletedMsg={null}
            modalFormProps={modalProps}
            isAllFieldsDisabled={isAllFieldsDisabled}
            isContactsFieldsDisabled={!!get(invoice, 'ticket')}
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

                                    if (!canManageInvoices) {
                                        return <></>
                                    }

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
                                                                key='submit'
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
