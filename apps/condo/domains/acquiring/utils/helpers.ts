import { Payment, PaymentsFile } from '@app/condo/schema'
import isString from 'lodash/isString'
import { NextRouter } from 'next/router'

export interface IFilters extends Pick<Payment, 'advancedAt' | 'accountNumber' | 'receipt'> {
    search?: string
    advancedAt?: string
    accountNumber?: string
    address?: Array<string>
    type?: Array<string>
}

export const getInitialSelectedRegistryKeys = (router: NextRouter) => {
    if ('selectedRegistryIds' in router.query && isString(router.query.selectedRegistryIds)) {
        try {
            return JSON.parse(router.query.selectedRegistryIds as string)
        } catch (error) {
            console.warn('Failed to parse property value "selectedRegistryIds"', error)
            return []
        }
    }
    return []
}


export interface IPaymentsFilesFilters extends Pick<PaymentsFile, 'loadedAt' | 'paymentOrder'> {
    search?: string
    loadedAt?: string
    paymentOrder?: string
}