import { useGetOrganizationTrialSubscriptionsQuery } from '@app/condo/gql'

import { useOrganization } from '@open-condo/next/organization'

export const useTrialSubscriptions = () => {
    const { organization } = useOrganization()

    const {
        data: trialSubscriptionsData,
        loading: trialSubscriptionsLoading,
        refetch: refetchTrialSubscriptions,
    } = useGetOrganizationTrialSubscriptionsQuery({
        variables: {
            organizationId: organization?.id,
        },
        skip: !organization?.id,
    })

    const trialSubscriptions = trialSubscriptionsData?.trialSubscriptions || []

    return {
        trialSubscriptions,
        isLoading: trialSubscriptionsLoading,
        refetch: refetchTrialSubscriptions,
    }
}
