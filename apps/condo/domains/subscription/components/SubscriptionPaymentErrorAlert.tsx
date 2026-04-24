import { useGetLastFailedPaymentContextQuery } from '@app/condo/gql'
import getConfig from 'next/config'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Alert, Typography, Space } from '@open-condo/ui'

import { SUBSCRIPTION_CONTEXT_STATUS } from '@condo/domains/subscription/constants'


const { publicRuntimeConfig: { HelpRequisites } } = getConfig()

interface SubscriptionPaymentErrorAlertProps {
    subscriptionPlanId: string
}

export const SubscriptionPaymentErrorAlert: React.FC<SubscriptionPaymentErrorAlertProps> = ({
    subscriptionPlanId,
}) => {
    const intl = useIntl()
    const { organization } = useOrganization()

    const ErrorTitle = intl.formatMessage({ id: 'subscription.paymentError.title' })
    const ErrorMessage = intl.formatMessage({ id: 'subscription.paymentError.message' })
    const ContactSupportLink = intl.formatMessage({ id: 'subscription.paymentError.contactSupport' })

    const { data, loading } = useGetLastFailedPaymentContextQuery({
        variables: {
            organizationId: organization?.id,
            subscriptionPlanId,
        },
        skip: !organization?.id || !subscriptionPlanId,
    })

    const hasFailedPayment = useMemo(() => {
        if (!data?.lastFailedContext || data.lastFailedContext.length === 0) {
            return false
        }

        const context = data.lastFailedContext[0]
        return context.status === SUBSCRIPTION_CONTEXT_STATUS.ERROR || context.status === SUBSCRIPTION_CONTEXT_STATUS.PENDING
    }, [data])

    if (loading || !hasFailedPayment) {
        return null
    }

    const supportEmail = HelpRequisites?.support_email || HelpRequisites?.email

    return (
        <Alert
            type='error'
            showIcon
            message={ErrorTitle}
            description={
                <Space direction='vertical' size={4}>
                    <Typography.Paragraph size='medium'>
                        {ErrorMessage}
                    </Typography.Paragraph>
                    {supportEmail && (
                        <Typography.Link size='large' href={`mailto:${supportEmail}`}>
                            {ContactSupportLink}
                        </Typography.Link>
                    )}
                </Space>
            }
        />
    )
}
