import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import type { ListProps } from '@open-condo/ui'

import { useBillingPartnerContexts } from '@condo/domains/billing/hooks/useBillingPartnerContexts'

function addUniqueValue (values: string[], nextValue?: string | null): void {
    if (!nextValue || values.includes(nextValue)) return

    values.push(nextValue)
}

export const useBillingSettingsIntegrationParameters = (): ListProps['dataSource'] => {
    const intl = useIntl()
    const {
        billingContexts,
        sppBillingContext,
        activePlatformPartnerContext,
    } = useBillingPartnerContexts()

    const SourceLabel = intl.formatMessage({ id: 'accrualsAndPayments.combined.settings.source' })
    const DestinationLabel = intl.formatMessage({ id: 'accrualsAndPayments.combined.settings.destination' })

    return useMemo(() => {
        const sourceValues: string[] = []
        const destinationValues: string[] = []
        const sppBillingId = sppBillingContext?.integration?.id
        const bankPartnerName = sppBillingContext?.integration?.billingPageTitle || sppBillingContext?.integration?.name
        const platformPartnerName = activePlatformPartnerContext?.integration?.name

        if (bankPartnerName) {
            addUniqueValue(sourceValues, bankPartnerName)
            addUniqueValue(destinationValues, intl.formatMessage(
                { id: 'accrualsAndPayments.combined.settings.destination.partnerBanks' },
                { partnerName: bankPartnerName },
            ))
        }

        billingContexts.forEach(({ integration }) => {
            const integrationId = integration?.id
            if (!integrationId || integrationId === sppBillingId) return

            addUniqueValue(sourceValues, integration?.name)
        })

        if (platformPartnerName) {
            addUniqueValue(destinationValues, intl.formatMessage(
                { id: 'accrualsAndPayments.combined.settings.destination.partner' },
                { partnerName: platformPartnerName },
            ))
        }

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
    }, [
        DestinationLabel,
        SourceLabel,
        activePlatformPartnerContext?.integration?.name,
        billingContexts,
        intl,
        sppBillingContext?.integration?.id,
        sppBillingContext?.integration?.billingPageTitle,
    ])
}
