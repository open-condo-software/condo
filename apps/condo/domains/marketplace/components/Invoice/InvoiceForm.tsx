import { Invoice } from '@app/condo/schema'
import React from 'react'

import { CreateInvoiceForm } from './CreateInvoiceForm'
import { UpdateInvoiceForm } from './UpdateInvoiceForm'

interface IInvoiceFormProps {
    invoice?: Invoice
}

export const InvoiceForm: React.FC<IInvoiceFormProps> = ({ invoice }) => {
    return (invoice ? <UpdateInvoiceForm invoice={invoice}/> : <CreateInvoiceForm /> )
}
