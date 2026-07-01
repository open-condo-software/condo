import { useRouter } from 'next/router'
import React from 'react'

import { Button } from '@open-condo/ui'

import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'


export const SetupTab: React.FC = () => {
    const router = useRouter()
    const SetupIsNotCompletedTitle = 'Пока платежей и начислений нет'
    const SetupIsNotCompletedMessage = 'Настройте раздел'
    const StartSetupTitle = 'Настроить раздел'

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
