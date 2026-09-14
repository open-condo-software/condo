import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import type { ListProps } from '@open-condo/ui'

import { useBillingAndAcquiringContexts } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'

export const useBillingSettingsIntegrationParameters = (): ListProps['dataSource'] => {
    const intl = useIntl()
    const { billingContexts, acquiringContexts } = useBillingAndAcquiringContexts()

    const SourceLabel = intl.formatMessage({ id: 'accrualsAndPayments.combined.settings.source' })
    const DestinationLabel = intl.formatMessage({ id: 'accrualsAndPayments.combined.settings.destination' })

    return useMemo(() => {
        const sourceValues: string[] = billingContexts
            .filter(context => billingContexts.length === 1 || !context?.integration?.isHidden)
            .map(context => context?.integration?.billingPageTitle || context?.integration?.name)
        const destinationValues: string[] = acquiringContexts
            .map(context => context?.integration?.name)

        return [
            {
                label: SourceLabel,
                value: sourceValues.length ? sourceValues.join(', ') : '-',
            },
            {
                label: DestinationLabel,
                value: destinationValues.length ? destinationValues.join(', ') : '-',
            },
        ]
    }, [DestinationLabel, SourceLabel, billingContexts, acquiringContexts])
}
