import { MarketItem } from '@app/condo/schema'
import React from 'react'

import { CreateMarketItemForm } from './CreateMarketItemForm'
import { UpdateMarketItemForm } from './UpdateMarketItemForm'

interface IMarketItemFormProps {
    marketItem?: MarketItem
}

export const MarketItemForm: React.FC<IMarketItemFormProps> = ({ marketItem }) => {
    return (marketItem ? <UpdateMarketItemForm marketItem={marketItem}/> : <CreateMarketItemForm /> )
}
