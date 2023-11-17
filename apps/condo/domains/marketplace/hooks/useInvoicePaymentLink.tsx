import { useApolloClient } from '@apollo/client'
import get from 'lodash/get'
import { useCallback } from 'react'

import { GENERATE_PAYMENT_LINK_QUERY } from '@condo/domains/acquiring/gql'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'


export const useInvoicePaymentLink = () => {
    const client = useApolloClient()

    return useCallback(async (invoiceId) => {
        try {
            const data = await client.query({
                query: GENERATE_PAYMENT_LINK_QUERY,
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        invoices: [{ id: invoiceId }],
                        callbacks: {
                            // replace after deciding where to redirect
                            successUrl: 'https://doma.ai',
                            failureUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        },
                    },
                },
            })

            const paymentLink = get(data, 'data.result.paymentUrl')

            return { paymentLink }
        } catch (e) {
            console.error(e)

            return { paymentLink: null, error: true }
        }
    }, [client])
}