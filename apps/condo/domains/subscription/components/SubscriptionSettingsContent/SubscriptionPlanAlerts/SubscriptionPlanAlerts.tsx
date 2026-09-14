import classnames from 'classnames'
import dayjs from 'dayjs'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Tag, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import styles from './SubscriptionPlanAlerts.module.css'

import type { PlanAlert } from '@condo/domains/subscription/utils/subscriptionPlanAlerts'


const WARNING_ALERT_TYPES: ReadonlyArray<PlanAlert['type']> = ['invoicePending', 'trial']

type SubscriptionPlanAlertsProps = {
    alerts: ReadonlyArray<PlanAlert>
    activeIndex: number
    onChangeIndex: (index: number) => void
    onReissueInvoice: (alert: PlanAlert) => void
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

const PlanAlertSlide: React.FC<{ alert: PlanAlert, isHidden: boolean, onReissueInvoice: (alert: PlanAlert) => void }> = ({ alert, isHidden, onReissueInvoice }) => {
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

    const background = WARNING_ALERT_TYPES.includes(alert.type) ? colors.orange[1] : colors.red[1]

    return (
        <div className={classnames(styles.slide, { [styles.slideHidden]: isHidden })} style={{ background }} aria-hidden={isHidden}>
            {title && <Typography.Text strong>{title}</Typography.Text>}
            <Typography.Text size='small' type='secondary'>{description}</Typography.Text>
            {alert.type === 'invoiceExpired' && alert.priceIds.length > 0 && (
                <Typography.Link size='small' onClick={() => onReissueInvoice(alert)}>
                    {intl.formatMessage({ id: 'subscription.planCard.alert.invoiceExpired.action' })}
                </Typography.Link>
            )}
        </div>
    )
}

export const SubscriptionPlanAlerts: React.FC<SubscriptionPlanAlertsProps> = ({ alerts, activeIndex, onChangeIndex, onReissueInvoice }) => {
    /** The card itself selects the plan, clicks inside the alerts must not do that */
    const stopSelection = useCallback((event: React.MouseEvent) => event.stopPropagation(), [])

    if (alerts.length === 0) return null

    return (
        <div onClick={stopSelection} role='presentation'>
            <div className={styles.slides}>
                {alerts.map((alert, index) => (
                    <PlanAlertSlide key={alert.key} alert={alert} isHidden={index !== activeIndex} onReissueInvoice={onReissueInvoice} />
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
