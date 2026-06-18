import getConfig from 'next/config'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import type { ListProps } from '@open-condo/ui'

import { CONTEXT_FINISHED_STATUS as ACQUIRING_CONTEXT_FINISHED_STATUS } from '@condo/domains/acquiring/constants/context'
import { ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE } from '@condo/domains/acquiring/constants/integration'
import { useBillingAndAcquiringContexts } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'

const { publicRuntimeConfig: { sppConfig } } = getConfig()

function addUniqueValue (values: string[], nextValue?: string | null): void {
    if (!nextValue || values.includes(nextValue)) return

    values.push(nextValue)
}

export const useBillingSettingsIntegrationParameters = (): ListProps['dataSource'] => {
    const intl = useIntl()
    const { billingContexts, acquiringContexts } = useBillingAndAcquiringContexts()

    const SourceLabel = intl.formatMessage({ id: 'accrualsAndPayments.combined.settings.source' })
    const DestinationLabel = intl.formatMessage({ id: 'accrualsAndPayments.combined.settings.destination' })
    const BankPartnerLabel = intl.formatMessage({ id: 'accrualsAndPayments.combined.bankPartner.label' as FormatjsIntl.Message['ids'] })
    const BankPartnerDestinationLabel = intl.formatMessage({ id: 'accrualsAndPayments.combined.settings.destination.bankPartner' as FormatjsIntl.Message['ids'] })
    const PlatformPartnerDestinationLabel = intl.formatMessage({ id: 'accrualsAndPayments.combined.settings.destination.platformPartner' as FormatjsIntl.Message['ids'] })

    return useMemo(() => {
        const sppBillingId = sppConfig?.BillingIntegrationId || null
        const hasBankPartnerContext = billingContexts.some(({ integration }) => integration?.id === sppBillingId)
        const platformPartnerContext = acquiringContexts.find(({ integration }) => integration?.type === ACQUIRING_INTEGRATION_ONLINE_PROCESSING_TYPE)
        const hasFinishedPlatformPartnerContext = platformPartnerContext?.status === ACQUIRING_CONTEXT_FINISHED_STATUS

        const sourceValues: string[] = []
        const destinationValues: string[] = []

        if (hasBankPartnerContext) {
            addUniqueValue(sourceValues, BankPartnerLabel)
            addUniqueValue(destinationValues, BankPartnerDestinationLabel)
        }

        billingContexts.forEach(({ integration }) => {
            const integrationId = integration?.id
            if (!integrationId || integrationId === sppBillingId) return

            addUniqueValue(sourceValues, integration?.name)
        })

        if (hasFinishedPlatformPartnerContext) {
            addUniqueValue(destinationValues, PlatformPartnerDestinationLabel)
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
        BankPartnerDestinationLabel,
        BankPartnerLabel,
        DestinationLabel,
        PlatformPartnerDestinationLabel,
        SourceLabel,
        acquiringContexts,
        billingContexts,
    ])
}
