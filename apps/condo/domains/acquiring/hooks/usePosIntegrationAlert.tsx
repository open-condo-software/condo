import { B2BAppContextStatusType } from '@app/condo/schema'
import { useCallback, useMemo, useState } from 'react'

import { useOrganization } from '@open-condo/next/organization'

import { IFrame } from '@condo/domains/miniapp/components/IFrame'
import { B2BAppContext } from '@condo/domains/miniapp/utils/clientSchema'

export function usePosIntegrationAlert () {
    const { organization } = useOrganization()

    const [isIFrameHidden, setIsIFrameHidden] = useState<boolean>(true)

    const onLoadHandler = useCallback(() => {
        setIsIFrameHidden(false)
    }, [])

    const {
        loading: isPosIntegrationAppContextsLoading,
        objs: posIntegrationAppContexts,
    } = B2BAppContext.useObjects({
        where: {
            status: B2BAppContextStatusType.Finished,
            organization: { id: organization.id },
            app: { posIntegrationConfig_is_null: false, deletedAt: null },
            deletedAt: null,
        },
    }, { skip: !organization?.id })

    const paymentsAlertPageUrl = posIntegrationAppContexts?.[0]?.app?.posIntegrationConfig?.paymentsAlertPageUrl

    const Component = useMemo(() => paymentsAlertPageUrl ? (
        <IFrame
            src={paymentsAlertPageUrl}
            onLoad={onLoadHandler}
            reloadScope='organization'
            withPrefetch
            withResize
            hidden={isIFrameHidden}
        />
    ) : null, [isIFrameHidden, onLoadHandler, paymentsAlertPageUrl])

    return {
        PosIntegrationAlert: Component,
        loading: isPosIntegrationAppContextsLoading || isIFrameHidden,
    }
}
