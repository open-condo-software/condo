import React from 'react'

import { CreateInvoiceForm } from './CreateInvoiceForm'
import { UpdateInvoiceForm } from './UpdateInvoiceForm'

interface IInvoiceFormProps {
    id?: string
}

export const InvoiceForm: React.FC<IInvoiceFormProps> = ({ id }) => {
    return (id ? <UpdateInvoiceForm id={id}/> : <CreateInvoiceForm /> )
}
