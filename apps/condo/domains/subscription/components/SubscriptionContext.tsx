import React, { useState } from 'react'
import { ServiceSubscription } from '../../../schema'
import { isExpired } from '../utils/helpers'
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
    const { subscription } = useServiceSubscription()
    if (!subscription) {
        return children
    }
    return (
        <SubscriptionContext.Provider value={subscription}>
            {isExpired(subscription) && (
                <ExpiredModal subscription={subscription}/>
            )}
            {children}
        </SubscriptionContext.Provider>
    )
}