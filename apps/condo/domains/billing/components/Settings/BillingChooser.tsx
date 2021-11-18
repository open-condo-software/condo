import React from 'react'
import { Space, Col, Alert, Row, Typography } from 'antd'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'
import { CardStatuses, IntegrationPanel } from './IntegrationPanel'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { BillingIntegration, BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'
import { Loader } from '@condo/domains/common/components/Loader'
import {
    BILLING_INTEGRATION_ORGANIZATION_CONTEXT_IN_PROGRESS_STATUS,
    BILLING_INTEGRATION_ORGANIZATION_CONTEXT_ERROR_STATUS,
} from '@condo/domains/billing/constants'

export const BillingChooser: React.FC = () => {
    const intl = useIntl()

    const OneBillingWarningMessage = intl.formatMessage({ id: 'OneBillingWarning' })
    const NoPermissionMessage = intl.formatMessage({ id: 'NoPermissionToSettings' })

    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'])
    const canManageIntegrations = get(userOrganization, ['link', 'role', 'canManageIntegrations'], false)
    const {
        objs: integrations,
        loading: integrationsLoading,
        error: integrationsError,
    } = BillingIntegration.useObjects({
        where: {
            isHidden: false,
        },
    })

    const {
        obj: currentContext,
        error: contextError,
        loading: contextLoading,
    } = BillingIntegrationOrganizationContext.useObject({
        where: {
            organization: {
                id: organizationId,
            },
        },
    }, {
        fetchPolicy: 'network-only',
    })

    if (!canManageIntegrations) {
        return (
            <BasicEmptyListView>
                <Typography.Title level={3}>
                    {NoPermissionMessage}
                </Typography.Title>
            </BasicEmptyListView>
        )
    }

    if (integrationsLoading || contextLoading) {
        return (
            <Loader fill size={'large'}/>
        )
    }

    if (integrationsError || contextError) {
        return (
            <BasicEmptyListView>
                <Typography.Title level={3}>
                    {integrationsError ? integrationsError : contextError}
                </Typography.Title>
            </BasicEmptyListView>
        )
    }
    return (
        <>
            <Space direction={'vertical'} size={40} style={{ width: '100%' }}>
                {
                    !currentContext && (
                        <Alert message={OneBillingWarningMessage} showIcon type="warning" style={{ width: 'fit-content' }} />
                    )
                }
                <Col span={24}>
                    <Row gutter={[44, 44]}>
                        {
                            integrations.map((integration) => {
                                const isActiveIntegration = !!currentContext && integration.id === currentContext.integration.id
                                let status: CardStatuses = 'disabled'
                                if (isActiveIntegration) {
                                    if (currentContext.status === BILLING_INTEGRATION_ORGANIZATION_CONTEXT_IN_PROGRESS_STATUS) {
                                        status = 'inProgress'
                                    } else if (currentContext.status === BILLING_INTEGRATION_ORGANIZATION_CONTEXT_ERROR_STATUS) {
                                        status = 'error'
                                    } else {
                                        status = 'done'
                                    }
                                } else if (!currentContext) {
                                    status = 'available'
                                }

                                return (
                                    <Col
                                        span={12}
                                        key={integration.id}
                                        style={{
                                            order: isActiveIntegration ? -1 : 'unset',
                                        }}
                                    >
                                        <IntegrationPanel
                                            integrationId={integration.id}
                                            title={integration.name}
                                            shortDescription={get(integration, 'shortDescription')}
                                            status={status}
                                        />
                                    </Col>
                                )
                            })
                        }
                    </Row>
                </Col>
            </Space>
        </>
    )
}