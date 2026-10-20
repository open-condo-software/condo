import { useCreateUserHelpRequestMutation, useGetPendingSubscriptionRequestsQuery } from '@app/condo/gql'
import { UserHelpRequestTypeType } from '@app/condo/schema'
import { notification } from 'antd'
import { useCallback } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'


export const useIndividualPriceRequest = () => {
    const intl = useIntl()
    const { user } = useAuth()
    const { organization } = useOrganization()

    const { data, refetch } = useGetPendingSubscriptionRequestsQuery({
        variables: { organizationId: organization?.id },
        skip: !organization?.id,
    })
    const [createUserHelpRequest, { loading }] = useCreateUserHelpRequestMutation()

    const requestedPlanIds = new Set(data?.pendingRequests?.map(request => request.subscriptionPlanPricingRule?.subscriptionPlan?.id))

    const requestIndividualPrice = useCallback(async (priceId: string, planName: string) => {
        try {
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
        } catch {
            notification.error({
                message: intl.formatMessage({ id: 'subscription.activation.errorTitle' }),
                description: intl.formatMessage({ id: 'subscription.activation.error' }),
            })
            return
        }

        await refetch()
        notification.success({
            message: intl.formatMessage({ id: 'subscription.activation.paid.custom.title' }, { planName }),
            description: intl.formatMessage({ id: 'subscription.activation.paid.custom.description' }),
        })
    }, [createUserHelpRequest, organization?.id, user?.phone, refetch, intl])

    return { requestIndividualPrice, requestedPlanIds, loading }
}
