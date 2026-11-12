import get from 'lodash/get'
import { useMemo } from 'react'

import { useIntl } from '@open-condo/next/intl'

import { TableRecord } from '@condo/domains/common/components/Table/Index'
import { getTextRender, getMoneyRender } from '@condo/domains/common/components/Table/Renders'

type AlignType = 'right' | 'left' | 'center'

const textRender = getTextRender()

const getAdvancedMoneyRender = (intl, currencyCode: string) => {
    const moneyRender = getMoneyRender(intl, currencyCode)
    return function render (text: string, record: TableRecord) {
        if (get(record, ['children', 'length'])) {
            return {
                children: text,
                props: { colSpan: 0 },
            }
        }
        return moneyRender(text)
    }
}

export const useServicesTableColumns = (currencyCode: string) => {
    const intl = useIntl()
    const ToPayTitle = intl.formatMessage({ id: 'field.TotalCharged' })
    const ServiceTitle = intl.formatMessage({ id: 'BillingServiceName' })
    const ChargeTitle = intl.formatMessage({ id: 'Charged' })
    const PrivilegesTitle = intl.formatMessage({ id: 'Privileges' })
    const RecalculationTitle = intl.formatMessage({ id: 'Recalculation' })
    const PenaltyTitle = intl.formatMessage({ id: 'PaymentPenalty' })


    const moneyRender = getAdvancedMoneyRender(intl, currencyCode)
    const moneyAlign: AlignType = 'right'
    return useMemo(() => {
        const columns = {
            name: {
                title: ServiceTitle,
                key: 'serviceName',
                dataIndex: 'name',
                width: '20%',
                render: textRender,
            },
            toPay: {
                title: ToPayTitle,
                key: 'serviceToPay',
                dataIndex: 'toPay',
                width: '10%',
                align: moneyAlign,
                render: textRender,
            },
            charge: {
                title: ChargeTitle,
                key: 'serviceCharge',
                dataIndex: ['toPayDetails', 'charge'],
                width: '10%',
                align: moneyAlign,
                render: moneyRender,
            },
            privileges: {
                title: PrivilegesTitle,
                key: 'servicePrivileges',
                dataIndex: ['toPayDetails', 'privilege'],
                width: '10%',
                align: moneyAlign,
                render: moneyRender,
            },
            recalculation: {
                title: RecalculationTitle,
                key: 'serviceRecalculation',
                dataIndex: ['toPayDetails', 'recalculation'],
                width: '10%',
                align: moneyAlign,
                render: moneyRender,
            },
            penalty: {
                title: PenaltyTitle,
                key: 'servicePenalty',
                dataIndex: ['toPayDetails', 'penalty'],
                width: '10%',
                align: moneyAlign,
                render: moneyRender,
            },
        }

        return [
            columns.name,
            columns.privileges,
            columns.recalculation,
            columns.penalty,
            columns.charge,
            columns.toPay,
        ]
    }, [ToPayTitle, ChargeTitle, ServiceTitle, RecalculationTitle, PenaltyTitle, PrivilegesTitle, moneyRender, moneyAlign])
}