import React, { useEffect, useState } from 'react'
import { Row, Col } from 'antd'
import type { RowProps, ColProps } from 'antd'
import get from 'lodash/get'
import { useIntl } from '@open-condo/next/intl'
import { Markdown, Carousel, Typography } from '@open-condo/ui'
import { useOrganization } from '@open-condo/next/organization'
import { useLazyQuery } from '@open-condo/next/apollo'
import { MiniAppOutput } from '@app/condo/schema'
import { ALL_MINI_APPS_QUERY } from '@condo/domains/miniapp/gql'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'

import { TopCard } from './TopCard'
import { DeveloperCard } from './DeveloperCard'
import { AppCard, MIN_CARD_WIDTH } from '../AppCard'


const CAROUSEL_GAP = 40
const SECTION_SPACING: RowProps['gutter'] = [0, 60]
const SMALL_SECTION_SPACING: RowProps['gutter'] = [40, 40]
const TITLE_SPACING: RowProps['gutter'] = [0, 20]
const FULL_COL_SPAN: ColProps['span'] = 24
const DESKTOP_CONTENT_COL_SPAN: ColProps['span'] = 18
const DEV_CARD_FULL_WIDTH_THRESHOLD = 850

type QueryResult = {
    objs: Array<MiniAppOutput>
}

type PageContentProps = {
    id: string
    type: string
    name: string
    category: string
    label?: string
    shortDescription: string
    detailedDescription: string
    price?: string
    developer: string
    publishedAt: string
    partnerUrl?: string
    gallery?: Array<string>
    contextStatus: string | null
    appUrl?: string
    connectAction: () => void
}

const getCardsAmount = (width: number) => {
    if (width <= MIN_CARD_WIDTH) {
        return 1
    }
    const widthLeft = width - MIN_CARD_WIDTH
    const fitCardsAmount = Math.floor(widthLeft / (MIN_CARD_WIDTH + CAROUSEL_GAP))
    return 1 + fitCardsAmount
}

const PageContent: React.FC<PageContentProps> = ({
    id,
    type,
    name,
    category,
    label,
    shortDescription,
    detailedDescription,
    price,
    developer,
    publishedAt,
    partnerUrl,
    gallery,
    contextStatus,
    appUrl,
    connectAction,
}) => {
    const intl = useIntl()
    const MoreAppsMessage = intl.formatMessage({ id: 'miniapps.appDescription.moreAppsInThisCategory' })
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])

    const [moreApps, setMoreApps] = useState<Array<MiniAppOutput>>([])
    const [fetchMiniapps] = useLazyQuery<QueryResult>(ALL_MINI_APPS_QUERY, {
        onCompleted: (data) => {
            const fetchedApps = get(data, 'objs', [])
            setMoreApps(fetchedApps)
        },
        onError: () => {
            setMoreApps([])
        },
    })

    useEffect(() => {
        if (userOrganizationId) {
            fetchMiniapps({
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        organization: { id: userOrganizationId },
                        where: { connected: false, id_not: id, category },
                    },
                },
            })
        } else {
            setMoreApps([])
        }
    }, [userOrganizationId, fetchMiniapps, id, category])

    const [{ width }, setRef] = useContainerSize<HTMLDivElement>()
    const carouselSlides = getCardsAmount(width)
    const isDevCardWide = width <= DEV_CARD_FULL_WIDTH_THRESHOLD
    const contentSpan = isDevCardWide ? FULL_COL_SPAN : DESKTOP_CONTENT_COL_SPAN
    const developerSpan = (FULL_COL_SPAN - contentSpan) || FULL_COL_SPAN
    const contentOrder = isDevCardWide ? 2 : 1
    const developerOrder = isDevCardWide ? 1 : 2

    return (
        <Row gutter={SECTION_SPACING} ref={setRef}>
            <Col span={FULL_COL_SPAN}>
                <Row gutter={SMALL_SECTION_SPACING}>
                    <Col span={FULL_COL_SPAN}>
                        <TopCard
                            id={id}
                            type={type}
                            name={name}
                            category={category}
                            label={label}
                            description={shortDescription}
                            price={price}
                            gallery={gallery}
                            contextStatus={contextStatus}
                            appUrl={appUrl}
                            connectAction={connectAction}
                        />
                    </Col>
                    <Col span={contentSpan} order={contentOrder}>
                        <Markdown>
                            {detailedDescription}
                        </Markdown>
                    </Col>
                    <Col span={developerSpan} order={developerOrder}>
                        <DeveloperCard
                            developer={developer}
                            publishedAt={publishedAt}
                            partnerUrl={partnerUrl}
                            display={isDevCardWide ? 'row' : 'col'}
                        />
                    </Col>
                </Row>
            </Col>
            {Boolean(moreApps.length) && (
                <Col span={FULL_COL_SPAN}>
                    <Row gutter={TITLE_SPACING}>
                        <Col span={FULL_COL_SPAN}>
                            <Typography.Title level={2}>
                                {MoreAppsMessage}
                            </Typography.Title>
                        </Col>
                        <Col span={FULL_COL_SPAN}>
                            <Carousel
                                dots={false}
                                autoplay={false}
                                infinite={false}
                                slidesToShow={carouselSlides}
                            >
                                {moreApps.map(app => (
                                    <AppCard
                                        key={`${app.type}:${app.id}`}
                                        id={app.id}
                                        type={app.type}
                                        connected={app.connected}
                                        name={app.name}
                                        description={app.shortDescription}
                                        logoUrl={app.logo}
                                        label={app.label}
                                    />
                                ))}
                            </Carousel>
                        </Col>
                    </Row>
                </Col>
            )}
        </Row>
    )
}

PageContent.displayName = 'AboutAppPageContent'

export {
    PageContent,
}