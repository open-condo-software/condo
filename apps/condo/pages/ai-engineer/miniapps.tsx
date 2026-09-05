import { B2BAppContextStatusType } from '@app/condo/schema'
import { Row, Col, type RowProps } from 'antd'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Button, Typography } from '@open-condo/ui'

import { CoworkLayout } from '@condo/domains/ai/components/Cowork'
import coworkStyles from '@condo/domains/ai/components/Cowork/Cowork.module.css'
import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import { PageComponentType } from '@condo/domains/common/types'
import { AppCard } from '@condo/domains/miniapp/components/AppCard'
import { SMART_HOME_CATEGORY } from '@condo/domains/miniapp/constants'
import { B2BAppContext } from '@condo/domains/miniapp/utils/clientSchema'
import { OrganizationRequired } from '@condo/domains/organization/components/OrganizationRequired'


const CARD_GAP = 40
const CONTENT_SPACING: RowProps['gutter'] = [CARD_GAP, CARD_GAP]

const CoworkMiniappsPage: PageComponentType = () => {
    const intl = useIntl()
    const router = useRouter()
    const { organization } = useOrganization()

    const titleLabel = intl.formatMessage({ id: 'ai.cowork.myMiniapps' })
    const emptyLabel = intl.formatMessage({ id: 'ai.cowork.miniapps.empty' })
    const emptyDescriptionLabel = intl.formatMessage({ id: 'ai.cowork.miniapps.emptyDescription' })
    const browseAppsLabel = intl.formatMessage({ id: 'ai.cowork.miniapps.browseApps' })
    const loadingLabel = intl.formatMessage({ id: 'ai.cowork.miniapps.loading' })

    const organizationId = useMemo(() => organization?.id, [organization])

    const {
        objs: contexts,
        loading,
        error,
    } = B2BAppContext.useObjects({
        where: {
            organization: { id: organizationId },
            status: B2BAppContextStatusType.Finished,
            deletedAt: null,
        },
    }, {
        skip: !organizationId,
    })

    const apps = useMemo(() => {
        if (!contexts) return []
        return contexts
            .filter((ctx) => ctx?.app?.category === SMART_HOME_CATEGORY)
            .map((ctx) => ({
                id: ctx.app.id,
                name: ctx.app.name,
                shortDescription: ctx.app.shortDescription,
                logo: ctx.app.logo?.publicUrl,
            }))
    }, [contexts])

    const handleOpenApp = (appId: string) => {
        void router.push(`/miniapps/${appId}`)
    }

    const handleBrowseApps = () => {
        void router.push('/miniapps')
    }

    return (
        <PageWrapper>
            <PageContent>
                <PageHeader
                    title={<Typography.Title>{titleLabel}</Typography.Title>}
                />
                {loading ? (
                    <Typography.Text type='secondary'>{loadingLabel}</Typography.Text>
                ) : error ? (
                    <Typography.Text type='danger'>{String(error)}</Typography.Text>
                ) : apps.length === 0 ? (
                    <div className={coworkStyles.miniappsEmpty}>
                        <Typography.Title level={3}>{emptyLabel}</Typography.Title>
                        <Typography.Text type='secondary'>{emptyDescriptionLabel}</Typography.Text>
                        <div style={{ marginTop: 24 }}>
                            <Button
                                type='primary'
                                size='medium'
                                onClick={handleBrowseApps}
                            >
                                {browseAppsLabel}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Row gutter={CONTENT_SPACING}>
                        {apps.map((app) => (
                            <Col key={app.id} xs={24} sm={12} md={8} lg={6} xl={6}>
                                <AppCard
                                    connected
                                    name={app.name}
                                    description={app.shortDescription}
                                    logoUrl={app.logo}
                                    onClick={() => handleOpenApp(app.id)}
                                />
                            </Col>
                        ))}
                    </Row>
                )}
            </PageContent>
        </PageWrapper>
    )
}

CoworkMiniappsPage.requiredAccess = OrganizationRequired
CoworkMiniappsPage.container = CoworkLayout

export default CoworkMiniappsPage
