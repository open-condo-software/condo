import { SortB2BAppPromoBlocksBy } from '@app/condo/schema'
import { Row, Col } from 'antd'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { CSSProperties, useCallback, useEffect, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { Search } from '@open-condo/icons'
import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useLazyQuery } from '@open-condo/next/apollo'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography, Carousel, Banner } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import Input from '@condo/domains/common/components/antd/Input'
import { PageHeader } from '@condo/domains/common/components/containers/BaseLayout'
import { useContainerSize } from '@condo/domains/common/hooks/useContainerSize'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { PROMO_BLOCK_TEXT_VARIANTS_TO_PROPS, B2B_APP_CATEGORIES, ALL_APPS_CATEGORY, CONNECTED_APPS_CATEGORY } from '@condo/domains/miniapp/constants'
import { ALL_MINI_APPS_QUERY } from '@condo/domains/miniapp/gql.js'
import { B2BAppPromoBlock } from '@condo/domains/miniapp/utils/clientSchema'

import { CardGrid } from './CardGrid'

import type { TabContent } from './CardGrid'
import type { MiniAppOutput } from '@app/condo/schema'
import type { RowProps, ColProps } from 'antd'


const SECTION_SPACING: RowProps['gutter'] = [0, 40]
const CONTENT_SPACING: RowProps['gutter'] = [40, 40]
const FULL_COL_SPAN: ColProps['span'] = 24
const TITLE_ROW_HOR_ALIGN_STYLES: CSSProperties = { display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }
const TITLE_ROW_VERT_ALIGN_STYLES: CSSProperties = {}
const SEARCH_FIXED_STYLES: CSSProperties = { width: 280 }
const SEARCH_FULL_STYLES: CSSProperties = { width: '100%', marginTop: 20 }
const TITLE_COL_THRESHOLD = 500
const BANNER_CHANGE_DELAY_IN_MS = 6000 // 6 sec
const BANNER_CHANGE_SPEED_IN_MS = 1200 // 1.2 sec
const ALL_SECTIONS = [
    ALL_APPS_CATEGORY,
    CONNECTED_APPS_CATEGORY,
    ...B2B_APP_CATEGORIES,
]

type QueryResult = {
    objs: Array<MiniAppOutput>
}

export const CatalogPageContent: React.FC = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.miniapps' })
    const BannerMoreMessage = intl.formatMessage({ id:'miniapps.catalog.banner.more' })
    const CategoriesTitles = Object.assign({}, ...ALL_SECTIONS.map(category => ({
        [category]: intl.formatMessage({ id: `miniapps.categories.${category}.name` as FormatjsIntl.Message['ids'] }),
    })))
    const SearchPlaceHolder = intl.formatMessage({ id: 'miniapps.catalog.search.placeholder' })
    const SearchResultsTitle = intl.formatMessage({ id: 'miniapps.catalog.search.results.title' })

    const [{ width }, setRef] = useContainerSize<HTMLDivElement>()

    const router = useRouter()
    const { query: { tab } } = router

    // BANNER HOOKS
    const { objs: promoBlocks } = B2BAppPromoBlock.useObjects({
        sortBy: [SortB2BAppPromoBlocksBy.PriorityDesc, SortB2BAppPromoBlocksBy.CreatedAtDesc],
    })

    const getBannerOnClickEvent = useCallback((targetUrl, isExternal) => {
        return function onClick () {
            if (!isExternal) {
                router.push(targetUrl)
            } else if (typeof window !== 'undefined') {
                window.open(targetUrl, '_blank')
            }
        }
    }, [router])

    const [search, handleSearchChange, handleResetSearch] = useSearch()
    const handleSearchInputChange: React.ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
        handleSearchChange(event.target.value)
    }, [handleSearchChange])

    // APPS HOOKS
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const [miniapps, setMiniapps] = useState<Array<MiniAppOutput>>([])
    const [appsCategories, setAppsCategories] = useState<Array<string>>([])
    const [appsTabs, setAppsTabs] = useState<Array<TabContent>>([])

    const [fetchMiniapps] = useLazyQuery<QueryResult>(ALL_MINI_APPS_QUERY, {
        onCompleted: (data) => {
            const fetchedApps = get(data, 'objs', [])
            setMiniapps(fetchedApps)
        },
        onError: () => {
            setMiniapps([])
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
                        where: {
                            app: { name_contains_i: search },
                        },
                    },
                },
            })
        } else {
            setMiniapps([])
        }
    }, [search, userOrganizationId, fetchMiniapps])

    useDeepCompareEffect(() => {
        const tabs = [{ category: ALL_APPS_CATEGORY, apps: miniapps }]

        const connectedApps = miniapps.filter(app => app.connected)
        if (connectedApps.length) {
            tabs.push({ category: CONNECTED_APPS_CATEGORY, apps: connectedApps })
        }
        for (const category of B2B_APP_CATEGORIES) {
            const categoryApps = miniapps.filter(app => app.category === category)
            tabs.push({ category, apps: categoryApps })
        }
        setAppsTabs(tabs)
        const categories = tabs.map(tab => tab.category)
        setAppsCategories(categories)
    }, [miniapps])

    const selectedTab = (tab && !Array.isArray(tab) && appsCategories.includes(tab.toUpperCase())) ? tab.toUpperCase() : ALL_APPS_CATEGORY

    return (
        <>
            <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>}/>
            <Row gutter={SECTION_SPACING}>
                {Boolean(promoBlocks.length) && (
                    <Col span={FULL_COL_SPAN}>
                        <Carousel
                            autoplay
                            autoplaySpeed={BANNER_CHANGE_DELAY_IN_MS}
                            speed={BANNER_CHANGE_SPEED_IN_MS}
                            effect='fade'
                        >
                            {promoBlocks.map(promoBlock => (
                                <Banner
                                    key={promoBlock.id}
                                    title={promoBlock.title}
                                    subtitle={promoBlock.subtitle}
                                    backgroundColor={promoBlock.backgroundColor}
                                    actionText={BannerMoreMessage}
                                    imgUrl={get(promoBlock, ['backgroundImage', 'publicUrl'])}
                                    {...PROMO_BLOCK_TEXT_VARIANTS_TO_PROPS[promoBlock.textVariant]}
                                    onClick={getBannerOnClickEvent(promoBlock.targetUrl, promoBlock.external)}
                                />
                            ))}
                        </Carousel>
                    </Col>
                )}
                {Boolean(miniapps.length || search) && (
                    <Col span={FULL_COL_SPAN}>
                        <Row gutter={CONTENT_SPACING}>
                            <Col
                                span={FULL_COL_SPAN}
                                ref={setRef}
                                style={width > TITLE_COL_THRESHOLD ? TITLE_ROW_HOR_ALIGN_STYLES : TITLE_ROW_VERT_ALIGN_STYLES}
                            >
                                <Typography.Title level={2}>
                                    {search ? SearchResultsTitle : CategoriesTitles[selectedTab]}
                                </Typography.Title>
                                <Input
                                    placeholder={SearchPlaceHolder}
                                    onChange={handleSearchInputChange}
                                    value={search}
                                    allowClear
                                    style={width > TITLE_COL_THRESHOLD ? SEARCH_FIXED_STYLES : SEARCH_FULL_STYLES}
                                    suffix={<Search size='medium' color={colors.gray[7]}/>}
                                />
                            </Col>
                            <Col span={FULL_COL_SPAN}>
                                <CardGrid
                                    search={search}
                                    resetSearch={handleResetSearch}
                                    tabs={appsTabs}
                                />
                            </Col>
                        </Row>
                    </Col>
                )}
            </Row>
        </>
    )
}