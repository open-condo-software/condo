import React, { useEffect, useState } from 'react'
import Router, { useRouter } from 'next/router'
import { ServiceSubscription } from '../../../schema'
import { Modal, Typography } from 'antd'
import { useIntl } from '@core/next/intl'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'
import { Button } from '@condo/domains/common/components/Button'
import { useServiceSubscription } from '../hooks/useServiceSubscription'

dayjs.extend(relativeTime)
dayjs.extend(duration)

const SubscriptionContext = React.createContext({})

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

interface ISubscriptionProvider {
    organizationId: number
    children: JSX.Element
}

export const SubscriptionProvider: React.FC<ISubscriptionProvider> = ({ organizationId, children }) => {
    const { subscription, isExpired } = useServiceSubscription()
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
        <SubscriptionContext.Provider value={subscription}>
            {isExpired && (
                <ExpiredModal subscription={subscription}/>
            )}
            {children}
        </SubscriptionContext.Provider>
    )
}