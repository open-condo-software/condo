import { Invoice } from '@app/condo/schema'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'


import { useOrganization } from '@open-condo/next/organization'

import { CreateInvoiceForm } from './CreateInvoiceForm'
import { UpdateInvoiceForm } from './UpdateInvoiceForm'


interface IInvoiceFormProps {
    invoice?: Invoice
}

export const InvoiceForm: React.FC<IInvoiceFormProps> = ({ invoice }) => {
    const { organization } = useOrganization()
    const router = useRouter()
    const afterUpdateAction = useCallback(async () => {
        await router.push(`/marketplace/invoice/${get(invoice, 'id')}`)
    }, [invoice, router])
    const afterCreateAction = useCallback(async () => {
        await router.push('/marketplace?tab=bills')
    }, [router])

    return invoice ? (
        <UpdateInvoiceForm
            organizationId={get(organization, 'id')}
            invoice={invoice}
            afterAction={afterUpdateAction}
        />
    ) : (
        <CreateInvoiceForm
            organizationId={get(organization, 'id')}
            afterAction={afterCreateAction}
        />
    )
}
