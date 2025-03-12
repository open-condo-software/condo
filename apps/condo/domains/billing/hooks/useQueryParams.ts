import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'

import { useDeepCompareEffect } from '@open-condo/codegen/utils/useDeepCompareEffect'

import { PaymentTypes } from '@condo/domains/acquiring/utils/clientSchema'
import { ACCRUALS_TAB_KEY, PAYMENTS_TAB_KEY, EXTENSION_TAB_KEY, PAYMENTS_TYPE_LIST, PAYMENTS_TYPE_REGISTRY } from '@condo/domains/billing/constants/constants'
import { updateQuery } from '@condo/domains/common/utils/helpers'
import { parseQuery } from '@condo/domains/common/utils/tables.utils'

type ParamUpdateHandler = (key: string) => void

const AVAILABLE_TABS = [ACCRUALS_TAB_KEY, PAYMENTS_TAB_KEY]
const PAYMENTS_TYPES = [PAYMENTS_TYPE_LIST, PAYMENTS_TYPE_REGISTRY]

export function useQueryParams (includeExtension: boolean): [string, PaymentTypes, ParamUpdateHandler] {
    if (includeExtension) {
        AVAILABLE_TABS.push(EXTENSION_TAB_KEY)
    }

    const router = useRouter()
    const { tab, type } = parseQuery(router.query)

    const activeTab = useMemo(() => AVAILABLE_TABS.includes(tab) ? tab : AVAILABLE_TABS[0],  [tab])
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