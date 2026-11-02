import { PaymentWhereInput, PaymentsFileWhereInput } from '@app/condo/schema'

import { useQuery } from '@open-condo/next/apollo'

import { SUM_PAYMENTS_FILES_QUERY, SUM_PAYMENTS_QUERY } from '@condo/domains/acquiring/gql'

type UsePaymentsSumParams =
    { paymentsFilesWhere: PaymentsFileWhereInput, paymentsWhere?: never }
    | { paymentsFilesWhere?: never, paymentsWhere: PaymentWhereInput }

export default function usePaymentsSum (params: UsePaymentsSumParams) {
    const query = params.paymentsFilesWhere ? SUM_PAYMENTS_FILES_QUERY : SUM_PAYMENTS_QUERY

    return useQuery(query, {
        fetchPolicy: 'network-only',
        variables: {
            data: {
                ...params.paymentsWhere ? { paymentsWhere: params.paymentsWhere } : {},
                ...params.paymentsFilesWhere ? { paymentsFilesWhere: params.paymentsFilesWhere } : {},
            },
        },
    })
}
