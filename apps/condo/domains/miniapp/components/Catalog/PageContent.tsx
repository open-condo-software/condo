import React, { useCallback, useEffect, useState } from 'react'
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
import { PROMO_BLOCK_TEXTS_VARIANTS_TO_PROPS, B2B_APP_CATEGORIES } from '@condo/domains/miniapp/constants'

const SECTION_SPACING: RowProps['gutter'] = [0, 60]
const FULL_COL_SPAN: ColProps['span'] = 24
const BANNER_CHANGE_DELAY = 6000 // 6 sec
const BANNER_CHANGE_SPEED = 1200 // 1.2 sec
const ALL_APPS_CATEGORY = 'RECOMMENDED'
const CONNECTED_APPS_CATEGORY = 'CONNECTED'

export const CatalogPageContent: React.FC = () => {
    const intl = useIntl()
    const PageTitle = intl.formatMessage({ id: 'global.section.miniapps' })
    const BannerMoreMessage = intl.formatMessage({ id:'miniapps.catalog.banner.more' })

    const router = useRouter()

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
                    },
                },
            })
        } else {
            setMiniapps([])
        }
    }, [userOrganizationId, fetchMiniapps])
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
        for (const category of B2B_APP_CATEGORIES) {
            if (fetchedAppsCategories.has(category)) {
                categories.push(category)
            }
        }
        setAppsCategories(categories)
    }, [miniapps])

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
            </Row>
        </>
    )
}