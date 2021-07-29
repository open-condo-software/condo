import React from 'react'
import { Space, Col, Alert, Row, Typography } from 'antd'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'
import { IntegrationPanel } from './IntegrationPanel'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'

export const BillingChooser: React.FC = () => {
    const intl = useIntl()
    const OneBillingWarningMessage = intl.formatMessage({ id: 'OneBillingWarning' })
    const NoPermissionMessage = intl.formatMessage({ id: 'NoPermissionToSettings' })

    const userOrganization = useOrganization()
    const canManageIntegrations = get(userOrganization, ['link', 'role', 'canManageIntegrations'], false)

    if (!canManageIntegrations) {
        return (
            <BasicEmptyListView>
                <Typography.Title level={3}>
                    {NoPermissionMessage}
                </Typography.Title>
            </BasicEmptyListView>
        )
    }
    return (
        <>
            <Space direction={'vertical'} size={40} style={{ width: '100%' }}>
                <Alert message={OneBillingWarningMessage} showIcon type="warning" style={{ width: 'fit-content' }} />
                <Row gutter={[44, 44]}>
                    <Col span={12}>
                        <IntegrationPanel
                            integrationId={'1'}
                            title={'Интеграция через загрузку вашего реестра'}
                            shortDescription={'Возможные шаблоны: СБ Бизнес Онлайн 8_2 и 9_1'}
                            status={'chosen'}
                        />
                    </Col>
                    <Col span={12}>
                        <IntegrationPanel
                            integrationId={'2'}
                            title={'ГИС ЖКХ'}
                            shortDescription={'Государственная информационная система ЖКХ'}
                            status={'available'}
                        />
                    </Col>
                    <Col span={12}>
                        <IntegrationPanel
                            integrationId={'3'}
                            title={'Интеграция через загрузку вашего реестра'}
                            shortDescription={'Возможные шаблоны: СБ Бизнес Онлайн 8_2 и 9_1 очень очень очень очень долгий текст'}
                            status={'disabled'}
                        />
                    </Col>
                    <Col span={12}>
                        <IntegrationPanel
                            integrationId={'3'}
                            title={'Интеграция через загрузку вашего ajdkjsakdjaklsdjaklsjdklasjdklajsdlkjlk'}
                            shortDescription={'Возможные шаблоны: СБ Бизнес Онлайн 8_2 и 9_1 очень очень очень очень долгий текст'}
                            status={'disabled'}
                        />
                    </Col>
                </Row>
            </Space>
        </>
    )
}