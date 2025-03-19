import { PaymentWhereInput, PaymentsFileWhereInput } from '@app/condo/schema'

import { useQuery } from '@open-condo/next/apollo'

import { SUM_PAYMENTS_QUERY } from '@condo/domains/acquiring/gql'

type UsePaymentsSumParams =
    | { paymentsFilesWhere: PaymentsFileWhereInput, paymentsWhere?: never }
    | { paymentsFilesWhere?: never, paymentsWhere: PaymentWhereInput }

export default function usePaymentsSum (params: UsePaymentsSumParams) {
    return useQuery(SUM_PAYMENTS_QUERY, {
        fetchPolicy: 'network-only',
        variables: {
            data: {
                ...params.paymentsWhere ? { paymentsWhere: params.paymentsWhere } : {},
                ...params.paymentsFilesWhere ? { paymentsFilesWhere: params.paymentsFilesWhere } : {},
            },
        },
    })
}
