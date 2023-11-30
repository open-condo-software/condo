import { InvoiceContext } from '@app/condo/schema'
import { FormInstance } from 'antd'
import React, { createContext, useContext } from 'react'

import { IUploadComponentProps } from '@condo/domains/common/components/MultipleFileUpload'
import { MarketItemFormValuesType, PriceFormValuesType } from '@condo/domains/marketplace/utils/clientSchema/MarketItem'


export type BaseMarketItemFormContextType = {
    form: FormInstance
    getUpdatedPricesField: (priceFormName: number, newFields: PriceFormValuesType) => Pick<MarketItemFormValuesType, 'prices'>
    invoiceContext: InvoiceContext
    marketItemId?: string
    initialValues?: MarketItemFormValuesType
    UploadComponent: React.FC<IUploadComponentProps>
}

export const BaseMarketItemFormContext = createContext<BaseMarketItemFormContextType>({
    form: null,
    getUpdatedPricesField: null,
    invoiceContext: null,
    marketItemId: null,
    initialValues: null,
    UploadComponent: null,
})

export const useMarketItemFormContext = () => {
    return useContext(BaseMarketItemFormContext)
}