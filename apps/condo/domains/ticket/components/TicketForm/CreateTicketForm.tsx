import { useCreateTicketMutation, useGetTicketByCreatedByQuery, useCreateInvoiceMutation } from '@app/condo/gql'
import { B2BAppGlobalFeature } from '@app/condo/schema'
import { Form, notification } from 'antd'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState, useEffect } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
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
import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'

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
    const userId = user?.id || null

    const { persistor } = useCachePersistor()
    const {
        data: userTicketsData,
        loading: userTicketsLoading,
    } = useGetTicketByCreatedByQuery({
        variables: {
            userId,
        },
        skip: !persistor || !userId,
    })
    const userTicketsCount = useMemo(() => userTicketsData?.tickets?.filter(Boolean)?.length || 0,
        [userTicketsData?.tickets])

    useEffect(() => {
        if (userTicketsLoading) return
        setCurrentStep((userTicketsCount === 0 && !disabled) ? 1 : 0)
    }, [disabled, setCurrentStep, userTicketsCount, userTicketsLoading])

    return (
        <Form.Item noStyle shouldUpdate>
            {
                ({ getFieldsValue, getFieldError }) => {
                    const { property, details, placeClassifier, categoryClassifier, deadline } = getFieldsValue(REQUIRED_TICKET_FIELDS)
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

    const { organization } = useOrganization()
    const router = useRouter()
    const auth = useAuth() as { user: { id: string } }
    const client = useApolloClient()
    const { addTicketToQueryCacheForTicketCardList } = useCacheUtils(client.cache)
    const { requestFeature } = useGlobalAppsFeaturesContext()

    const initialValuesFromQuery = useMemo(() => getObjectValueFromQuery(router, ['initialValues']), [router])
    const redirectToClientCard = useMemo(() => !!router?.query?.redirectToClientCard || null, [router])

    const [createInvoiceAction] = useCreateInvoiceMutation()
    const [createTicketAction] = useCreateTicketMutation({
        onCompleted: async (ticketData) => {
            const ticket = ticketData?.ticket
            addTicketToQueryCacheForTicketCardList(ticket)
            if (redirectToClientCard) {
                const clientPhone = ticket?.clientPhone
                const ticketPropertyId = ticket?.property.id
                const isResidentTicket = !!ticket?.contact

                if (clientPhone && ticketPropertyId) {
                    const clientCardTabType = isResidentTicket ? ClientType.Resident : ClientType.NotResident
                    await router.push(
                        `/phone/${clientPhone}?tab=${
                            getClientCardTabKey(ticketPropertyId, clientCardTabType, ticket?.unitName, ticket?.unitType)
                        }`
                    )
                }
            } else {
                await router.push('/ticket')
            }
        },
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
        let deadline = variables?.deadline
        if (deadline && deadline.isToday()) {
            deadline = deadline.endOf('day')
        }
        const { newInvoices, ...ticketValues } = variables

        const { data: ticketData } = await createTicketAction({
            variables: {
                data: {
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                    status: {
                        connect: { id: OPEN_STATUS },
                    },
                    organization: { connect: { id: organization.id } },
                    ...Ticket.formValuesProcessor({ ...ticketValues, deadline }),
                },
            },
        })
        const ticket = ticketData?.ticket

        let paymentUrl
        if (!isEmpty(newInvoices)) {
            for (const invoiceFromForm of newInvoices) {
                const payload = Invoice.formValuesProcessor({
                    ...invoiceFromForm,
                    ticket: ticket?.id,
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                }, intl, true)

                await createInvoiceAction({
                    variables: {
                        data: {
                            dv: 1,
                            sender: getClientSideSenderInfo(),
                            ...payload,
                        },
                    },
                })
            }

            const data = await client.query({
                query: InvoiceGQL.GET_ALL_OBJS_QUERY,
                variables: {
                    where: {
                        ticket: { id: ticket?.id },
                        status: INVOICE_STATUS_PUBLISHED,
                    },
                },
            })
            const publishedInvoices = data?.data?.objs

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
            ticketNumber: ticket?.number,
            ticketId: ticket.id,
        }))

        if (paymentUrl && ticket.contact) {
            notification.success(getCompletedNotification({
                ticketNumber: ticket?.number,
                paymentUrl,
            }))
        }

        return ticket
    }, [createTicketAction, organization.id, getCompletedNotification, client, getPaymentLink, intl, createInvoiceAction, requestFeature])

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
                autoAssign
                OnCompletedMsg={null}
                isExisted={false}
            >
                {({ handleSave, isLoading, form }) => <CreateTicketActionBar handleSave={handleSave} isLoading={isLoading} form={form} />}
            </BaseTicketForm>
        </Tour.Provider>
    ), [createAction, initialValues, organization])
}
