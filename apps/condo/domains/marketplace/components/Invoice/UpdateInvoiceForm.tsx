import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useCallback } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'

import { Invoice, InvoiceContext } from '@condo/domains/marketplace/utils/clientSchema'

import { BaseInvoiceForm } from './BaseInvoiceForm'

type UpdateInvoiceFormProps = {
    id: string
}

export const UpdateInvoiceForm: React.FC<UpdateInvoiceFormProps> = ({ id }) => {
    const intl = useIntl()
    const CreatePropertyMessage = intl.formatMessage({ id: 'pages.condo.property.index.CreatePropertyButtonLabel' })

    const router = useRouter()
    const { organization, link } = useOrganization()

    const updateInvoiceAction = Invoice.useUpdate({}, async () => {
        //
    })

    const handleUpdateInvoice = useCallback(async (values) => {
        console.log(values)
    }, [])

    return (
        <BaseInvoiceForm
            isCreateForm
            action={handleUpdateInvoice}
            organization={organization}
            role={link}
        />
    )
}
