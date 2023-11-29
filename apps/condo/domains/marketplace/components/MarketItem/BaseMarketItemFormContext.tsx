import { InvoiceContext } from '@app/condo/schema'
import { FormInstance } from 'antd'
import { createContext, useContext } from 'react'

import { MarketItemFormValuesType, PriceFormValuesType } from '@condo/domains/marketplace/utils/clientSchema/MarketItem'

export type BaseMarketItemFormContextType = {
    form: FormInstance
    getUpdatedPricesField: (priceFormName: number, newFields: PriceFormValuesType) => Pick<MarketItemFormValuesType, 'prices'>
    isSmallScreen: boolean
    invoiceContext: InvoiceContext
    marketItemId?: string
}

export const BaseMarketItemFormContext = createContext<BaseMarketItemFormContextType>({
    form: null,
    getUpdatedPricesField: null,
    isSmallScreen: null,
    invoiceContext: null,
    marketItemId: null,
})

export const useMarketItemFormContext = () => {
    return useContext(BaseMarketItemFormContext)
}