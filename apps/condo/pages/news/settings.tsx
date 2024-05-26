/** @jsx jsx */
import { jsx } from '@emotion/react'
import { Col, Row, RowProps } from 'antd'
import get from 'lodash/get'
import Head from 'next/head'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Card, Typography } from '@open-condo/ui'

import { PageContent, PageHeader, PageWrapper } from '@condo/domains/common/components/containers/BaseLayout'
import LoadingOrErrorPage from '@condo/domains/common/components/containers/LoadingOrErrorPage'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'
import { AppCard, MIN_CARD_WIDTH } from '@condo/domains/miniapp/components/AppCard'
import { B2BAppContext, B2BApp } from '@condo/domains/miniapp/utils/clientSchema'
import {
    NewsReadAndManagePermissionRequired,
} from '@condo/domains/news/components/PageAccess'
import { useNewsItemsAccess } from '@condo/domains/news/hooks/useNewsItemsAccess'

interface INewsIndexPage extends React.FC {
    headerAction?: JSX.Element
    requiredAccess?: React.FC
}

const CARD_GAP = 40
const CONTENT_SPACING: RowProps['gutter'] = [CARD_GAP, CARD_GAP]
const MARGIN_BOTTOM_32_STYLE: React.CSSProperties = { marginBottom: '32px' }
const SHARING_APP_FALLBACK_ICON = '/news/sharingAppIconPlaceholder.svg'
const getCardsAmount = (width: number) => {
    return Math.max(1, Math.floor(width / (MIN_CARD_WIDTH + CARD_GAP)))
}

const NewsSettingsPage: INewsIndexPage = () => {
    const intl = useIntl()
    const PageTitleMessage = intl.formatMessage({ id: 'pages.condo.news.settings.pageTitle' })
    const ServerErrorMsg = intl.formatMessage({ id: 'ServerError' })

    const router = useRouter()
    
    const { organization } = useOrganization()
    const { isLoading: isAccessLoading } = useNewsItemsAccess()
    const [{ width }, refCallback] = useContainerSize<HTMLDivElement>()

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

    const cardsPerRow = getCardsAmount(width)
    
    return (
        <>
            <Head>
                <title>{PageTitleMessage}</title>
            </Head>
            <PageWrapper>
                <PageHeader title={<Typography.Title>Настройки</Typography.Title>} spaced/>

                <PageContent>
                    <div style={MARGIN_BOTTOM_32_STYLE}>
                        <Typography.Title level={2}>Выберите каналы отправки</Typography.Title>
                    </div>

                    <Row gutter={CONTENT_SPACING} ref={refCallback}>
                        { sharingApps.map( app => {
                            const sharingAppName = get(app, ['newsSharingConfig', 'name'], '').replaceAll(' ', ' ')
                            const sharingAppId = get(app, ['id'])
                            const sharingAppIcon = get(app, ['newsSharingConfig', 'icon', 'publicUrl'], SHARING_APP_FALLBACK_ICON)

                            return (
                                <Col span={Math.ceil(24 / cardsPerRow)} key={`${cardsPerRow}:${app.id}`}>
                                    <AppCard
                                        logoUrl={sharingAppIcon}
                                        connected={sharingAppContexts.filter(x => get(x, ['app', 'id']) === sharingAppId).length > 0}
                                        name={sharingAppName}
                                        description={`Отправка новостей в приложение ${sharingAppName}`}
                                        onClick={() => {
                                            const url = `/miniapps/${sharingAppId}/about`
                                            router.push(url, url)
                                        }}
                                    />
                                </Col>
                            )
                        })}
                    </Row>
                </PageContent>
            </PageWrapper>
        </>
    )
}

NewsSettingsPage.requiredAccess = NewsReadAndManagePermissionRequired
export default NewsSettingsPage
