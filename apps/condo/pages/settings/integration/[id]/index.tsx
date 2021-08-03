import React from 'react'
import Head from 'next/head'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useIntl } from '@core/next/intl'
import { BillingIntegration } from '@condo/domains/billing/utils/clientSchema'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { Typography, Col, Row, Space } from 'antd'
const ReactMarkdown = require('react-markdown')
const gfm = require('remark-gfm')
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { useOrganization } from '@core/next/organization'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Button } from '@condo/domains/common/components/Button'

const BillingIntegrationDetailsPage = () => {
    const intl = useIntl()
    const ErrorMessage = intl.formatMessage({ id: 'errors.PdfGenerationError' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const NoPermissionMessage = intl.formatMessage({ id: 'NoPermissionToSettings' })
    const DefaultStartButtonMessage = intl.formatMessage({ id: 'StartIntegration' })
    const DefaultInstructionButtonText = intl.formatMessage({ id: 'Instruction' })

    const { query } = useRouter()
    const integrationId = get(query, 'id', '')

    const userOrganization = useOrganization()
    const canManageIntegrations = get(userOrganization, ['link', 'role', 'canManageIntegrations'], false)

    const {
        obj: integration,
        loading: integrationLoading,
        error: integrationError,
    } = BillingIntegration.useObject({
        where: {
            id: String(integrationId),
        },
    })

    if (integrationLoading || integrationError) {
        return (
            <LoadingOrErrorPage
                title={LoadingMessage}
                loading={integrationLoading}
                error={integrationError ? ErrorMessage : null}
            />
        )
    }

    const pageTitle = get(integration, 'detailsTitle')
    const markDownText = get(integration, 'detailsText')
    const startButtonMessage = get(integration, 'detailsConfirmButtonText', DefaultStartButtonMessage)
    const instructionsButtonText = get(integration, 'detailsInstructionButtonText', DefaultInstructionButtonText)
    const instructionsButtonLink = get(integration, 'detailsInstructionButtonLink')

    return (
        <>
            <Head>
                <title>{pageTitle}</title>
            </Head>
            <PageWrapper>
                <OrganizationRequired>
                    {
                        canManageIntegrations
                            ? (
                                <>
                                    <PageHeader
                                        title={<Typography.Title style={{ margin: 0 }}>{pageTitle}</Typography.Title>}
                                        style={{ marginTop: 30 }}
                                    />
                                    <PageContent>
                                        <Col span={20}>
                                            <Row gutter={[0, 60]}>
                                                {
                                                    markDownText && (
                                                        <Col span={24} style={{ fontSize: 16 }}>
                                                            <ReactMarkdown remarkPlugins={[gfm]}>
                                                                {markDownText}
                                                            </ReactMarkdown>
                                                        </Col>
                                                    )
                                                }
                                                <Col span={24}>
                                                    <Space size={20}>
                                                        <Button type='sberPrimary'>
                                                            {startButtonMessage}
                                                        </Button>
                                                        {
                                                            instructionsButtonLink && (
                                                                <Button type='sberPrimary' secondary>
                                                                    {instructionsButtonText}
                                                                </Button>
                                                            )
                                                        }
                                                    </Space>
                                                </Col>
                                            </Row>
                                        </Col>
                                    </PageContent>
                                </>
                            )
                            : (
                                <BasicEmptyListView>
                                    <Typography.Title level={3}>
                                        {NoPermissionMessage}
                                    </Typography.Title>
                                </BasicEmptyListView>
                            )
                    }
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

BillingIntegrationDetailsPage.headerAction = <ReturnBackHeaderAction
    descriptor={{ id: 'menu.Settings' }}
    path={'/settings/'}
/>

export default BillingIntegrationDetailsPage