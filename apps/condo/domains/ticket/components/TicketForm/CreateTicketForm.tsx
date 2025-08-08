import {
    useCreateTicketMutation,
    useGetTicketByCreatedByQuery,
    useCreateInvoiceMutation,
    useGetPublishTicketInvoicesLazyQuery,
} from '@app/condo/gql'
import { B2BAppGlobalFeature } from '@app/condo/schema'
import { Form, notification } from 'antd'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import isEmpty from 'lodash/isEmpty'
import { useRouter } from 'next/router'
import React, { useCallback, useMemo, useState, useEffect } from 'react'

import { useCachePersistor } from '@open-condo/apollo'
import { getClientSideSenderInfo } from '@open-condo/codegen/utils/userId'
import { MUTATION_RESULT_EVENT, MutationEmitter, useApolloClient } from '@open-condo/next/apollo'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { ActionBar, Space, Typography, Tour } from '@open-condo/ui'

import { getObjectValueFromQuery } from '@condo/domains/common/utils/query'
import { CopyButton } from '@condo/domains/marketplace/components/Invoice/CopyButton'
import { useInvoicePaymentLink } from '@condo/domains/marketplace/hooks/useInvoicePaymentLink'
import { Invoice } from '@condo/domains/marketplace/utils/clientSchema'
import { useGlobalAppsFeaturesContext } from '@condo/domains/miniapp/components/GlobalApps/GlobalAppsFeaturesContext'
import { BaseTicketForm } from '@condo/domains/ticket/components/BaseTicketForm'
import { TicketSubmitButton } from '@condo/domains/ticket/components/BaseTicketForm/TicketSubmitButton'
import { useTicketFormContext } from '@condo/domains/ticket/components/TicketForm/TicketFormContext'
import { REQUIRED_TICKET_FIELDS } from '@condo/domains/ticket/constants/common'
import { useCacheUtils } from '@condo/domains/ticket/hooks/useCacheUtils'
import { Ticket } from '@condo/domains/ticket/utils/clientSchema'
import { ClientCardTab, getClientCardTabKey } from '@condo/domains/ticket/utils/clientSchema/clientCard'
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
                    const propertyMismatchError = getFieldError('property').find((error) => error.includes(AddressNotSelected))
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
    const { user } = useAuth()
    const userId = user?.id || null
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
            MutationEmitter.emit(MUTATION_RESULT_EVENT, {
                name: 'createTicket',
            })
            if (redirectToClientCard) {
                const clientPhone = ticket?.clientPhone
                const ticketPropertyId = ticket?.property?.id
                const isResidentTicket = !!ticket?.contact

                if (clientPhone && ticketPropertyId) {
                    const clientCardTabType = isResidentTicket ? ClientCardTab.Resident : ClientCardTab.NotResident
                    await router.push({
                        pathname: `/phone/${clientPhone}`,
                        query: {
                            tab: getClientCardTabKey(
                                ticketPropertyId,
                                clientCardTabType,
                                ticket?.unitName,
                                ticket?.unitType,
                            ),
                        },
                    })
                }
            } else {
                await router.push('/ticket')
            }
        },
    })
    const [getPublishTicketInvoices] = useGetPublishTicketInvoicesLazyQuery()

    const getCompletedNotification = useCallback(({ ticketId, ticketNumber, paymentUrl }: { ticketId?: string, ticketNumber?: number, paymentUrl?: string }) => ({
        message: (
            <Typography.Text strong>
                {intl.formatMessage({ id: 'pages.condo.ticket.notification.success.message' }, { number: ticketNumber })}
            </Typography.Text>
        ),
        description: paymentUrl ? (
            <Space size={16} direction='vertical'>
                <Typography.Text size='medium' type='secondary'>{SuccessNotificationWithPaymentLinkDescription}</Typography.Text>
                <CopyButton url={paymentUrl} copyMessage={CopyLinkMessage} copiedMessage={CopiedLinkMessage} />
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
        const ticketId = ticket?.id || null

        let paymentUrl
        if (!isEmpty(newInvoices)) {
            for (const invoiceFromForm of newInvoices) {
                const payload = Invoice.formValuesProcessor({
                    ...invoiceFromForm,
                    ticket: ticketId,
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

            const { data: publishTicketInvoicesData } = await getPublishTicketInvoices({
                variables: {
                    ticketId,
                    first: 100,
                },
            })

            const publishedInvoices = publishTicketInvoicesData?.publishInvoices?.filter(Boolean) || []

            const { paymentLink } = await getPaymentLink(publishedInvoices.map(({ id }) => id))
            paymentUrl = paymentLink
        }

        if (attachCallRecord) {
            requestFeature({
                feature: B2BAppGlobalFeature.AttachCallRecordToTicket,
                ticketId,
                ticketOrganizationId: organization.id,
            })
        }

        notification.success(getCompletedNotification({
            ticketNumber: ticket?.number,
            ticketId: ticketId,
        }))

        if (paymentUrl && ticket.contact) {
            notification.success(getCompletedNotification({
                ticketNumber: ticket?.number,
                paymentUrl,
            }))
        }

        return ticket
    }, [createTicketAction, organization.id, getCompletedNotification, client, getPaymentLink, intl, createInvoiceAction, getPublishTicketInvoices, requestFeature])

    const initialValues = useMemo(() => ({
        ...initialValuesFromQuery,
        assignee: userId,
        executor: userId,
        invoices: [],
    }), [userId, initialValuesFromQuery])

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
