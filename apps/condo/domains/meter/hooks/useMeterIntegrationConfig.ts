import { useGetB2BAppContextWithMeterIntegrationConfigQuery } from '@app/condo/gql'

import { useOrganization } from '@open-condo/next/organization'

/**
 * Returns whether the current organization has at least one connected B2BApp
 * with a meterIntegrationConfig (i.e. meter reading validation is active).
 *
 * Mirrors the server-side check in validateMeterReadingWithIntegration:
 * B2BAppContext { organization, app.meterIntegrationConfig_is_null: false, status: Finished }
 */
export function useMeterIntegrationConfig (): { hasMeterIntegration: boolean, loading: boolean } {
    const { organization } = useOrganization()
    const organizationId = organization?.id

    const { data, loading } = useGetB2BAppContextWithMeterIntegrationConfigQuery({
        variables: { organizationId: organizationId || '' },
        skip: !organizationId,
    })

    const hasMeterIntegration = Boolean(data?.contexts?.length)

    return { hasMeterIntegration, loading }
}
