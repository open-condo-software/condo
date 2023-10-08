import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'

import { ACCRUALS_TAB_KEY, PAYMENTS_TAB_KEY, EXTENSION_TAB_KEY } from '@condo/domains/billing/constants/constants'
type TabUpdateHandler = (key: string) => void

export function useQueryTab (includeExtension: boolean): [string, TabUpdateHandler] {
    const availableTabs = [ACCRUALS_TAB_KEY, PAYMENTS_TAB_KEY]
    if (includeExtension) {
        availableTabs.push(EXTENSION_TAB_KEY)
    }

    const router = useRouter()
    const [currentTab, setCurrentTab] = useState<string>(ACCRUALS_TAB_KEY)

    useDeepCompareEffect(() => {
        const { tab } = router.query

        if (!Array.isArray(tab) && availableTabs.includes(tab)) {
            setCurrentTab(tab)
        } else {
            setCurrentTab(ACCRUALS_TAB_KEY)
        }

    }, [router.query, availableTabs])

    const handleUpdateTab = useCallback((newKey: string) => {
        return router.push({ query: { tab: newKey } })
    }, [router])

    return [currentTab, handleUpdateTab]
}