import get from 'lodash/get'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'
import { useOrganization } from '@open-condo/next/organization'


import { MarketplacePageTypes, MARKETPLACE_PAGE_TYPES } from '@condo/domains/marketplace/utils/clientSchema'

type TabUpdateHandler = (key: string) => void

export function useQueryTab (tabs: MarketplacePageTypes[]): [MarketplacePageTypes, TabUpdateHandler] {
    const router = useRouter()
    const { link } = useOrganization()
    const canReadMarketItems = get(link, 'role.canReadMarketItems', false)
    const canReadPaymentsWithInvoices = get(link, 'role.canReadPaymentsWithInvoices', false)
    const canReadInvoices = get(link, 'role.canReadInvoices', false)

    const [currentTab, setCurrentTab] = useState<MarketplacePageTypes>(tabs[0])

    useDeepCompareEffect(() => {
        const { tab: tabFromQuery } = router.query

        let tabIndex
        if (canReadInvoices) tabIndex = 0
        else if (canReadPaymentsWithInvoices) tabIndex = 1
        else if (canReadMarketItems) tabIndex = 2

        const tab = typeof tabFromQuery === 'string' ? MARKETPLACE_PAGE_TYPES[tabFromQuery] : tabs[tabIndex]

        setCurrentTab(tab)

    }, [router.query, tabs])

    const handleUpdateTab = useCallback((newKey: string) => {
        return router.push({ query: { tab: newKey } })
    }, [router])

    if (!tabs || tabs.length < 1) return null

    return [currentTab, handleUpdateTab]
}