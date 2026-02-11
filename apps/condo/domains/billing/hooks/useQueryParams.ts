import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'

import { PaymentTypes } from '@condo/domains/acquiring/utils/clientSchema'
import { ACCRUALS_TAB_KEY, PAYMENTS_TAB_KEY, EXTENSION_TAB_KEY, PAYMENTS_TYPE_LIST, PAYMENTS_TYPE_REGISTRY } from '@condo/domains/billing/constants/constants'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'

type ParamUpdateHandler = (key: string) => void

const DEFAULT_TABS = [ACCRUALS_TAB_KEY, PAYMENTS_TAB_KEY]
const PAYMENTS_TYPES = [PAYMENTS_TYPE_LIST, PAYMENTS_TYPE_REGISTRY]

export function useQueryParams (extensionTabKeys: Array<string> = []): [string, PaymentTypes, ParamUpdateHandler] {
    const availableTabs = useMemo(() => ([
        ...DEFAULT_TABS,
        ...extensionTabKeys.filter(Boolean),
    ]), [extensionTabKeys])

    const router = useRouter()
    const { tab, type } = parseQuery(router.query)

    const normalizedTab = useMemo(() => {
        if (tab === EXTENSION_TAB_KEY && extensionTabKeys.length > 0) {
            return extensionTabKeys[0]
        }
        return tab
    }, [extensionTabKeys, tab])

    const activeTab = useMemo(() => availableTabs.includes(normalizedTab) ? normalizedTab : availableTabs[0],  [availableTabs, normalizedTab])
    const activeType = useMemo(() => PAYMENTS_TYPES.includes(type) ? type : PAYMENTS_TYPES[0], [type])

    const changeRouteToActiveParams = useCallback(async (newParameters) => {
        await updateQuery(router, { newParameters }, { resetOldParameters: true, routerAction: 'replace', shallow: true } )
    }, [router])

    useDeepCompareEffect(() => {
        if (!activeTab && !activeType) return
        if (!tab || tab !== activeTab) {
            changeRouteToActiveParams({ tab: activeTab })
        }
        // NOTE: change type param only for Payments Tab
        if (activeTab === PAYMENTS_TAB_KEY && (!type || type !== activeType)) {
            changeRouteToActiveParams({ type: activeType, tab: activeTab })
        }
    }, [activeTab, activeType, changeRouteToActiveParams, tab, type])

    const handleUpdateTab = useCallback(async (activeTab) => {
        await changeRouteToActiveParams({ tab: activeTab })
    }, [changeRouteToActiveParams])

    return [activeTab, activeType as PaymentTypes, handleUpdateTab]
}
