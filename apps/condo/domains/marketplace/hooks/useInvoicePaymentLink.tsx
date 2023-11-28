import { useApolloClient } from '@apollo/client'
import get from 'lodash/get'
import getConfig from 'next/config'
import { useCallback } from 'react'

import { GENERATE_PAYMENT_LINK_QUERY } from '@condo/domains/acquiring/gql'
import { getClientSideSenderInfo } from '@condo/domains/common/utils/userid.utils'


const { publicRuntimeConfig: { serverUrl } } = getConfig()

export const useInvoicePaymentLink = () => {
    const client = useApolloClient()

    return useCallback(async (invoiceIds: string[]) => {
        try {
            const data = await client.query({
                query: GENERATE_PAYMENT_LINK_QUERY,
                variables: {
                    data: {
                        dv: 1,
                        sender: getClientSideSenderInfo(),
                        invoices: invoiceIds.map(id => ({ id })),
                        callbacks: {
                            successUrl: `${serverUrl}/marketplace/invoice/payment/success`,
                            failureUrl: `${serverUrl}/marketplace/invoice/payment/failure`,
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