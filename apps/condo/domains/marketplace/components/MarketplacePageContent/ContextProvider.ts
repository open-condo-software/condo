import { createContext, useContext } from 'react'

import type { InvoiceContext as InvoiceContextSchema } from '@app/condo/schema'

type IInvoiceContext = {
    invoiceContext: InvoiceContextSchema
    refetchInvoiceContext: () => void
}

export const InvoiceContext = createContext<IInvoiceContext>({
    invoiceContext: null,
    refetchInvoiceContext: () => ({}),
})

export function useInvoiceContext (): IInvoiceContext {
    return useContext(InvoiceContext)
}