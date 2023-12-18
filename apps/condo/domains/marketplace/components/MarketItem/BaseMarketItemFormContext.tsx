import { FormInstance } from 'antd'
import { createContext, useContext } from 'react'

import { DEFAULT_INVOICE_CURRENCY_CODE } from '@condo/domains/marketplace/constants'
import { MarketItemFormValuesType, PriceFormValuesType } from '@condo/domains/marketplace/utils/clientSchema/MarketItem'

export type BaseMarketItemFormContextType = {
    form: FormInstance
    getUpdatedPricesField: (priceFormName: number, newFields: PriceFormValuesType) => Pick<MarketItemFormValuesType, 'prices'>
    currencyCode: string
    marketItemId?: string
    initialValues?: MarketItemFormValuesType
}

export const BaseMarketItemFormContext = createContext<BaseMarketItemFormContextType>({
    form: null,
    getUpdatedPricesField: null,
    currencyCode: DEFAULT_INVOICE_CURRENCY_CODE,
    marketItemId: null,
    initialValues: null,
})

export const useMarketItemFormContext = () => {
    return useContext(BaseMarketItemFormContext)
}
