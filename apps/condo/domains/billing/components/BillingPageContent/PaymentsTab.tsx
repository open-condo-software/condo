import get from 'lodash/get'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Typography } from '@open-condo/ui'

import PaymentsTable from '@condo/domains/acquiring/components/payments/PaymentsTable'
import { PAYMENT_DONE_STATUS, PAYMENT_WITHDRAWN_STATUS } from '@condo/domains/acquiring/constants/payment'
import { Payment } from '@condo/domains/acquiring/utils/clientSchema'
import { BasicEmptyListView } from '@condo/domains/common/components/EmptyListView'
import { Loader } from '@condo/domains/common/components/Loader'

const SEARCHING_DINO_IMG = 'dino/searching@2x.png'
const IMG_STYLES: CSSProperties = { marginBottom: 24 }
const TEXT_GAP = 16


export const PaymentsTab: React.FC = () => {
    const intl = useIntl()
    const NoPaymentsTitle = intl.formatMessage({ id:'accrualsAndPayments.payments.noPaymentsYet.title' })
    const NoPaymentsMessage = intl.formatMessage({ id:'accrualsAndPayments.payments.noPaymentsYet.message' })

    const { organization } = useOrganization()
    const orgId = get(organization, 'id', null)
    const { objs: anyPayments, loading: anyPaymentsLoading, error: anyPaymentsError } = Payment.useObjects({
        where: {
            organization: { id: orgId },
            status_in: [PAYMENT_WITHDRAWN_STATUS, PAYMENT_DONE_STATUS],
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
            <BasicEmptyListView image={SEARCHING_DINO_IMG} imageStyle={IMG_STYLES} spaceSize={TEXT_GAP}>
                <Typography.Title level={3}>{NoPaymentsTitle}</Typography.Title>
                <Typography.Text type='secondary'>{NoPaymentsMessage}</Typography.Text>
            </BasicEmptyListView>
        )
    }

    return <PaymentsTable/>
}