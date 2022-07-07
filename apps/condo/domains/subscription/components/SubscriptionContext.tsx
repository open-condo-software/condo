import React, { useContext, useEffect, useState, createContext } from 'react'
import Router, { useRouter } from 'next/router'
import { ServiceSubscription, SortServiceSubscriptionsBy } from '@app/condo/schema'
import { Modal, Typography } from 'antd'
import { useIntl } from '@core/next/intl'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import { Button } from '@condo/domains/common/components/Button'
import { hasFeature } from '@condo/domains/common/components/containers/FeatureFlag'
import { SUPPORT_EMAIL } from '@condo/domains/common/constants/requisites'
import { useOrganization } from '@core/next/organization'
import { ServiceSubscription as ServiceSubscriptionUtil } from '../utils/clientSchema'
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
    const { objs } = ServiceSubscriptionUtil.useNewObjects({
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

const ExpiredModal: React.FC = () => {
    const intl = useIntl()
    const ExpiredTitleMessage = intl.formatMessage({ id: 'subscription.modal.expired.title' })
    const ExpiredDescriptionPromptMessage = intl.formatMessage({ id: 'subscription.modal.expired.description.prompt' })
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
                <a href={`mailto:${SUPPORT_EMAIL}`}>
                    {SUPPORT_EMAIL}
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

const SubscriptionContextProvider: React.FC<ISubscriptionProviderProps> = ({ children }) => {
    const { subscription, isExpired, daysLeft, daysLeftHumanized } = useServiceSubscriptionLoader()
    const { route } = useRouter()

    useEffect(() => {
        if (isExpired && route !== '/settings') {
            Router.push('/settings')
        }
    }, [route, isExpired, subscription])

    if (!subscription) {
        return children
    }

    return (
        <SubscriptionContext.Provider value={{ subscription, isExpired, daysLeft, daysLeftHumanized }}>
            {isExpired && (
                <ExpiredModal/>
            )}
            {children}
        </SubscriptionContext.Provider>
    )
}

export const SubscriptionProvider: React.FC<ISubscriptionProviderProps> = ({ children }) => {
    const hasSubscriptionFeature = hasFeature('subscription')

    if (hasSubscriptionFeature) {
        return (
            <SubscriptionContextProvider>
                {children}
            </SubscriptionContextProvider>
        )
    }

    return children
}
