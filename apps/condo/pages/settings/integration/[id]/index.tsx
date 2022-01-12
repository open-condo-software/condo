import React, { CSSProperties, useEffect, useState } from 'react'
import Head from 'next/head'
import { ReturnBackHeaderAction } from '@condo/domains/common/components/HeaderActions'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { useIntl } from '@core/next/intl'
import { BillingIntegration, BillingIntegrationOrganizationContext } from '@condo/domains/billing/utils/clientSchema'
import { useRouter } from 'next/router'
import get from 'lodash/get'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { Typography, Col, Row, Space, Modal, Alert, Tooltip, Radio } from 'antd'
const ReactMarkdown = require('react-markdown')
const gfm = require('remark-gfm')
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'
import { useOrganization } from '@core/next/organization'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Button } from '@condo/domains/common/components/Button'
import Link from 'next/link'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import Error from 'next/error'
import { Gutter } from 'antd/es/grid/row'

const SETTINGS_PAGE_ROUTE = '/settings/'

const ButtonWrap = styled.div`
    width: fit-content;
    cursor: ${({ disabled }: { disabled: boolean }) => (disabled ? 'not-allowed' : 'pointer')};
`

const ROW_GUTTER: [Gutter, Gutter] = [0, 40]
const DESCRIPTION_TEXT_STYLE = { fontSize: 16 }
const PAGE_HEADER_STYLE = { margin: '0 30' }
const PAGE_HEADER_TITLE_STYLE = { margin: 0 }
const NO_CHANGE_ALERT_STYLE = { width: 'fit-content' }
const RADIO_GROUP_CONTAINER_STYLE = { paddingBottom: 20 }
const BUTTONS_SPACE_STYLE: CSSProperties = { width: '100%', flexWrap: 'wrap' }

const BillingIntegrationDetailsPage = () => {
    const intl = useIntl()
    const ErrorMessage = intl.formatMessage({ id: 'errors.LoadingError' })
    const LoadingMessage = intl.formatMessage({ id: 'Loading' })
    const NoPermissionMessage = intl.formatMessage({ id: 'NoPermissionToSettings' })
    const DefaultStartButtonMessage = intl.formatMessage({ id: 'StartIntegration' })
    const DefaultInstructionButtonText = intl.formatMessage({ id: 'Instruction' })
    const ContinueMessage = intl.formatMessage({ id: 'Continue' })
    const ConfirmModalTitle = intl.formatMessage({ id: 'BillingIntegrationContextConfirmQuestion' })
    const CancelMessage = intl.formatMessage({ id: 'Cancel' })
    const CreateContextRestrictionMessage = intl.formatMessage(
        { id: 'BillingIntegrationContextNoReturns' },
        {
            buttonValue: ContinueMessage,
        },
    )
    const ContextAlreadyCreatedMessage = intl.formatMessage({ id: 'ContextAlreadyCreated' })
    const CompanyNameLabel = intl.formatMessage({ id: 'CompanyName' })
    const AnotherContextAlreadyCreatedMessage = intl.formatMessage(
        { id: 'AnotherContextAlreadyCreated' },
        {
            company: CompanyNameLabel,
        },
    )

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
    } = BillingIntegrationOrganizationContext.useObject(
        {
            where: {
                organization: {
                    id: organizationId,
                },
            },
        },
        {
            fetchPolicy: 'network-only',
        },
    )
    const options = get(integration, ['availableOptions', 'options'])
    const optionsTitle = get(integration, ['availableOptions', 'title'])
    let defaultOption = get(options, ['0', 'name'], null)
    if (currentContext && integration) {
        defaultOption =
            get(currentContext, ['integration', 'id']) === get(integration, 'id')
                ? get(currentContext, 'integrationOption')
                : null
    }
    const [option, setOption] = useState(defaultOption)

    useEffect(() => {
        setOption(defaultOption)
    }, [defaultOption])

    const handleOptionChange = (e) => {
        setOption(e.target.value)
    }

    const createContextAction = BillingIntegrationOrganizationContext.useCreate(
        {
            integration: String(integrationId),
            organization: organizationId,
        },
        () => {
            push(SETTINGS_PAGE_ROUTE)
        },
    )

    const { confirm } = Modal
    const showConfirmModal = () => {
        confirm({
            title: ConfirmModalTitle,
            icon: <ExclamationCircleOutlined />,
            content: <Alert message={CreateContextRestrictionMessage} type={'warning'} />,
            okText: ContinueMessage,
            cancelText: CancelMessage,
            onOk() {
                return createContextAction({
                    status: get(integration, 'contextDefaultStatus'),
                    integrationOption: option,
                })
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

    if (!integration) {
        return <Error statusCode={404} />
    }

    const pageTitle = get(integration, 'detailsTitle')
    const markDownText = get(integration, 'detailsText')
    const startButtonMessage = get(integration, 'detailsConfirmButtonText') || DefaultStartButtonMessage
    const instructionsButtonText = get(integration, 'detailsInstructionButtonText') || DefaultInstructionButtonText
    const instructionsButtonLink = get(integration, 'detailsInstructionButtonLink')

    const disabledIntegration = !!currentContext
    const shouldNotifyWithAlert = !!currentContext && currentContext.integration.id !== integrationId
    const isHiddenIntegration = get(integration, 'isHidden', false)

    return (
        <>
            <Head>
                <title>{pageTitle}</title>
            </Head>
            <PageWrapper>
                <OrganizationRequired>
                    {canManageIntegrations ? (
                        <>
                            <PageHeader
                                title={<Typography.Title style={PAGE_HEADER_TITLE_STYLE}>{pageTitle}</Typography.Title>}
                                style={PAGE_HEADER_STYLE}
                            />
                            <PageContent>
                                <Col span={20}>
                                    <Row gutter={ROW_GUTTER}>
                                        {shouldNotifyWithAlert && (
                                            <Col span={24}>
                                                <Alert
                                                    message={AnotherContextAlreadyCreatedMessage}
                                                    type={'warning'}
                                                    showIcon
                                                    style={NO_CHANGE_ALERT_STYLE}
                                                />
                                            </Col>
                                        )}
                                        {markDownText && (
                                            <Col span={24} style={DESCRIPTION_TEXT_STYLE}>
                                                <ReactMarkdown remarkPlugins={[gfm]}>{markDownText}</ReactMarkdown>
                                            </Col>
                                        )}
                                        {options && optionsTitle && (
                                            <>
                                                <Col span={24}>
                                                    <Typography.Title level={4}>{optionsTitle}</Typography.Title>
                                                </Col>
                                                <Col span={24} style={RADIO_GROUP_CONTAINER_STYLE}>
                                                    <Tooltip
                                                        title={ContextAlreadyCreatedMessage}
                                                        visible={!disabledIntegration ? false : undefined}
                                                    >
                                                        <Radio.Group
                                                            onChange={handleOptionChange}
                                                            value={option}
                                                            disabled={disabledIntegration}
                                                        >
                                                            <Space direction={'vertical'} size={22}>
                                                                {options.map((integrationOption) => {
                                                                    return (
                                                                        <Radio
                                                                            value={integrationOption.name}
                                                                            key={integrationOption.name}
                                                                        >
                                                                            {get(integrationOption, 'displayName') ||
                                                                                integrationOption.name}
                                                                            {integrationOption.descriptionDetails && (
                                                                                <>
                                                                                    &nbsp;
                                                                                    <Typography.Text type={'secondary'}>
                                                                                        (
                                                                                        <Link
                                                                                            href={
                                                                                                integrationOption
                                                                                                    .descriptionDetails.url
                                                                                            }
                                                                                        >
                                                                                            <a target="_blank">
                                                                                                <Typography.Text
                                                                                                    type={'secondary'}
                                                                                                >
                                                                                                    {
                                                                                                        integrationOption
                                                                                                            .descriptionDetails
                                                                                                            .urlText
                                                                                                    }
                                                                                                </Typography.Text>
                                                                                            </a>
                                                                                        </Link>
                                                                                        )
                                                                                    </Typography.Text>
                                                                                </>
                                                                            )}
                                                                        </Radio>
                                                                    )
                                                                })}
                                                            </Space>
                                                        </Radio.Group>
                                                    </Tooltip>
                                                </Col>
                                            </>
                                        )}
                                        <Col span={24}>
                                            <Space size={20} style={BUTTONS_SPACE_STYLE}>
                                                <Tooltip
                                                    title={ContextAlreadyCreatedMessage}
                                                    visible={!disabledIntegration ? false : undefined}
                                                >
                                                    <ButtonWrap disabled={disabledIntegration}>
                                                        <Button
                                                            type="sberPrimary"
                                                            onClick={showConfirmModal}
                                                            disabled={disabledIntegration || isHiddenIntegration}
                                                            style={{ pointerEvents: disabledIntegration ? 'none' : 'auto' }}
                                                        >
                                                            {startButtonMessage}
                                                        </Button>
                                                    </ButtonWrap>
                                                </Tooltip>
                                                {instructionsButtonLink && (
                                                    <Link href={instructionsButtonLink}>
                                                        <a target="_blank">
                                                            <Button type="sberPrimary" secondary>
                                                                {instructionsButtonText}
                                                            </Button>
                                                        </a>
                                                    </Link>
                                                )}
                                            </Space>
                                        </Col>
                                    </Row>
                                </Col>
                            </PageContent>
                        </>
                    ) : (
                        <BasicEmptyListView>
                            <Typography.Title level={3}>{NoPermissionMessage}</Typography.Title>
                        </BasicEmptyListView>
                    )}
                </OrganizationRequired>
            </PageWrapper>
        </>
    )
}

BillingIntegrationDetailsPage.headerAction = (
    <ReturnBackHeaderAction descriptor={{ id: 'menu.Settings' }} path={SETTINGS_PAGE_ROUTE} />
)

export default BillingIntegrationDetailsPage
