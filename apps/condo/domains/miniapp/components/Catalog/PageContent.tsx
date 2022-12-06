import React, { CSSProperties, useCallback, useEffect, useState } from 'react'
import get from 'lodash/get'
import { useIntl } from 'react-intl'
import { useRouter } from 'next/router'
import { Row, Col } from 'antd'
import type { RowProps, ColProps } from 'antd'
import { Typography, Carousel, Banner } from '@open-condo/ui'
import { useLazyQuery } from '@open-condo/next/apollo'
import { useOrganization } from '@open-condo/next/organization'
import { SortB2BAppPromoBlocksBy } from '@app/condo/schema'
import { useDeepCompareEffect } from '@condo/domains/common/hooks/useDeepCompareEffect'
import { PageHeader } from '@condo/domains/common/components/containers/BaseLayout'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'
import { B2BAppPromoBlock } from '@condo/domains/miniapp/utils/clientSchema'
import { ALL_MINI_APPS_QUERY } from '@condo/domains/miniapp/gql.js'
import { PROMO_BLOCK_TEXTS_VARIANTS_TO_PROPS, ALL_APP_CATEGORIES } from '@condo/domains/miniapp/constants'
import Input from '@condo/domains/common/components/antd/Input'
import { useSearch } from '@condo/domains/common/hooks/useSearch'
import { AppCard } from './AppCard'

const SECTION_SPACING: RowProps['gutter'] = [0, 60]
const CONTENT_SPACING: RowProps['gutter'] = [40, 40]
const FULL_COL_SPAN: ColProps['span'] = 24
const VERT_ALIGN_STYLES: CSSProperties = { display: 'flex', flexDirection: 'row', alignItems: 'center' }
const BANNER_CHANGE_DELAY = 6000 // 6 sec
const BANNER_CHANGE_SPEED = 1200 // 1.2 sec
const ALL_APPS_CATEGORY = 'RECOMMENDED'
const CONNECTED_APPS_CATEGORY = 'CONNECTED'
const ALL_SECTIONS = [
    ALL_APPS_CATEGORY,
    CONNECTED_APPS_CATEGORY,
    ...ALL_APP_CATEGORIES,
]


export const CatalogPageContent: React.FC = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.miniapps' })
    const BannerMoreMessage = intl.formatMessage({ id:'miniapps.catalog.banner.more' })
    const CategoriesTitles = Object.assign({}, ...ALL_SECTIONS.map(category => ({
        [category]: intl.formatMessage({ id: `miniapps.categories.${category}.name` }),
    })))
    const SearchPlaceHolder = intl.formatMessage({ id: 'miniapps.search.placeholder' })

    const router = useRouter()
    const { query: { tab } } = router

    // BANNER HOOKS
    const { objs: promoBlocks } = B2BAppPromoBlock.useObjects({
        sortBy: [SortB2BAppPromoBlocksBy.PriorityDesc, SortB2BAppPromoBlocksBy.CreatedAtDesc],
    })

    const handleBannerClick = useCallback((targetUrl, isExternal) => {
        if (!isExternal) {
            router.push(targetUrl)
        } else if (typeof window !== 'undefined') {
            window.open(targetUrl, '_blank')
        }
    }, [router])

    const [search, handleSearchChange] = useSearch()
    const handleSearchInputChange: React.ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
        handleSearchChange(event.target.value)
    }, [handleSearchChange])

    // APPS HOOKS
    const userOrganization = useOrganization()
    const userOrganizationId = get(userOrganization, ['organization', 'id'])
    const [miniapps, setMiniapps] = useState([])
    const [appsCategories, setAppsCategories] = useState<Array<string>>([])
    const [fetchMiniapps] = useLazyQuery(ALL_MINI_APPS_QUERY, {
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
                        search,
                    },
                },
            })
        } else {
            setMiniapps([])
        }
    }, [search, userOrganizationId, fetchMiniapps])
    useDeepCompareEffect(() => {
        const categories = []
        if (miniapps.length > 0) {
            categories.push(ALL_APPS_CATEGORY)
        }
        if (miniapps.some(app => app.connected)) {
            categories.push(CONNECTED_APPS_CATEGORY)
        }
        const fetchedAppsCategories = new Set()
        for (const app of miniapps) {
            fetchedAppsCategories.add(app.category)
        }
        for (const category of ALL_APP_CATEGORIES) {
            if (fetchedAppsCategories.has(category)) {
                categories.push(category)
            }
        }
        setAppsCategories(categories)
    }, [miniapps])
    // TAB HOOKS
    const selectedTab = (tab && !Array.isArray(tab) && appsCategories.includes(tab.toUpperCase())) ? tab.toUpperCase() : ALL_APPS_CATEGORY
    const handleTabChange = useCallback((newTab) => {
        const newPath = `${router.route}?tab=${newTab}`
        router.push(newPath)
    }, [router])

    return (
        <>
            <PageHeader title={<Typography.Title>{PageTitle}</Typography.Title>} spaced/>
            <Row gutter={SECTION_SPACING}>
                {Boolean(promoBlocks.length) && (
                    <Col span={FULL_COL_SPAN}>
                        <Carousel
                            autoplay
                            autoplaySpeed={BANNER_CHANGE_DELAY}
                            speed={BANNER_CHANGE_SPEED}
                        >
                            {promoBlocks.map(promoBlock => (
                                <Banner
                                    key={promoBlock.id}
                                    title={promoBlock.title}
                                    subtitle={promoBlock.subtitle}
                                    backgroundColor={promoBlock.backgroundColor}
                                    actionText={BannerMoreMessage}
                                    imgUrl={get(promoBlock, ['backgroundImage', 'publicUrl'])}
                                    {...PROMO_BLOCK_TEXTS_VARIANTS_TO_PROPS[promoBlock.textVariant]}
                                    onClick={() => handleBannerClick(promoBlock.targetUrl, promoBlock.external)}
                                />
                            ))}
                        </Carousel>
                    </Col>
                )}
                {Boolean(miniapps.length || search) && (
                    <Col span={FULL_COL_SPAN}>
                        <Row gutter={CONTENT_SPACING}>
                            {/*TODO: Replace constant with breakpoints*/}
                            <Col span={18} style={VERT_ALIGN_STYLES}>
                                <Typography.Title level={2}>
                                    {CategoriesTitles[selectedTab]}
                                </Typography.Title>
                            </Col>
                            <Col span={6}>
                                <Input
                                    placeholder={SearchPlaceHolder}
                                    onChange={handleSearchInputChange}
                                    value={search}
                                    allowClear
                                />
                            </Col>
                            <Col span={18}>
                                <Row gutter={CONTENT_SPACING}>
                                    {miniapps.map(app => (
                                        <Col span={8} key={`${app.category}:${app.name}`}>
                                            <AppCard name={app.name}/>
                                        </Col>
                                    ))}
                                </Row>
                            </Col>
                            <Col span={6}>
                                {appsCategories.map(category => (
                                    <div key={category}>{category}</div>
                                ))}
                            </Col>
                        </Row>
                    </Col>
                )}
            </Row>
        </>
    )
}