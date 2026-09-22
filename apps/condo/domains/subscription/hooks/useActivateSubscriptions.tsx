import { useGetOrganizationActivatedSubscriptionsQuery, useRegisterSubscriptionContextsMutation } from '@app/condo/gql'
import { SubscriptionPaymentType } from '@app/condo/schema'
import { notification } from 'antd'
import getConfig from 'next/config'
import { useCallback, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
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
    paymentType?: PaymentType
    returnUrl?: string
    /**
     * Whether the bundle contains a service plan. Buying a plan is announced as a plan purchase
     * even when extra features ride along; buying features alone gets its own wording.
     */
    includesServicePlan?: boolean
    /** Set to false when the caller announces the result itself */
    notify?: boolean
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

    const { data: activatedSubscriptionsData, loading: activatedSubscriptionsLoading, refetch: refetchActivatedSubscriptions } = useGetOrganizationActivatedSubscriptionsQuery({
        variables: {
            organizationId: organization?.id || '',
        },
        skip: !organization?.id,
    })

    const [registerSubscriptionContextMutation] = useRegisterSubscriptionContextsMutation()

    const activatedSubscriptions = activatedSubscriptionsData?.activatedSubscriptions || []

    const showSuccessNotification = useCallback((
        isTrial: boolean,
        planName: string,
        trialDays: number,
        includesServicePlan: boolean,
        paymentType: PaymentType
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
        } else if (!includesServicePlan && paymentType !== 'invoice') {
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
        if (isTrial) {
            await refetchActivatedSubscriptions()
            if (employee?.id) {
                await selectEmployee(employee.id)
            }
        }
    }, [refetchActivatedSubscriptions, employee?.id, selectEmployee])

    const registerSubscriptionBundle = useCallback(async ({
        priceIds,
        isTrial = true,
        planName = '',
        trialDays = 0,
        paymentType = 'card',
        returnUrl,
        includesServicePlan = true,
        notify = true,
    }: ActivateBundleParams): Promise<boolean> => {
        if (!organization || priceIds.length === 0) return false

        setActivateLoading(true)
        try {
            const result = await registerSubscriptionContextMutation({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        organization: { id: organization.id },
                        subscriptionPlanPricingRules: priceIds.map(id => ({ id })),
                        paymentType: paymentType === 'invoice' ? SubscriptionPaymentType.Invoice : SubscriptionPaymentType.Card,
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
                return true
            }

            await refetchData(isTrial)
            if (notify) showSuccessNotification(isTrial, planName, trialDays, includesServicePlan, paymentType)
            return true
        } catch (error) {
            console.error('Failed to activate subscription:', error)
            notification.error({
                message: ActivationErrorTitle,
                description: error?.message || ActivationErrorMessage,
                duration: 5,
            })
            return false
        } finally {
            setActivateLoading(false)
        }
    }, [organization, registerSubscriptionContextMutation, refetchData, showSuccessNotification, ActivationErrorTitle, ActivationErrorMessage])

    const registerSubscriptionContext = useCallback(
        ({ priceId, ...rest }: ActivatePlanParams) => registerSubscriptionBundle({ priceIds: [priceId], ...rest }),
        [registerSubscriptionBundle]
    )

    return {
        registerSubscriptionContext,
        registerSubscriptionBundle,
        activateLoading,
        activatedSubscriptions,
        isLoading: activatedSubscriptionsLoading,
        refetchActivatedSubscriptions,
    }
}
