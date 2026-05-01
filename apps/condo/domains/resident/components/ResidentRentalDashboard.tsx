import { useQuery } from '@apollo/client'
import { gql } from 'graphql-tag'
import get from 'lodash/get'
import React, { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { List, Typography } from '@open-condo/ui'

import { getRentalUnitDisplayName } from '@condo/domains/resident/utils/clientSchema/rental'


const GET_RESIDENT_RENTAL_DASHBOARD_QUERY = gql`
    query getResidentRentalDashboard ($residentId: ID!) {
        result: residentRentalDashboard(data: { residentId: $residentId }) {
            currentRentalUnit { id name unitType property { id address addressKey } }
            occupancyStatus
            billingFrequency
            monthlyRate
            arrearsTotal
            nextDueDate
            unpaidRentCharges { id billingMonth periodStart periodEnd dueDate amount currencyCode status invoice { id status } }
            linkedUnpaidInvoices { id status toPay currencyCode }
        }
    }
`

type ResidentRentalDashboardProps = {
    residentId?: string | null
}

export const ResidentRentalDashboard: React.FC<ResidentRentalDashboardProps> = ({ residentId }) => {
    const intl = useIntl()
    const { data, loading, error } = useQuery(GET_RESIDENT_RENTAL_DASHBOARD_QUERY, {
        variables: { residentId },
        skip: !residentId,
    })

    const dashboard = get(data, 'result')

    const dataSource = useMemo(() => {
        if (!dashboard) return []

        return [
            { label: 'Rental unit', value: getRentalUnitDisplayName(intl, get(dashboard, 'currentRentalUnit')) || '—' },
            { label: 'Occupancy status', value: get(dashboard, 'occupancyStatus') || '—' },
            { label: 'Billing frequency', value: get(dashboard, 'billingFrequency') || '—' },
            { label: 'Monthly rate', value: get(dashboard, 'monthlyRate') || '—' },
            { label: 'Arrears', value: get(dashboard, 'arrearsTotal') || '0' },
            { label: 'Next due date', value: get(dashboard, 'nextDueDate') || '—' },
            { label: 'Unpaid rent charges', value: get(dashboard, 'unpaidRentCharges', []).length },
            { label: 'Linked unpaid invoices', value: get(dashboard, 'linkedUnpaidInvoices', []).length },
        ]
    }, [dashboard, intl])

    if (!residentId || error) return null

    if (loading) {
        return <Typography.Text type='secondary'>Loading rental dashboard...</Typography.Text>
    }

    if (!dashboard) return null

    return <List title='Rental dashboard' dataSource={dataSource} />
}
