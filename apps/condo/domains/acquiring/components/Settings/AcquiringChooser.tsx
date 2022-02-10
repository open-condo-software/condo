import React from 'react'
import { Space, Col, Row, Typography } from 'antd'
import { useOrganization } from '@core/next/organization'
import { useIntl } from '@core/next/intl'
import get from 'lodash/get'
import { CardStatuses, IntegrationPanel } from './IntegrationPanel'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { AcquiringIntegration, AcquiringIntegrationContext } from '@condo/domains/acquiring/utils/clientSchema'
import { Loader } from '@condo/domains/common/components/Loader'



import { BillingIntegration, BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'

import { IntegrationChooser } from '@condo/domains/billing/components/Settings/IntegrationChooser'

export const AcquiringChooser: React.FC = () => {
    const intl = useIntl()

    const OneAcquiringWarningMessage = intl.formatMessage({ id: 'OneAcquiringWarning' })

    return <IntegrationChooser
        integrationModel={AcquiringIntegration}
        integrationContextModel={AcquiringIntegrationContext}
        integrationMessages={{
            'oneIntegrationWarningMessage': OneAcquiringWarningMessage,
        }}
    />
}


//
// export const AcquiringChooser: React.FC = () => {
//     const intl = useIntl()
//
//     const NoPermissionMessage = intl.formatMessage({ id: 'NoPermissionToSettings' })
//
//     const userOrganization = useOrganization()
//     const organizationId = get(userOrganization, ['organization', 'id'])
//     const canReadPayments = get(userOrganization, ['link', 'role', 'canReadPayments'], false)
//     const {
//         objs: integrations,
//         loading: integrationsLoading,
//         error: integrationsError,
//     } = AcquiringIntegration.useObjects({
//         where: {
//             isHidden: false,
//         },
//     })
//
//     const {
//         obj: currentContext,
//         error: contextError,
//         loading: contextLoading,
//     } = AcquiringIntegrationContext.useObject({
//         where: {
//             organization: {
//                 id: organizationId,
//             },
//         },
//     }, {
//         fetchPolicy: 'network-only',
//     })
//
//     if (!canReadPayments) {
//         return (
//             <BasicEmptyListView>
//                 <Typography.Title level={3}>
//                     {NoPermissionMessage}
//                 </Typography.Title>
//             </BasicEmptyListView>
//         )
//     }
//
//     if (integrationsLoading || contextLoading) {
//         return (
//             <Loader fill size={'large'}/>
//         )
//     }
//
//     if (integrationsError || contextError) {
//         return (
//             <BasicEmptyListView>
//                 <Typography.Title level={3}>
//                     {integrationsError ? integrationsError : contextError}
//                 </Typography.Title>
//             </BasicEmptyListView>
//         )
//     }
//     return (
//         <>
//             <Space direction={'vertical'} size={40} style={{ width: '100%' }}>
//                 <Col span={24}>
//                     <Row gutter={[44, 44]}>
//                         {
//                             integrations.map((integration) => {
//                                 const isActiveIntegration = !!currentContext && integration.id === currentContext.integration.id
//                                 let status: CardStatuses = 'disabled'
//                                 if (isActiveIntegration) {
//                                     status = 'done'
//                                 } else if (!currentContext) {
//                                     status = 'available'
//                                 }
//
//                                 return (
//                                     <Col
//                                         span={12}
//                                         key={integration.id}
//                                         style={{
//                                             order: isActiveIntegration ? -1 : 'unset',
//                                         }}
//                                     >
//                                         <IntegrationPanel
//                                             integrationId={integration.id}
//                                             title={integration.name}
//                                             shortDescription={get(integration, 'shortDescription')}
//                                             status={status}
//                                         />
//                                     </Col>
//                                 )
//                             })
//                         }
//                     </Row>
//                 </Col>
//             </Space>
//         </>
//     )
// }