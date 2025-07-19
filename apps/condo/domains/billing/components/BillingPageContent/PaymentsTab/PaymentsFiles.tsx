import { useCheckPaymentsFilesExistenceQuery } from '@app/condo/gql'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import PaymentFilesTable from '@condo/domains/acquiring/components/payments/PaymentFilesTable'
import { useBillingAndAcquiringContexts } from '@condo/domains/billing/components/BillingPageContent/ContextProvider'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Loader } from '@condo/domains/common/components/Loader'


const SEARCHING_DINO_IMG = 'dino/searching@2x.png'
const IMG_STYLES: CSSProperties = { marginBottom: 24 }
const TEXT_GAP = 16

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
            <BasicEmptyListView image={SEARCHING_DINO_IMG} imageStyle={IMG_STYLES} spaceSize={TEXT_GAP}>
                <Typography.Title level={3}>{NoPaymentsFilesTitle}</Typography.Title>
                <Typography.Text type='secondary'>{NoPaymentsFilesMessage}</Typography.Text>
            </BasicEmptyListView>
        )
    }

    return <PaymentFilesTable />
}

export default PaymentsFiles

