import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'

type TabUpdateHandler = (key: string) => void

export function useQueryTab (tabs: string[]): [string, TabUpdateHandler] {
    const router = useRouter()

    const [currentTab, setCurrentTab] = useState<string>(tabs[0])

    useDeepCompareEffect(() => {
        const { tab } = router.query

        if (!Array.isArray(tab) && tabs.includes(tab)) {
            setCurrentTab(tab)
        } else {
            setCurrentTab(tabs[0])
        }

    }, [router.query, tabs])

    const handleUpdateTab = useCallback((newKey: string) => {
        return router.push({ query: { tab: newKey } })
    }, [router])

    if (!tabs || tabs.length < 1) return null

    return [currentTab, handleUpdateTab]
}