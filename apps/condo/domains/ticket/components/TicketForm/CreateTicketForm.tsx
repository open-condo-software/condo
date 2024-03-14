import { B2BAppGlobalFeature } from '@app/condo/schema'
import { Form, notification } from 'antd'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState, useEffect } from 'react'

import { useApolloClient } from '@open-condo/next/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Space, Typography, Tour } from '@open-condo/ui'

import { getObjectValueFromQuery } from '@condo/domains/common/utils/query'
import { ClientType, getClientCardTabKey } from '@condo/domains/contact/utils/clientCard'
import { CopyButton } from '@condo/domains/marketplace/components/Invoice/CopyButton'
import { INVOICE_STATUS_PUBLISHED } from '@condo/domains/marketplace/constants'
import { Invoice as InvoiceGQL } from '@condo/domains/marketplace/gql'
import { useInvoicePaymentLink } from '@condo/domains/marketplace/hooks/useInvoicePaymentLink'
import { Invoice } from '@condo/domains/marketplace/utils/clientSchema'
import { useGlobalAppsFeaturesContext } from '@condo/domains/miniapp/components/GlobalApps/GlobalAppsFeaturesContext'
import { BaseTicketForm } from '@condo/domains/ticket/components/BaseTicketForm'
import { TicketSubmitButton } from '@condo/domains/ticket/components/BaseTicketForm/TicketSubmitButton'
import { useTicketFormContext } from '@condo/domains/ticket/components/TicketForm/TicketFormContext'
import { REQUIRED_TICKET_FIELDS } from '@condo/domains/ticket/constants/common'
import { useCacheUtils } from '@condo/domains/ticket/hooks/useCacheUtils'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { getTicketDefaultDeadline } from '@condo/domains/ticket/utils/helpers'


dayjs.extend(isToday)

const OPEN_STATUS = '6ef3abc4-022f-481b-90fb-8430345ebfc2'


export const CreateTicketActionBar = ({ handleSave, isLoading, form }) => {
    const intl = useIntl()
    const CreateTicketMessage = intl.formatMessage({ id: 'CreateTicket' })
    const AddressNotSelected = intl.formatMessage({ id: 'field.Property.nonSelectedError' })
    const OnboardingTooltipTitle = intl.formatMessage({ id: 'onboarding.tourStep.tooltip.ticket.title' })
    const OnboardingTooltipMessage = intl.formatMessage({ id: 'onboarding.tourStep.tooltip.ticket.message' })

    const { ticketSetting, ticketSettingLoading } = useTicketFormContext()
    const { setCurrentStep, currentStep } = Tour.useTourContext()
    const [disabled, setDisabled] = useState<boolean>(true)

    const { user } = useAuth()
    const userId = get(user, 'id', null)

    const { count } = Ticket.useCount({
        where: {
            createdBy: { id: userId },
        },
    })

    useEffect(() => {
        setCurrentStep((count === 0 && !disabled) ? 1 : 0)
    }, [disabled, setCurrentStep, count])

    return (
        <Form.Item noStyle shouldUpdate>
            {
                ({ getFieldsValue, getFieldError }) => {
                    const { property, details, placeClassifier, categoryClassifier, assignee, deadline } = getFieldsValue(REQUIRED_TICKET_FIELDS)
                    const propertyMismatchError = getFieldError('property').find((error)=>error.includes(AddressNotSelected))
                    const isPayable = form.getFieldValue('isPayable')
                    const isEmergency = form.getFieldValue('isEmergency')
                    const isWarranty = form.getFieldValue('isWarranty')
                    const isRequiredDeadline = getTicketDefaultDeadline(ticketSetting, isPayable, isEmergency, isWarranty) !== null
                    const disabledCondition = !property
                        || !details
                        || !placeClassifier
                        || !categoryClassifier
                        || (isRequiredDeadline && !deadline)
                        || ticketSettingLoading

                    setDisabled(disabledCondition)

                    return (
                        <ActionBar
                            actions={[
                                <Tour.TourStep
                                    step={1}
                                    title={OnboardingTooltipTitle}
                                    message={OnboardingTooltipMessage}
                                    key='submit'
                                >
                                    <TicketSubmitButton
                                        data-cy='ticket__submit-button'
                                        ApplyChangesMessage={CreateTicketMessage}
                                        handleSave={handleSave}
                                        isLoading={isLoading}
                                        disabledCondition={disabledCondition}
                                        property={property}
                                        details={details}
                                        placeClassifier={placeClassifier}
                                        categoryClassifier={categoryClassifier}
                                        deadline={deadline}
                                        propertyMismatchError={propertyMismatchError}
                                        isRequiredDeadline={isRequiredDeadline}
                                        focus={currentStep === 1}
                                    />
                                </Tour.TourStep>,
                            ]}
                        >
                        </ActionBar>
                    )
                }
            }
        </Form.Item>
    )
}


export const CreateTicketForm: React.FC = () => {
    const intl = useIntl()
    const SuccessNotificationDescription = intl.formatMessage({ id: 'pages.condo.ticket.notification.success.description' })
    const CopyLinkMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.create.notification.copyLink' })
    const CopiedLinkMessage = intl.formatMessage({ id: 'pages.condo.marketplace.invoice.form.create.notification.copiedLink' })
    const SuccessNotificationWithPaymentLinkDescription = intl.formatMessage({ id: 'pages.condo.ticket.notification.success.description.withPaymentLink' })

    const { organization, link } = useOrganization()
    const router = useRouter()
    const auth = useAuth() as { user: { id: string } }
    const client = useApolloClient()
    const { addTicketToQueryCacheForTicketCardList } = useCacheUtils(client.cache)
    const { requestFeature } = useGlobalAppsFeaturesContext()

    const initialValuesFromQuery = useMemo(() => getObjectValueFromQuery(router, ['initialValues']), [router])
    const redirectToClientCard = useMemo(() => !!get(router, ['query', 'redirectToClientCard']), [router])

    const createInvoiceAction = Invoice.useCreate({})
    const action = Ticket.useCreate(
        {
            status: { connect: { id: OPEN_STATUS } },
        },
        async (ticket) => {
            addTicketToQueryCacheForTicketCardList(ticket)
            if (redirectToClientCard) {
                const clientPhone = ticket.clientPhone
                const ticketPropertyId = get(ticket, 'property.id')
                const isResidentTicket = !!get(ticket, 'contact')

                if (clientPhone && ticketPropertyId) {
                    const clientCardTabType = isResidentTicket ? ClientType.Resident : ClientType.NotResident
                    await router.push(
                        `/phone/${clientPhone}?tab=${
                            getClientCardTabKey(ticketPropertyId, clientCardTabType, ticket.unitName, ticket.unitType)
                        }`
                    )
                }
            } else {
                await router.push('/ticket')
            }
        })

    const getCompletedNotification = useCallback(({ ticketId, ticketNumber, paymentUrl }) => ({
        message: (
            <Typography.Text strong>
                {intl.formatMessage({ id: 'pages.condo.ticket.notification.success.message' }, { number: ticketNumber })}
            </Typography.Text>
        ),
        description: paymentUrl ? (
            <Space size={16} direction='vertical'>
                <Typography.Text size='medium' type='secondary'>{SuccessNotificationWithPaymentLinkDescription}</Typography.Text>
                <CopyButton url={paymentUrl} copyMessage={CopyLinkMessage} copiedMessage={CopiedLinkMessage}/>
            </Space>
        ) : (
            <Typography.Link href={`/ticket/${ticketId}`} target='_blank' rel='noreferrer'>
                {SuccessNotificationDescription}
            </Typography.Link>
        ),
        duration: paymentUrl && 0,
    }), [CopiedLinkMessage, CopyLinkMessage, SuccessNotificationDescription, SuccessNotificationWithPaymentLinkDescription, intl])

    const getPaymentLink = useInvoicePaymentLink()

    const createAction = useCallback(async ({ attachCallRecord, ...variables }) => {
        let deadline = get(variables, 'deadline')
        if (deadline && deadline.isToday()) {
            deadline = deadline.endOf('day')
        }
        const { invoices, existedInvoices, newInvoices, ...ticketValues } = variables

        const ticket = await action({
            ...Ticket.formValuesProcessor({ ...ticketValues, deadline }),
            organization: { connect: { id: organization.id } },
        })

        let paymentUrl
        if (!isEmpty(newInvoices)) {
            for (const invoiceFromForm of newInvoices) {
                const payload = Invoice.formValuesProcessor({
                    ...invoiceFromForm,
                    ticket: ticket.id,
                }, intl, true)

                await createInvoiceAction(payload)
            }

            const data = await client.query({
                query: InvoiceGQL.GET_ALL_OBJS_QUERY,
                variables: {
                    where: {
                        ticket: { id: ticket.id },
                        status: INVOICE_STATUS_PUBLISHED,
                    },
                },
            })
            const publishedInvoices = get(data, 'data.objs')

            const { paymentLink } = await getPaymentLink(publishedInvoices.map(({ id }) => id))
            paymentUrl = paymentLink
        }

        if (attachCallRecord) {
            requestFeature({
                feature: B2BAppGlobalFeature.AttachCallRecordToTicket,
                ticketId: ticket.id,
                ticketOrganizationId: organization.id,
            })
        }

        notification.success(getCompletedNotification({
            ticketNumber: ticket.number,
            ticketId: ticket.id,
        }))

        if (paymentUrl && ticket.contact) {
            notification.success(getCompletedNotification({
                ticketNumber: ticket.number,
                paymentUrl,
            }))
        }

        return ticket
    }, [action, organization.id, getCompletedNotification, client, getPaymentLink, intl, createInvoiceAction, requestFeature])

    const initialValues = useMemo(() => ({
        ...initialValuesFromQuery,
        assignee: auth.user.id,
        executor: auth.user.id,
        invoices: [],
    }), [auth.user.id, initialValuesFromQuery])

    return useMemo(() => (
        <Tour.Provider>
            <BaseTicketForm
                action={createAction}
                initialValues={initialValues}
                organization={organization}
                role={link.role}
                autoAssign
                OnCompletedMsg={null}
                isExisted={false}
            >
                {({ handleSave, isLoading, form }) => <CreateTicketActionBar handleSave={handleSave} isLoading={isLoading} form={form} />}
            </BaseTicketForm>
        </Tour.Provider>
    ), [createAction, initialValues, link.role, organization])
}
