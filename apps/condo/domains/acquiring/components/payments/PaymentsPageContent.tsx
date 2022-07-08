import { ApolloError } from '@apollo/client'
import NoAcquiringStub from '@condo/domains/acquiring/components/payments/NoAcquiringStub'
import NoBillingStub from '@condo/domains/acquiring/components/payments/NoBillingStub'
import PaymentsTable from '@condo/domains/acquiring/components/payments/PaymentsTable'
import { AcquiringIntegrationContext } from '@condo/domains/acquiring/utils/clientSchema'
import { BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { useOrganization } from '@core/next/organization'
import { Typography } from 'antd'
import { get, isString } from 'lodash'
import React, { useMemo } from 'react'

function renderError (error: ApolloError | string) {
    if (isString(error)) {
        return (
            <BasicEmptyListView>
                <Typography.Title level={3}>
                    {error}
                </Typography.Title>
            </BasicEmptyListView>
        )
    }

    return (
        <BasicEmptyListView>
            <Typography.Title level={3}>
                {error.name}
            </Typography.Title>
            <Typography.Text>
                {error.message}
            </Typography.Text>
        </BasicEmptyListView>
    )
}

const PaymentsPageContent = (): JSX.Element => {
    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'], '')

    const {
        obj: billingContext,
        error: billingContextError,
        loading: billingContextLoading,
    } = BillingIntegrationOrganizationContext.useNewObject({
        where: {
            organization: {
                id: organizationId,
            },
        },
    }, {
        fetchPolicy: 'network-only',
    })

    const {
        obj: acquiringContext,
        error: acquiringContextError,
        loading: acquiringContextLoading,
    } = AcquiringIntegrationContext.useNewObject({
        where: {
            organization: {
                id: organizationId,
            },
        },
    }, {
        fetchPolicy: 'network-only',
    })

    const isLoading = billingContextLoading || acquiringContextLoading

    const content = useMemo(() => {
        return (
            <PaymentsTable
                billingContext={billingContext}
                contextsLoading={isLoading}
            />
        )
    }, [get(billingContext, 'id', null), organizationId, isLoading])

    if (billingContextError) {
        return renderError(billingContextError)
    }

    if (acquiringContextError) {
        return renderError(acquiringContextError)
    }

    if (!billingContextLoading && !billingContext) {
        return <NoBillingStub/>
    }

    if (!acquiringContextLoading && !acquiringContext) {
        return <NoAcquiringStub/>
    }

    return content
}

export default PaymentsPageContent
