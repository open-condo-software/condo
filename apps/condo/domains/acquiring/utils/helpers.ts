import { Payment, PaymentsFile } from '@app/condo/schema'

export interface IFilters extends Pick<Payment, 'advancedAt' | 'accountNumber' | 'receipt'> {
    search?: string
    advancedAt?: string
    accountNumber?: string
    address?: Array<string>
    type?: Array<string>
}


export interface IPaymentsFilesFilters extends Pick<PaymentsFile, 'dateLoad' | 'paymentOrder'> {
    search?: string
    dateLoad?: string
    paymentOrder?: string
}