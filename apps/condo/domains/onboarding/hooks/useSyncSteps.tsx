import { useEffect, useState } from 'react'

import { useApolloClient } from '@open-condo/next/apollo'

import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { SYNC_TOUR_STEPS_MUTATION } from '@condo/domains/onboarding/gql'


export const useSyncSteps = ({ refetchSteps, organizationId }) => {
    const [loading, setLoading] = useState(true)

    const client = useApolloClient()

    useEffect(() => {
        if (!organizationId) return

        setLoading(true)

        client.mutate({
            mutation: SYNC_TOUR_STEPS_MUTATION,
            variables: {
                data: {
                    organization: { id: organizationId },
                    dv: 1,
                    sender: getClientSideSenderInfo(),
                },
            },
        })
            .then(() => refetchSteps())
            .then(() => setLoading(false))
    }, [organizationId])

    return loading
}