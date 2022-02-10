import React from 'react'
import { useIntl } from '@core/next/intl'
import { BillingIntegration, BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'

import { IntegrationChooser } from './IntegrationChooser'

export const BillingChooser: React.FC = () => {
    const intl = useIntl()

    const OneBillingWarningMessage = intl.formatMessage({ id: 'OneBillingWarning' })
    
    return <IntegrationChooser
        integrationModel={BillingIntegration}
        integrationContextModel={BillingIntegrationOrganizationContext}
        integrationMessages={{
            'oneIntegrationWarningMessage': OneBillingWarningMessage,
        }}
    />
}