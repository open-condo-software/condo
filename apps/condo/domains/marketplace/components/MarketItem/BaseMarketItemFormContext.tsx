import { FormInstance } from 'antd'
import { createContext, useContext } from 'react'

import { MarketItemFormValuesType, PriceFormValuesType } from '@condo/domains/marketplace/utils/clientSchema/MarketItem'

export type BaseMarketItemFormContextType = {
    form: FormInstance
    marketItemId?: string
    getUpdatedPricesField: (priceFormName: number, newFields: PriceFormValuesType) => Pick<MarketItemFormValuesType, 'prices'>
}

export const BaseMarketItemFormContext = createContext<BaseMarketItemFormContextType>({
    form: null,
    marketItemId: null,
    getUpdatedPricesField: null,
})

export const useMarketItemFormContext = () => {
    return useContext(BaseMarketItemFormContext)
}