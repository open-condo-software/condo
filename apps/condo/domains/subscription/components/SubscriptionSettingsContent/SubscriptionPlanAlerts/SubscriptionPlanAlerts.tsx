import classnames from 'classnames'
import dayjs from 'dayjs'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Alert, Space, Tag, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import styles from './SubscriptionPlanAlerts.module.css'

import type { PlanAlert } from '@condo/domains/subscription/utils/subscriptionPlanAlerts'


const WARNING_ALERT_TYPES: ReadonlyArray<PlanAlert['type']> = ['invoicePending', 'trial']

type SubscriptionPlanAlertsProps = {
    alerts: ReadonlyArray<PlanAlert>
    activeIndex: number
    onChangeIndex: (index: number) => void
    onInvoiceAction: (alert: PlanAlert) => void
}

type PlanAlertBadgeProps = {
    alert: PlanAlert
}

/** The badge on top of the card follows the alert currently shown in the carousel */
export const PlanAlertBadge: React.FC<PlanAlertBadgeProps> = ({ alert }) => {
    const intl = useIntl()

    const badges: Record<PlanAlert['type'], { text: string, bgColor: string }> = {
        cardFailed: { text: intl.formatMessage({ id: 'subscription.planCard.badge.cardFailed' }), bgColor: colors.red[5] },
        invoiceExpired: { text: intl.formatMessage({ id: 'subscription.planCard.badge.invoiceExpired' }), bgColor: colors.red[5] },
        trialExpired: { text: intl.formatMessage({ id: 'subscription.planCard.badge.trialExpired' }), bgColor: colors.gray[7] },
        invoicePending: {
            text: intl.formatMessage({ id: 'subscription.planCard.badge.invoicePending' }, { days: alert.daysLeft }),
            bgColor: colors.orange[5],
        },
        trial: {
            text: intl.formatMessage({ id: 'subscription.planCard.badge.activeDays' }, { days: alert.daysLeft }),
            bgColor: colors.orange[5],
        },
    }
    const { text, bgColor } = badges[alert.type]

    return <Tag bgColor={bgColor} textColor={colors.white}>{text}</Tag>
}

const PlanAlertSlide: React.FC<{ alert: PlanAlert, isHidden: boolean, onInvoiceAction: (alert: PlanAlert) => void }> = ({ alert, isHidden, onInvoiceAction }) => {
    const intl = useIntl()

    const names = alert.planNames.map(name => `«${name}»`).join(', ')
    const date = alert.deadline ? dayjs(alert.deadline).format('D MMMM YYYY') : ''
    const scopedTitleId = (type: 'invoicePending' | 'invoiceExpired' | 'cardFailed') =>
        `subscription.planCard.alert.${type}.${alert.scope}.title` as FormatjsIntl.Message['ids']

    let title: string | null = null
    let description: string
    switch (alert.type) {
        case 'invoicePending':
            title = intl.formatMessage({ id: scopedTitleId('invoicePending') }, { names, date })
            description = intl.formatMessage({ id: 'subscription.planCard.alert.invoicePending.description' })
            break
        case 'invoiceExpired':
            title = intl.formatMessage({ id: scopedTitleId('invoiceExpired') }, { names })
            description = intl.formatMessage({ id: 'subscription.planCard.alert.invoiceExpired.description' })
            break
        case 'cardFailed':
            title = intl.formatMessage({ id: scopedTitleId('cardFailed') }, { names })
            description = intl.formatMessage({ id: 'subscription.planCard.alert.cardFailed.description' })
            break
        case 'trialExpired':
            title = intl.formatMessage({ id: 'subscription.planCard.alert.trialExpired.title' })
            description = intl.formatMessage({ id: 'subscription.planCard.alert.trialExpired.description' })
            break
        case 'trial':
            description = intl.formatMessage({ id: 'subscription.planCard.alert.trial.description' })
            break
    }

    // A pending invoice is asked for once more, an expired one is replaced by a new registration
    const body = (alert.type === 'invoiceExpired' || alert.type === 'invoicePending') && alert.priceIds.length > 0 ? (
        <Space size={4} direction='vertical'>
            {description}
            <Typography.Link size='small' onClick={() => onInvoiceAction(alert)}>
                {intl.formatMessage({ id: `subscription.planCard.alert.${alert.type}.action` })}
            </Typography.Link>
        </Space>
    ) : description

    return (
        <div className={classnames(styles.slide, { [styles.slideHidden]: isHidden })} aria-hidden={isHidden}>
            <Alert
                type={WARNING_ALERT_TYPES.includes(alert.type) ? 'warning' : 'error'}
                message={title ?? description}
                description={title ? body : undefined}
            />
        </div>
    )
}

export const SubscriptionPlanAlerts: React.FC<SubscriptionPlanAlertsProps> = ({ alerts, activeIndex, onChangeIndex, onInvoiceAction }) => {
    /** The card itself selects the plan, clicks inside the alerts must not do that */
    const stopSelection = useCallback((event: React.MouseEvent) => event.stopPropagation(), [])

    if (alerts.length === 0) return null

    return (
        <div onClick={stopSelection} role='presentation'>
            <div className={styles.slides}>
                {alerts.map((alert, index) => (
                    <PlanAlertSlide key={alert.key} alert={alert} isHidden={index !== activeIndex} onInvoiceAction={onInvoiceAction} />
                ))}
            </div>
            {alerts.length > 1 && (
                <div className={styles.dots}>
                    {alerts.map((alert, index) => (
                        <button
                            key={alert.key}
                            type='button'
                            aria-label={String(index + 1)}
                            className={classnames(styles.dot, { [styles.dotActive]: index === activeIndex })}
                            onClick={() => onChangeIndex(index)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
