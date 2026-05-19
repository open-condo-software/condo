type InvoicesPaymentParams = {
    invoiceIds: Array<string>
}

type MultiPaymentParams = {
    multiPaymentId: string
}

export type RequestPaymentParams = InvoicesPaymentParams | MultiPaymentParams

export type RequestPaymentData = {
    multiPaymentId: string
    success: boolean
}
