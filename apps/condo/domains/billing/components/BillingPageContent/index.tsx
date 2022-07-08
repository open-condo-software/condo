import React, { CSSProperties } from 'react'
import { useIntl } from '@core/next/intl'
import { EmptyListView, BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Typography } from 'antd'
import { Loader } from '@condo/domains/common/components/Loader'
import {
    CONTEXT_IN_PROGRESS_STATUS,
    CONTEXT_ERROR_STATUS,
} from '@condo/domains/miniapp/constants'
import { ApolloError } from '@apollo/client'
import { useTracking } from '@condo/domains/common/components/TrackingContext'
import {
    IBillingIntegrationOrganizationContextUIState,
} from '@condo/domains/billing/utils/clientSchema/BillingIntegrationOrganizationContext'
import { MainContent } from './MainContent'
import { BillingIntegrationOrganizationContext } from '@app/condo/schema'

const BILLING_SETTINGS_ROUTE = '/miniapps?tab=billing'

interface IBillingPageContentProps {
    access: boolean,
    contextLoading: boolean,
    contextError: string | ApolloError
    context: BillingIntegrationOrganizationContext
}

export interface IContextProps {
    context: BillingIntegrationOrganizationContext
}

const BIG_DINO_STYLE: CSSProperties = { height: 200 }

export const BillingPageContent: React.FC<IBillingPageContentProps> = ({ access, contextLoading, contextError, context }) => {
    const intl = useIntl()
    const NoPermissionsMessage = intl.formatMessage({ id: 'NoPermissionToPage' })
    const NoBillingTitle = intl.formatMessage({ id: 'pages.billing.NoBilling.title' })
    const NoBillingMessage = intl.formatMessage({ id: 'pages.billing.NoBilling.message' })
    const NoBillingActionLabel = intl.formatMessage({ id: 'pages.billing.NoBilling.button' })
    const ConnectionInProgressMessage = intl.formatMessage({ id:'ConnectionInProgress' })
    const WillBeReadySoonMessage = intl.formatMessage({ id: 'WillBeReadySoon' })
    const ErrorOccurredMessage = intl.formatMessage({ id: 'ErrorOccurred' })
    const CompanyName = intl.formatMessage({ id: 'CompanyName' })
    const ConnectSupportMessage = intl.formatMessage({ id: 'ErrorHappenedDuringIntegration' }, {
        company: CompanyName,
    })

    const { logEvent } = useTracking()

    if (!access) {
        logEvent({ eventName: 'BillingPageAccessError', denyDuplicates: true })

        return (
            <BasicEmptyListView>
                <Typography.Title level={3}>
                    {NoPermissionsMessage}
                </Typography.Title>
            </BasicEmptyListView>
        )
    }

    if (contextLoading) {
        return (
            <Loader fill size={'large'}/>
        )
    }

    if (contextError) {
        return (
            <BasicEmptyListView>
                <Typography.Title level={3}>
                    {contextError}
                </Typography.Title>
            </BasicEmptyListView>
        )
    }

    if (!context) {
        logEvent({ eventName: 'BillingPageEmpty', denyDuplicates: true })
        return (
            <EmptyListView
                label={NoBillingTitle}
                message={NoBillingMessage}
                createRoute={BILLING_SETTINGS_ROUTE}
                createLabel={NoBillingActionLabel}
            />
        )
    }

    if (context.status === CONTEXT_IN_PROGRESS_STATUS) {
        logEvent({ eventName: 'BillingPageInProgressStatus', denyDuplicates: true })
        return (
            <BasicEmptyListView image={'/dino/waiting.png'} imageStyle={BIG_DINO_STYLE} spaceSize={16}>
                <Typography.Title level={3}>
                    {ConnectionInProgressMessage}
                </Typography.Title>
                <Typography.Text type={'secondary'}>
                    {WillBeReadySoonMessage}
                </Typography.Text>
            </BasicEmptyListView>
        )
    }

    if (context.status === CONTEXT_ERROR_STATUS) {
        logEvent({ eventName: 'BillingPageErrorStatus', denyDuplicates: true })
        return (
            <BasicEmptyListView image={'/dino/fail.png'} imageStyle={BIG_DINO_STYLE} spaceSize={16}>
                <Typography.Title level={3}>
                    {ErrorOccurredMessage}
                </Typography.Title>
                <Typography.Text type={'secondary'}>
                    {ConnectSupportMessage}
                </Typography.Text>
            </BasicEmptyListView>
        )
    }

    return (
        <MainContent context={context}/>
    )
}
