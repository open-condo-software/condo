import { Col, Row } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { PageComponentType } from '@condo/domains/common/types'
import { AppCard } from '@condo/domains/miniapp/components/AppCard'
import { B2BAppContext, B2BApp } from '@condo/domains/miniapp/utils/clientSchema'
import { NewsCardGrid } from '@condo/domains/news/components/NewsForm/NewsCardGrid'
import {
    NewsReadAndManagePermissionRequired,
} from '@condo/domains/news/components/PageAccess'
import { useNewsItemsAccess } from '@condo/domains/news/hooks/useNewsItemsAccess'


const SHARING_APP_FALLBACK_ICON = '/news/sharingAppIconPlaceholder.svg'

const NewsSettingsPage: PageComponentType = () => {
    const intl = useIntl()
    const PageTitleLabel = intl.formatMessage({ id: 'pages.condo.news.settings.pageTitle' })
    const SharingAppSettingsTitleLabel = intl.formatMessage({ id: 'pages.condo.news.settings.sharingAppSettingsTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    const router = useRouter()
    
    const { organization } = useOrganization()
    const { isLoading: isAccessLoading } = useNewsItemsAccess()

    const {
        loading: isSharingAppsFetching,
        objs: sharingApps,
        error: sharingAppsError,
    } = B2BApp.useObjects({
        where: {
            isHidden: false,
            newsSharingConfig_is_null: false,
            deletedAt: null,
        },
    })
    
    const {
        loading: isSharingAppContextsFetching,
        objs: sharingAppContexts,
        error: sharingAppContextsError,
    } = B2BAppContext.useObjects({
        where: {
            organization: { id: organization.id },
            app: { newsSharingConfig_is_null: false, deletedAt: null },
            deletedAt: null,
        },
    })

    const loading = isAccessLoading || isSharingAppContextsFetching || isSharingAppsFetching
    const error = sharingAppContextsError || sharingAppsError

    if (loading || error) {
        return (
            <LoadingOrErrorPage
                loading={loading}
                error={error && ServerErrorMsg}
            />
        )
    }
    
    return (
        <>
            <Head>
                <title>{PageTitleLabel}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>{PageTitleLabel}</Typography.Title>} spaced/>

                <PageContent>
                    <Row gutter={[0, 32]}>
                        <Col span={24}>
                            <Typography.Title level={2}>{SharingAppSettingsTitleLabel}</Typography.Title>
                        </Col>

                        <Col span={24}>
                            <NewsCardGrid>
                                { sharingApps.map( app => {
                                    const sharingAppName = get(app, ['newsSharingConfig', 'name'], '').replaceAll(' ', '\xa0')
                                    const sharingAppId = get(app, ['id'])
                                    const sharingAppIcon = get(app, ['newsSharingConfig', 'icon', 'publicUrl'], SHARING_APP_FALLBACK_ICON)

                                    return (
                                        <AppCard
                                            key={sharingAppId}
                                            logoUrl={sharingAppIcon}
                                            connected={sharingAppContexts.filter(x => get(x, ['app', 'id']) === sharingAppId).length > 0}
                                            name={sharingAppName}
                                            description={intl.formatMessage({ id: 'pages.condo.news.settings.appCard.description' }, { sharingAppName })}
                                            onClick={() => {
                                                const url = `/miniapps/${sharingAppId}/about`
                                                router.push(url, url)
                                            }}
                                        />
                                    )
                                })}
                            </NewsCardGrid>
                        </Col>
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

NewsSettingsPage.requiredAccess = NewsReadAndManagePermissionRequired

export default NewsSettingsPage
