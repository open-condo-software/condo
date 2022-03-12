import { Payment } from '@app/condo/schema'

export interface IFilters extends Pick<Payment, 'advancedAt' | 'accountNumber' | 'receipt'> {
    search?: string
    advancedAt?: string
    accountNumber?: string
    address?: Array<string>
    type?: Array<string>
}
