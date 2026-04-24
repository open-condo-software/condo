import { PaymentStatusType } from '@app/condo/schema'
import get from 'lodash/get'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import PaymentsTable from '@condo/domains/acquiring/components/payments/PaymentsTable'
import { Payment } from '@condo/domains/acquiring/utils/clientSchema'
import { EmptyListContent } from '@condo/domains/common/components/EmptyListContent'
import { Loader } from '@condo/domains/common/components/Loader'

const SEARCHING_DINO_IMG = '/dino/searching@2x.png'

const Payments = (): JSX.Element => {
    const intl = useIntl()
    const NoPaymentsTitle = intl.formatMessage({ id:'accrualsAndPayments.payments.noPaymentsYet.title' })
    const NoPaymentsMessage = intl.formatMessage({ id:'accrualsAndPayments.payments.noPaymentsYet.message' })

    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)
    const { objs: anyPayments, loading: anyPaymentsLoading, error: anyPaymentsError } = Payment.useObjects({
        where: {
            organization: { id: orgId },
            status_in: [PaymentStatusType.Withdrawn, PaymentStatusType.Done],
            invoice_is_null: true,
        },
        first: 1,
    })

    if (anyPaymentsLoading) {
        return <Loader size='large' fill/>
    }

    if (anyPaymentsError) {
        return <Typography.Title>{anyPaymentsError}</Typography.Title>
    }

    if (!anyPayments.length) {
        return (
            <EmptyListContent
                image={SEARCHING_DINO_IMG}
                label={NoPaymentsTitle}
                message={NoPaymentsMessage}
            />
        )
    }

    return <PaymentsTable/>
}

export default Payments