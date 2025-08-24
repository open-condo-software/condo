import get from 'lodash/get'
import groupBy from 'lodash/groupBy'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

import { useIntl } from '@open-condo/next/intl'
import type { ItemGroupProps } from '@open-condo/ui'

import { BankCostItem } from '@condo/domains/banking/utils/clientSchema'

import type {
    BankCostItem as BankCostItemType,
    BankTransaction as BankTransactionType,
    BankContractorAccount as BankContractorAccountType,
} from '@app/condo/schema'

interface IBankCostItemContext {
    bankCostItems: Array<BankCostItemType>
    bankCostItemGroups: ItemGroupProps[]
    incomeCostItems: Array<BankCostItemType>
    loading: boolean
    selectedItem: BankTransactionType | BankContractorAccountType | null
    setSelectedItem: React.Dispatch<React.SetStateAction<BankTransactionType | BankContractorAccountType>>
}
export type PropertyReportTypes = 'income' | 'withdrawal' | 'contractor'

const BankCostItemContext = createContext<IBankCostItemContext>({
    bankCostItems: [],
    loading: false,
    bankCostItemGroups: [],
    incomeCostItems: [],
    selectedItem: null,
    setSelectedItem: () => null,
})

export const useBankCostItemContext = (): IBankCostItemContext => useContext<IBankCostItemContext>(BankCostItemContext)

export const BankCostItemProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const intl = useIntl()
    const { objs: bankCostItems, loading } = BankCostItem.useObjects({}, { fetchPolicy: 'cache-first' })

    const bankCostItemGroups = useRef<ItemGroupProps[]>([])
    const incomeCostItems = useRef<Array<BankCostItemType>>([])
    const [selectedItem, setSelectedItem] = useState<BankTransactionType | BankContractorAccountType | null>(null)

    useEffect(() => {
        if (!loading) {
            bankCostItemGroups.current = []
            incomeCostItems.current = []

            const categoryObject = groupBy(bankCostItems.filter(costItem => costItem.isOutcome), (costItem) => costItem.category.id)

            Object.values(categoryObject).forEach(costItems => {
                bankCostItemGroups.current.push({
                    name: intl.formatMessage({ id: `banking.category.${get(costItems, ['0', 'category', 'name'])}.name` as FormatjsIntl.Message['ids'] }),
                    options: costItems.map(costItem => ({
                        label: intl.formatMessage({ id: `banking.costItem.${costItem.name}.name` as FormatjsIntl.Message['ids'] }),
                        value: costItem.id,
                    })),
                })
            })

            incomeCostItems.current = bankCostItems
                .filter(costItem => !costItem.isOutcome)
                .map(costItem => ({
                    ...costItem,
                    name: intl.formatMessage({ id: `banking.costItem.${costItem.name}.name` as FormatjsIntl.Message['ids'] }),
                }))
        }
    }, [bankCostItems, loading, intl])

    return (
        <BankCostItemContext.Provider
            value={{
                bankCostItems,
                loading,
                bankCostItemGroups: bankCostItemGroups.current,
                incomeCostItems: incomeCostItems.current,
                selectedItem,
                setSelectedItem,
            }}
        >
            {children}
        </BankCostItemContext.Provider>
    )
}
