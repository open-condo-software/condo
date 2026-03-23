import { useGetPendingSubscriptionRequestsQuery, useGetOrganizationActivatedSubscriptionsQuery, useRegisterSubscriptionContextMutation, useCreateUserHelpRequestMutation } from '@app/condo/gql'
import { UserHelpRequestTypeType } from '@app/condo/schema'
import { notification } from 'antd'
import { useCallback, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { type PaymentType } from '@condo/domains/subscription/hooks/useSubscriptionPaymentModal'


interface ActivatePlanParams {
    priceId: string
    isTrial?: boolean
    planName?: string
    trialDays?: number
    isCustomPrice?: boolean
    paymentType?: PaymentType
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

    const [registerSubscriptionContextMutation] = useRegisterSubscriptionContextMutation()
    const [createUserHelpRequest] = useCreateUserHelpRequestMutation()
    const { user } = useAuth()

    const pendingRequests = pendingRequestsData?.pendingRequests || []
    const activatedSubscriptions = activatedSubscriptionsData?.activatedSubscriptions || []

    const showSuccessNotification = useCallback((isTrial: boolean, planName: string, trialDays: number, isCustomPrice: boolean) => {
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

    const registerSubscriptionContext = useCallback(async ({ priceId, isTrial = true, planName = '', trialDays = 0, isCustomPrice = false, paymentType = 'card' }: ActivatePlanParams) => {
        if (!organization) return

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
                            subscriptionPlanPricingRule: { connect: { id: priceId } },
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
                            subscriptionPlanPricingRule: { id: priceId },
                            isTrial,
                        },
                    },
                })

                if (!isTrial && result.data?.result?.directPaymentUrl) {
                    window.open(result.data.result.directPaymentUrl, '_self')
                    return
                }
            }

            await refetchData(isTrial)
            showSuccessNotification(isTrial, planName, trialDays, isCustomPrice)
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

    return {
        registerSubscriptionContext,
        activateLoading,
        pendingRequests,
        activatedSubscriptions,
        isLoading: pendingRequestsLoading || activatedSubscriptionsLoading,
        refetchActivatedSubscriptions,
    }
}
