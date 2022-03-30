import React from 'react'
import { useIntl } from '@core/next/intl'
import { EmptyListView, BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Typography } from 'antd'
import { Loader } from '@condo/domains/common/components/Loader'
import {
    BILLING_INTEGRATION_ORGANIZATION_CONTEXT_IN_PROGRESS_STATUS,
    BILLING_INTEGRATION_ORGANIZATION_CONTEXT_ERROR_STATUS,
} from '@condo/domains/billing/constants/constants'
import { ApolloError } from '@apollo/client'
import { IBillingIntegrationOrganizationContextUIState } from '../../utils/clientSchema/BillingIntegrationOrganizationContext'
import { MainContent } from './MainContent'
import { fontSizes } from '@condo/domains/common/constants/style'

const BILLING_SETTINGS_ROUTE = '/miniapps'

interface IBillingPageContentProps {
    access: boolean,
    contextLoading: boolean,
    contextError: string | ApolloError
    context: IBillingIntegrationOrganizationContextUIState
}

export interface IContextProps {
    context: IBillingIntegrationOrganizationContextUIState
}

export const BillingPageContent: React.FC<IBillingPageContentProps> = ({ access, contextLoading, contextError, context }) => {
    const intl = useIntl()
    const NoPermissionsMessage = intl.formatMessage({ id: 'NoPermissionToPage' })
    const ConnectBillingMessage = intl.formatMessage({ id: 'ConnectBilling' })
    const AvailableBillingsLabel = intl.formatMessage({ id: 'AvailableBillings' })
    const YouCanIntegrateWithMessage = intl.formatMessage({ id: 'CanIntegrateWithThisBillings' }, {
        billingList: AvailableBillingsLabel,
    })
    const NoBillingIntegrationYetMessage = intl.formatMessage({ id: 'NoBillingIntegrationYet' })
    const ConnectionInProgressMessage = intl.formatMessage({ id:'ConnectionInProgress' })
    const WillBeReadySoonMessage = intl.formatMessage({ id: 'WillBeReadySoon' })
    const ErrorOccurredMessage = intl.formatMessage({ id: 'ErrorOccurred' })
    const CompanyName = intl.formatMessage({ id: 'CompanyName' })
    const ConnectSupportMessage = intl.formatMessage({ id: 'ErrorHappenedDuringIntegration' }, {
        company: CompanyName,
    })

    if (!access) {
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
        return (
            <EmptyListView
                label={NoBillingIntegrationYetMessage}
                message={YouCanIntegrateWithMessage}
                createRoute={BILLING_SETTINGS_ROUTE}
                createLabel={ConnectBillingMessage}
            />
        )
    }

    if (context.status === BILLING_INTEGRATION_ORGANIZATION_CONTEXT_IN_PROGRESS_STATUS) {
        return (
            <BasicEmptyListView>
                <Typography.Title level={3}>
                    {ConnectionInProgressMessage}
                </Typography.Title>
                <Typography.Text style={{ fontSize: fontSizes.content }}>
                    {WillBeReadySoonMessage}
                </Typography.Text>
            </BasicEmptyListView>
        )
    }

    if (context.status === BILLING_INTEGRATION_ORGANIZATION_CONTEXT_ERROR_STATUS) {
        return (
            <BasicEmptyListView>
                <Typography.Title level={3}>
                    {ErrorOccurredMessage}
                </Typography.Title>
                <Typography.Text style={{ fontSize: fontSizes.content }}>
                    {ConnectSupportMessage}
                </Typography.Text>
            </BasicEmptyListView>
        )
    }

    return (
        <>
            <MainContent context={context}/>
        </>
    )
}