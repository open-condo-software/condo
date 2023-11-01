import { createContext, useContext } from 'react'

import type { InvoiceContext as InvoiceContextSchema } from '@app/condo/schema'

type IInvoiceContext = {
    invoiceContext: InvoiceContextSchema
    refetchInvoice: () => void
}

export const InvoiceContext = createContext<IInvoiceContext>({
    invoiceContext: null,
    refetchInvoice: () => ({}),
})

export function useBillingAndAcquiringContexts (): IInvoiceContext {
    return useContext(InvoiceContext)
}