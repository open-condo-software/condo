import { useGetPendingSubscriptionRequestsQuery, useGetOrganizationActivatedSubscriptionsQuery, useRegisterSubscriptionContextsMutation, useCreateUserHelpRequestMutation } from '@app/condo/gql'
import { UserHelpRequestTypeType, SubscriptionPaymentType } from '@app/condo/schema'
import { notification } from 'antd'
import getConfig from 'next/config'
import { useCallback, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { type PaymentType } from '@condo/domains/subscription/hooks/useSubscriptionPaymentModal'


const { publicRuntimeConfig: { serverUrl } } = getConfig()

interface ActivateBundleParams {
    /** Pricing rule ids to buy together; every rule must share the same period */
    priceIds: ReadonlyArray<string>
    isTrial?: boolean
    planName?: string
    trialDays?: number
    isCustomPrice?: boolean
    paymentType?: PaymentType
    returnUrl?: string
    /**
     * Whether the bundle contains a service plan. Buying a plan is announced as a plan purchase
     * even when extra features ride along; buying features alone gets its own wording.
     */
    includesServicePlan?: boolean
}

interface ActivatePlanParams extends Omit<ActivateBundleParams, 'priceIds'> {
    priceId: string
}

export const useActivateSubscriptions = () => {
    const intl = useIntl()
    const { organization, employee, selectEmployee } = useOrganization()

    const ActivationErrorTitle = intl.formatMessage({ id: 'subscription.activation.errorTitle' })
    const ActivationErrorMessage = intl.formatMessage({ id: 'subscription.activation.error' })

    const [activateLoading, setActivateLoading] = useState<boolean>(false)

    const { data: pendingRequestsData, loading: pendingRequestsLoading, refetch: refetchPendingRequests } = useGetPendingSubscriptionRequestsQuery({
        variables: { organizationId: organization?.id },
        skip: !organization?.id,
    })

    const { data: activatedSubscriptionsData, loading: activatedSubscriptionsLoading, refetch: refetchActivatedSubscriptions } = useGetOrganizationActivatedSubscriptionsQuery({
        variables: {
            organizationId: organization?.id || '',
        },
        skip: !organization?.id,
    })

    const [registerSubscriptionContextMutation] = useRegisterSubscriptionContextsMutation()
    const [createUserHelpRequest] = useCreateUserHelpRequestMutation()
    const { user } = useAuth()

    const pendingRequests = pendingRequestsData?.pendingRequests || []
    const activatedSubscriptions = activatedSubscriptionsData?.activatedSubscriptions || []

    const showSuccessNotification = useCallback((
        isTrial: boolean,
        planName: string,
        trialDays: number,
        isCustomPrice: boolean,
        includesServicePlan: boolean
    ) => {
        if (isTrial) {
            notification.success({
                message: (
                    <Typography.Text strong size='large'>
                        {intl.formatMessage({ id: 'subscription.activation.trial.title' }, { planName })}
                    </Typography.Text>
                ),
                description: intl.formatMessage({ id: 'subscription.activation.trial.description' }, { planName, days: trialDays }),
                duration: 5,
            })
        } else if (isCustomPrice) {
            notification.success({
                message: (
                    <Typography.Text strong size='large'>
                        {intl.formatMessage({ id: 'subscription.activation.paid.custom.title' }, { planName })}
                    </Typography.Text>
                ),
                description: intl.formatMessage({ id: 'subscription.activation.paid.custom.description' }),
                duration: 5,
            })
        } else if (!includesServicePlan) {
            notification.success({
                message: (
                    <Typography.Text strong size='large'>
                        {intl.formatMessage({ id: 'subscription.activation.features.title' })}
                    </Typography.Text>
                ),
                description: intl.formatMessage({ id: 'subscription.activation.features.description' }),
                duration: 5,
            })
        } else {
            notification.success({
                message: (
                    <Typography.Text strong size='large'>
                        {intl.formatMessage({ id: 'subscription.activation.paid.standard.title' })}
                    </Typography.Text>
                ),
                description: intl.formatMessage({ id: 'subscription.activation.paid.standard.description' }),
                duration: 5,
            })
        }
    }, [intl])

    const refetchData = useCallback(async (isTrial: boolean) => {
        await refetchPendingRequests()
        if (isTrial) {
            await refetchActivatedSubscriptions()
            if (employee?.id) {
                await selectEmployee(employee.id)
            }
        }
    }, [refetchPendingRequests, refetchActivatedSubscriptions, employee?.id, selectEmployee])

    const registerSubscriptionBundle = useCallback(async ({
        priceIds,
        isTrial = true,
        planName = '',
        trialDays = 0,
        isCustomPrice = false,
        paymentType = 'card',
        returnUrl,
        includesServicePlan = true,
    }: ActivateBundleParams) => {
        if (!organization || priceIds.length === 0) return

        setActivateLoading(true)
        try {
            if (paymentType === 'userHelpRequest') {
                await createUserHelpRequest({
                    variables: {
                        data: {
                            dv: 1,
                            sender: getClientSideSenderInfo(),
                            type: UserHelpRequestTypeType.ActivateSubscription,
                            organization: { connect: { id: organization.id } },
                            subscriptionPlanPricingRule: { connect: { id: priceIds[0] } },
                            phone: user?.phone || '',
                        },
                    },
                })
            } else {
                const result = await registerSubscriptionContextMutation({
                    variables: {
                        data: {
                            dv: 1,
                            sender: getClientSideSenderInfo(),
                            organization: { id: organization.id },
                            subscriptionPlanPricingRules: priceIds.map(id => ({ id })),
                            paymentType: SubscriptionPaymentType.Card,
                            isTrial,
                        },
                    },
                })

                if (!isTrial && result.data?.result?.directPaymentUrl) {
                    let paymentUrl = result.data.result.directPaymentUrl
                    const finalReturnUrl = returnUrl || `${serverUrl}/settings?tab=subscription`
                    const returnUrlWithParams = new URL(finalReturnUrl)
                    returnUrlWithParams.searchParams.append('successPayment', 'true')
                    const url = new URL(paymentUrl)
                    url.searchParams.append('returnUrl', returnUrlWithParams.toString())
                    paymentUrl = url.toString()
                    window.open(paymentUrl, '_self')
                    return
                }
            }

            await refetchData(isTrial)
            showSuccessNotification(isTrial, planName, trialDays, isCustomPrice, includesServicePlan)
        } catch (error) {
            console.error('Failed to activate subscription:', error)
            notification.error({
                message: ActivationErrorTitle,
                description: error?.message || ActivationErrorMessage,
                duration: 5,
            })
        } finally {
            setActivateLoading(false)
        }
    }, [organization, user, registerSubscriptionContextMutation, createUserHelpRequest, refetchData, showSuccessNotification, ActivationErrorTitle, ActivationErrorMessage])

    const registerSubscriptionContext = useCallback(
        ({ priceId, ...rest }: ActivatePlanParams) => registerSubscriptionBundle({ priceIds: [priceId], ...rest }),
        [registerSubscriptionBundle]
    )

    return {
        registerSubscriptionContext,
        registerSubscriptionBundle,
        activateLoading,
        pendingRequests,
        activatedSubscriptions,
        isLoading: pendingRequestsLoading || activatedSubscriptionsLoading,
        refetchActivatedSubscriptions,
    }
}
