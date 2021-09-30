import React, { useContext, useEffect, useState, createContext } from 'react'
import Router, { useRouter } from 'next/router'
import { ServiceSubscription, SortServiceSubscriptionsBy } from '../../../schema'
import { Modal, Typography } from 'antd'
import { useIntl } from '@core/next/intl'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import { Button } from '@condo/domains/common/components/Button'
import { useOrganization } from '@core/next/organization'
import { useObjects } from '../utils/clientSchema/ServiceSubscription'
import { get } from 'lodash'
import { isExpired } from '../utils/helpers'

dayjs.extend(relativeTime)
dayjs.extend(duration)

interface ISubscriptionContext {
    subscription?: ServiceSubscription
    daysLeft?: number
    daysLeftHumanized?: string
    isExpired?: boolean
}

const SubscriptionContext = createContext<ISubscriptionContext>({})

export const useServiceSubscriptionContext = () => useContext(SubscriptionContext)

const useServiceSubscriptionLoader = (): ISubscriptionContext => {
    const { organization } = useOrganization()
    const { objs } = useObjects({
        where: {
            organization: { id: get(organization, 'id') },
        },
        sortBy: [SortServiceSubscriptionsBy.StartAtDesc],
    }, {
        fetchPolicy: 'network-only',
    })
    const subscription = objs[0]
    if (!subscription) {
        return {}
    }
    const daysLeftDuration = dayjs.duration(dayjs(subscription.finishAt).diff(dayjs()))
    const daysLeft = Math.ceil(daysLeftDuration.asDays())
    const daysLeftHumanized = daysLeftDuration.humanize()
    return {
        subscription,
        daysLeft,
        daysLeftHumanized,
        isExpired: isExpired(subscription),
    }
}

interface IExpiredModal {
    subscription: ServiceSubscription
}

const ExpiredModal: React.FC<IExpiredModal> = ({ subscription }) => {
    const intl = useIntl()
    const ExpiredTitleMessage = intl.formatMessage({ id: 'subscription.modal.expired.title' })
    const ExpiredDescriptionPromptMessage = intl.formatMessage({ id: 'subscription.modal.expired.description.prompt' })
    const ExpiredDescriptionLinkMessage = intl.formatMessage({ id: 'subscription.modal.expired.description.link' })
    const ExpiredDescriptionPhoneMessage = intl.formatMessage({ id: 'subscription.modal.expired.description.phone' })
    const OKMessage = intl.formatMessage({ id: 'OK' })

    const [visible, setVisible] = useState(true)

    return (
        <Modal
            title={ExpiredTitleMessage}
            visible={visible}
            footer={[
                <Button key="submit" type='sberPrimary' onClick={() => setVisible(false)}>
                    {OKMessage}
                </Button>,
            ]}
        >
            <Typography.Paragraph>
                {ExpiredDescriptionPromptMessage}<br/>
                <a href={`mailto:${ExpiredDescriptionLinkMessage}`}>
                    {ExpiredDescriptionLinkMessage}
                </a>
                <br/>
                <a href={`tel:${ExpiredDescriptionPhoneMessage.replace(' ', '')}`}>
                    {ExpiredDescriptionPhoneMessage}
                </a>
            </Typography.Paragraph>
        </Modal>
    )
}

interface ISubscriptionProviderProps {
    children: JSX.Element
}

export const SubscriptionProvider: React.FC<ISubscriptionProviderProps> = ({ children }) => {
    const { subscription, isExpired, daysLeft, daysLeftHumanized } = useServiceSubscriptionLoader()
    const { route } = useRouter()
    useEffect(() => {
        if (isExpired && route !== '/settings') {
            Router.push('/settings')
        }
    }, [route, isExpired])
    if (!subscription) {
        return children
    }
    return (
        <SubscriptionContext.Provider value={{ subscription, isExpired, daysLeft, daysLeftHumanized }}>
            {isExpired && (
                <ExpiredModal subscription={subscription}/>
            )}
            {children}
        </SubscriptionContext.Provider>
    )
}