import React from 'react'
import Head from 'next/head'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useIntl } from '@core/next/intl'
import { BillingIntegration, BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { Typography, Col, Row, Space, Modal, Alert, Tooltip } from 'antd'
const ReactMarkdown = require('react-markdown')
const gfm = require('remark-gfm')
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { useOrganization } from '@core/next/organization'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Button } from '@condo/domains/common/components/Button'
import Link from 'next/link'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'


const SETTINGS_PAGE_ROUTE = '/settings/'

const ButtonWrap = styled.div`
   width: fit-content;
   cursor: ${({ disabled }: { disabled: boolean }) => disabled ? 'not-allowed' : 'pointer'};
 `

const BillingIntegrationDetailsPage = () => {
    const intl = useIntl()
    const ErrorMessage = intl.formatMessage({ id: 'errors.PdfGenerationError' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const NoPermissionMessage = intl.formatMessage({ id: 'NoPermissionToSettings' })
    const DefaultStartButtonMessage = intl.formatMessage({ id: 'StartIntegration' })
    const DefaultInstructionButtonText = intl.formatMessage({ id: 'Instruction' })
    const ContinueMessage = intl.formatMessage({ id: 'property.Continue' })
    const ConfirmModalTitle = intl.formatMessage({ id: 'BillingIntegrationContextConfirmQuestion' })
    const CancelMessage = intl.formatMessage({ id: 'Cancel' })
    const CreateContextRestrictionMessage = intl.formatMessage({ id:'BillingIntegrationContextNoReturns' }, {
        buttonValue: ContinueMessage,
    })
    const ContextAlreadyCreatedMessage = intl.formatMessage({ id: 'ContextAlreadyCreated' })
    const CompanyNameLabel = intl.formatMessage({ id: 'CompanyName' })
    const AnotherContextAlreadyCreatedMessage = intl.formatMessage({ id: 'AnotherContextAlreadyCreated' }, {
        companyName: CompanyNameLabel,
    })

    const { query, push } = useRouter()
    const integrationId = get(query, 'id')

    const userOrganization = useOrganization()
    const organizationId = get(userOrganization, ['organization', 'id'])
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

    const createContextAction = BillingIntegrationOrganizationContext.useCreate({
        integration: String(integrationId),
        organization: organizationId,
    }, () => {
        push(SETTINGS_PAGE_ROUTE)
    })

    const { confirm } = Modal
    const showConfirmModal = () => {
        confirm({
            title: ConfirmModalTitle,
            icon: <ExclamationCircleOutlined />,
            content: (
                <Alert message={CreateContextRestrictionMessage} type={'warning'}/>
            ),
            okText: ContinueMessage,
            cancelText: CancelMessage,
            onOk () {
                return createContextAction({})
            },
        })
    }

    if (integrationLoading || integrationError || contextLoading || contextError) {
        return (
            <LoadingOrErrorPage
                title={LoadingMessage}
                loading={integrationLoading || contextLoading}
                error={integrationError || contextError ? ErrorMessage : null}
            />
        )
    }

    const pageTitle = get(integration, 'detailsTitle')
    const markDownText = get(integration, 'detailsText')
    const startButtonMessage = get(integration, 'detailsConfirmButtonText', DefaultStartButtonMessage)
    const instructionsButtonText = get(integration, 'detailsInstructionButtonText', DefaultInstructionButtonText)
    const instructionsButtonLink = get(integration, 'detailsInstructionButtonLink')

    const disabledIntegration = !!currentContext
    const shouldNotifyWithAlert = !!currentContext && currentContext.integration.id !== integrationId

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
                                            <Row gutter={[0, 50]}>
                                                {
                                                    shouldNotifyWithAlert && (
                                                        <Col span={24}>
                                                            <Alert
                                                                message={AnotherContextAlreadyCreatedMessage}
                                                                type={'warning'}
                                                                showIcon
                                                                style={{ width: 'fit-content' }}
                                                            />
                                                        </Col>
                                                    )
                                                }
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
                                                    <Space size={20} style={{ width: '100%', flexWrap: 'wrap' }}>
                                                        <Tooltip title={ContextAlreadyCreatedMessage}>
                                                            <ButtonWrap disabled={disabledIntegration}>
                                                                <Button
                                                                    type='sberPrimary'
                                                                    onClick={showConfirmModal}
                                                                    disabled={disabledIntegration}
                                                                    style={{ pointerEvents: disabledIntegration ? 'none' : 'auto' }}
                                                                >
                                                                    {startButtonMessage}
                                                                </Button>
                                                            </ButtonWrap>
                                                        </Tooltip>
                                                        {
                                                            instructionsButtonLink && (
                                                                <Link href={instructionsButtonLink}>
                                                                    <a target='_blank'>
                                                                        <Button type='sberPrimary' secondary>
                                                                            {instructionsButtonText}
                                                                        </Button>
                                                                    </a>
                                                                </Link>
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
    path={SETTINGS_PAGE_ROUTE}
/>

export default BillingIntegrationDetailsPage