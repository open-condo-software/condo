import { useGetB2BAppContextWithPosIntegrationConfigQuery } from '@app/condo/gql'
import { useCallback, useMemo, useState } from 'react'

import { useOrganization } from '@open-condo/next/organization'

import { IFrame } from '@condo/domains/miniapp/components/IFrame'

export function usePosIntegrationAlert () {
    const { organization } = useOrganization()

    const [isIFrameHidden, setIsIFrameHidden] = useState<boolean>(true)

    const onLoadHandler = useCallback(() => {
        setIsIFrameHidden(false)
    }, [])

    const {
        loading: areB2bAppContextsLoading,
        data: b2bAppContextsResult,
    } = useGetB2BAppContextWithPosIntegrationConfigQuery(
        {
            variables: { organizationId: organization.id },
            skip: !organization?.id,
        },
    )

    const paymentsAlertPageUrl = b2bAppContextsResult?.contexts?.[0]?.app?.posIntegrationConfig?.paymentsAlertPageUrl

    const Component = useMemo(() => paymentsAlertPageUrl ? (
        <IFrame
            src={paymentsAlertPageUrl}
            onLoad={onLoadHandler}
            reloadScope='organization'
            withPrefetch
            withResize
            hidden={isIFrameHidden}
            initialHeight={50}
        />
    ) : null, [isIFrameHidden, onLoadHandler, paymentsAlertPageUrl])

    return {
        PosIntegrationAlert: Component,
        loading: areB2bAppContextsLoading || (paymentsAlertPageUrl ? isIFrameHidden : false),
    }
}
