import { useCheckPaymentsFilesExistenceQuery } from '@app/condo/gql'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import PaymentFilesTable from '@condo/domains/acquiring/components/payments/PaymentFilesTable'
import { useBillingAndAcquiringContexts } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { Loader } from '@condo/domains/common/components/Loader'


const SEARCHING_DINO_IMG = '/dino/searching@2x.png'

const PaymentsFiles = (): JSX.Element => {
    const intl = useIntl()
    const NoPaymentsFilesTitle = intl.formatMessage({ id:'accrualsAndPayments.paymentsFiles.noPaymentsFilesYet.title' })
    const NoPaymentsFilesMessage = intl.formatMessage({ id:'accrualsAndPayments.paymentsFiles.noPaymentsFilesYet.message' })

    const { acquiringContext } = useBillingAndAcquiringContexts()

    const {
        data: anyPaymentsFiles,
        error: anyPaymentsFilesError,
        loading: isAnyPaymentsFilesLoading,
    } = useCheckPaymentsFilesExistenceQuery({
        variables: {
            where: {
                context: { id: acquiringContext.id },
            },
        },
        skip: !acquiringContext.id,
    })

    if (isAnyPaymentsFilesLoading) {
        return <Loader size='large' fill/>
    }

    if (anyPaymentsFilesError) {
        return <Typography.Title>{anyPaymentsFilesError.message}</Typography.Title>
    }

    if (!anyPaymentsFiles?.paymentsFiles?.length) {
        return (
            <EmptyListContent
                image={SEARCHING_DINO_IMG}
                label={NoPaymentsFilesTitle}
                message={NoPaymentsFilesMessage}
            />
        )
    }

    return <PaymentFilesTable />
}

export default PaymentsFiles

