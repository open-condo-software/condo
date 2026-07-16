import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Button } from '@open-condo/ui'

import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'


export const SetupTab: React.FC = () => {
    const router = useRouter()
    const intl = useIntl()

    const SetupIsNotCompletedTitle = intl.formatMessage({ id: 'pages.billing.setup.notCompleted.title' })
    const SetupIsNotCompletedMessage = intl.formatMessage({ id: 'pages.billing.setup.notCompleted.messsage' })
    const StartSetupTitle = intl.formatMessage({ id: 'pages.billing.setup.notCompleted.startButton.label' })

    return (
        <EmptyListContent
            image='/mascot/searching.webp'
            message={SetupIsNotCompletedMessage}
            label={SetupIsNotCompletedTitle}
            createLabel={StartSetupTitle}
            button={
                <Button type='primary' onClick={() => router.push('/billing/setup?step=0')}>
                    {StartSetupTitle}
                </Button>
            }
        />
    )
}
