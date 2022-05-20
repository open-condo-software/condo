import React, { CSSProperties } from 'react'
import { useIntl } from '@core/next/intl'
import { EmptyListView, BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Typography } from 'antd'
import { Loader } from '@condo/domains/common/components/Loader'
import {
    CONTEXT_IN_PROGRESS_STATUS,
    CONTEXT_ERROR_STATUS,
} from '@condo/domains/miniapp/constants'
import { BILLING_TRACKING_EVENTS } from '@condo/domains/billing/constants/constants'
import { ApolloError } from '@apollo/client'
import { TrackingComponentLoadEvent, TrackingPageState } from '@condo/domains/common/components/TrackingContext'
import { IBillingIntegrationOrganizationContextUIState } from '../../utils/clientSchema/BillingIntegrationOrganizationContext'
import { MainContent } from './MainContent'

const BILLING_SETTINGS_ROUTE = '/miniapps?tab=billing'

interface IBillingPageContentProps {
    access: boolean,
    contextLoading: boolean,
    contextError: string | ApolloError
    context: IBillingIntegrationOrganizationContextUIState
}

export interface IContextProps {
    context: IBillingIntegrationOrganizationContextUIState
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

    if (!access) {
        return (
            <TrackingComponentLoadEvent
                eventType={BILLING_TRACKING_EVENTS.BILLING_VISIT_INDEX_PAGE}
                pageState={TrackingPageState.AccessError}
            >
                <BasicEmptyListView>
                    <Typography.Title level={3}>
                        {NoPermissionsMessage}
                    </Typography.Title>
                </BasicEmptyListView>
            </TrackingComponentLoadEvent>
        )
    }

    if (contextLoading) {
        return (
            <Loader fill size={'large'}/>
        )
    }

    if (contextError) {
        return (
            <TrackingComponentLoadEvent
                eventType={BILLING_TRACKING_EVENTS.BILLING_VISIT_INDEX_PAGE}
                pageState={TrackingPageState.Error}
            >
                <BasicEmptyListView>
                    <Typography.Title level={3}>
                        {contextError}
                    </Typography.Title>
                </BasicEmptyListView>
            </TrackingComponentLoadEvent>
        )
    }

    if (!context) {
        return (
            <TrackingComponentLoadEvent
                eventType={BILLING_TRACKING_EVENTS.BILLING_VISIT_INDEX_PAGE}
                pageState={TrackingPageState.Empty}
            >
                <EmptyListView
                    label={NoBillingTitle}
                    message={NoBillingMessage}
                    createRoute={BILLING_SETTINGS_ROUTE}
                    createLabel={NoBillingActionLabel}
                />
            </TrackingComponentLoadEvent>
        )
    }

    if (context.status === CONTEXT_IN_PROGRESS_STATUS) {
        return (
            <TrackingComponentLoadEvent
                eventType={BILLING_TRACKING_EVENTS.BILLING_VISIT_INDEX_PAGE}
                pageState={TrackingPageState.InProgress}
            >
                <BasicEmptyListView image={'/dino/waiting.png'} imageStyle={BIG_DINO_STYLE} spaceSize={16}>
                    <Typography.Title level={3}>
                        {ConnectionInProgressMessage}
                    </Typography.Title>
                    <Typography.Text type={'secondary'}>
                        {WillBeReadySoonMessage}
                    </Typography.Text>
                </BasicEmptyListView>
            </TrackingComponentLoadEvent>
        )
    }

    if (context.status === CONTEXT_ERROR_STATUS) {
        return (
            <TrackingComponentLoadEvent
                eventType={BILLING_TRACKING_EVENTS.BILLING_VISIT_INDEX_PAGE}
                pageState={TrackingPageState.Error}
            >
                <BasicEmptyListView image={'/dino/fail.png'} imageStyle={BIG_DINO_STYLE} spaceSize={16}>
                    <Typography.Title level={3}>
                        {ErrorOccurredMessage}
                    </Typography.Title>
                    <Typography.Text type={'secondary'}>
                        {ConnectSupportMessage}
                    </Typography.Text>
                </BasicEmptyListView>
            </TrackingComponentLoadEvent>
        )
    }

    return (
        <TrackingComponentLoadEvent
            eventType={BILLING_TRACKING_EVENTS.BILLING_VISIT_INDEX_PAGE}
        >
            <MainContent context={context}/>
        </TrackingComponentLoadEvent>
    )
}
