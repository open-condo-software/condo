import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'

import { MarketplacePageTypes, MARKETPLACE_PAGE_TYPES } from '@condo/domains/marketplace/utils/clientSchema'

type TabUpdateHandler = (key: string) => void

export function useQueryTab (tabs: MarketplacePageTypes[]): [MarketplacePageTypes, TabUpdateHandler] {
    const router = useRouter()

    const [currentTab, setCurrentTab] = useState<MarketplacePageTypes>(tabs[0])

    useDeepCompareEffect(() => {
        const { tab: tabFromQuery } = router.query

        const tab = typeof tabFromQuery === 'string' ? MARKETPLACE_PAGE_TYPES[tabFromQuery] : tabs[0]

        setCurrentTab(tab)

    }, [router.query, tabs])

    const handleUpdateTab = useCallback((newKey: string) => {
        return router.push({ query: { tab: newKey } })
    }, [router])

    if (!tabs || tabs.length < 1) return null

    return [currentTab, handleUpdateTab]
}