import getConfig from 'next/config'
import React from 'react'

import { ExternalLink } from '@open-condo/icons'
import { useIntl } from '@open-condo/next/intl'
import { Space, Typography } from '@open-condo/ui'

import { withAnimatedNumber } from '@condo/domains/subscription/components/AnimatedNumber/AnimatedNumber'

import styles from './SubscriptionPlanSummary.module.css'

import type { CatalogCounters } from '@condo/domains/subscription/utils/subscriptionCatalog'


const { publicRuntimeConfig: { subscriptionComparisonTableUrl } } = getConfig()

type SubscriptionPlanSummaryProps = {
    planName: string
    counters: CatalogCounters
}

/**
 * The line tying the plan cards to the table below them. Both numbers are counted off the very
 * rows the table renders, so picking another plan card visibly re-counts what that plan gives.
 */
export const SubscriptionPlanSummary: React.FC<SubscriptionPlanSummaryProps> = ({ planName, counters }) => {
    const intl = useIntl()
    const ComparisonTableMessage = intl.formatMessage({ id: 'subscription.plansPage.comparisonTable' })

    const includedText = intl.formatMessage(
        { id: 'subscription.plansPage.includedFeatures' },
        { count: counters.included, planName }
    )
    const availableText = intl.formatMessage(
        { id: 'subscription.plansPage.availableFeatures' },
        { count: counters.available }
    )

    return (
        <div className={styles.summary}>
            <div>
                <Typography.Title level={4}>
                    {withAnimatedNumber(includedText, counters.included)}
                </Typography.Title>
                {counters.available > 0 && (
                    <Typography.Title level={4} type='secondary'>
                        {withAnimatedNumber(availableText, counters.available)}
                    </Typography.Title>
                )}
            </div>
            {subscriptionComparisonTableUrl && (
                <Typography.Link
                    href={subscriptionComparisonTableUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    id='subscription-comparison-table-link'
                >
                    <Space size={4} direction='horizontal' align='center'>
                        {ComparisonTableMessage}
                        <ExternalLink size='small' />
                    </Space>
                </Typography.Link>
            )}
        </div>
    )
}
