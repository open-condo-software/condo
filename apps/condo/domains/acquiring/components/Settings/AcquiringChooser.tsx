import React from 'react'
import { useIntl } from '@core/next/intl'
import { AcquiringIntegration, AcquiringIntegrationContext } from '@condo/domains/acquiring/utils/clientSchema'


import { IntegrationChooser } from '@condo/domains/billing/components/Settings/IntegrationChooser'

export const AcquiringChooser: React.FC = () => {
    const intl = useIntl()

    const OneAcquiringWarningMessage = intl.formatMessage({ id: 'OneAcquiringWarning' })

    // TODO (DOMA-2232) Either implement STATUS logic in AcquiringIntegrationContext or drop it!
    return <IntegrationChooser
        integrationModel={AcquiringIntegration}
        integrationContextModel={AcquiringIntegrationContext}
        integrationMessages={{
            'oneIntegrationWarningMessage': OneAcquiringWarningMessage,
        }}
        integrationPanelUrlPrefix='acquiring'
    />
}
