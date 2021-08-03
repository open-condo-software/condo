import React from 'react'
import { Space, Col, Alert, Row, Typography } from 'antd'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'
import { IntegrationPanel } from './IntegrationPanel'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { BillingIntegration } from '@condo/domains/billing/utils/clientSchema'
import { Loader } from '@condo/domains/common/components/Loader'

export const BillingChooser: React.FC = () => {
    const intl = useIntl()

    const OneBillingWarningMessage = intl.formatMessage({ id: 'OneBillingWarning' })
    const NoPermissionMessage = intl.formatMessage({ id: 'NoPermissionToSettings' })

    const userOrganization = useOrganization()
    const canManageIntegrations = get(userOrganization, ['link', 'role', 'canManageIntegrations'], false)
    const {
        objs: integrations,
        loading: integrationsLoading,
        error: integrationsError,
    } = BillingIntegration.useObjects({})

    if (!canManageIntegrations) {
        return (
            <BasicEmptyListView>
                <Typography.Title level={3}>
                    {NoPermissionMessage}
                </Typography.Title>
            </BasicEmptyListView>
        )
    }

    if (integrationsLoading) {
        return (
            <Loader fill size={'large'}/>
        )
    }

    if (integrationsError) {
        return (
            <BasicEmptyListView>
                <Typography.Title level={4}>
                    {integrationsError}
                </Typography.Title>
            </BasicEmptyListView>
        )
    }

    return (
        <>
            <Space direction={'vertical'} size={40} style={{ width: '100%' }}>
                <Alert message={OneBillingWarningMessage} showIcon type="warning" style={{ width: 'fit-content' }} />
                <Col span={24}>
                    <Row gutter={[44, 44]}>
                        {
                            integrations.map((integration) => {
                                return (
                                    <Col span={12} key={integration.id}>
                                        <IntegrationPanel
                                            integrationId={integration.id}
                                            title={integration.name}
                                            shortDescription={get(integration, 'shortDescription')}
                                            status={'available'}
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