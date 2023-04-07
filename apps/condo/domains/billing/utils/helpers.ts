import { BillingCategory, BillingReceipt } from '@app/condo/schema'

export interface IFilters extends Pick<BillingReceipt, 'category'> {
    category?: BillingCategory
}