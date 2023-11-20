import { Invoice } from '@app/condo/schema'
import { useRouter } from 'next/router'
import React from 'react'

import { CreateInvoiceForm } from './CreateInvoiceForm'
import { UpdateInvoiceForm } from './UpdateInvoiceForm'

interface IInvoiceFormProps {
    invoice?: Invoice
}

export const InvoiceForm: React.FC<IInvoiceFormProps> = ({ invoice }) => {
    const router = useRouter()

    const afterUpdateAction = async () => {
        await router.push(`/marketplace/invoice/${invoice.id}`)
    }

    return invoice ? (
        <UpdateInvoiceForm
            invoice={invoice}
            afterAction={afterUpdateAction}
        />
    ) : <CreateInvoiceForm />
}
