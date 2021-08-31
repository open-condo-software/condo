import { useMemo } from 'react'
import { useIntl } from '@core/next/intl'
import { getTextRender, getMoneyRender } from '@condo/domains/common/components/Table/Renders'
import { TableRecord } from '@condo/domains/common/components/Table/Index'
import get from 'lodash/get'
import { AlignType } from 'react-markdown'

const DETAILED_COLUMNS_AMOUNT = 8
const BASE_COLUMNS_AMOUNT = 2


const textRender = getTextRender()
const getAdvancedTextRender = (detailed: boolean) => {
    return function render (text: string, record: TableRecord) {
        if (get(record, ['children', 'length'])) {
            return {
                children: text,
                props: {
                    colSpan: detailed ? DETAILED_COLUMNS_AMOUNT : BASE_COLUMNS_AMOUNT,
                },
            }
        }
        return {
            children: textRender(text),
        }
    }
}

const getAdvancedMoneyRender = (currencyMark: string, currencySeparator: string) => {
    const moneyRender = getMoneyRender(undefined, currencyMark, currencySeparator)
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

export const useServicesTableColumns = (detailed: boolean, currencySign: string, separator: string) => {
    const intl = useIntl()
    const ToPayTitle = intl.formatMessage({ id: 'field.TotalPayment' })
    const ServiceTitle = intl.formatMessage({ id: 'BillingServiceName' })
    const moneyRender = getAdvancedMoneyRender(currencySign, separator)
    const moneyAlign: AlignType = 'right'
    return useMemo(() => {
        const columns = {
            name: {
                title: ServiceTitle,
                key: 'serviceName',
                dataIndex: 'name',
                width: detailed ? '70%' : '70%',
                render: getAdvancedTextRender(detailed),
            },
            toPay: {
                title: ToPayTitle,
                key: 'toPay',
                dataIndex: 'toPay',
                width: detailed ? '30%' : '30%',
                align: moneyAlign,
                render: moneyRender,
            },
        }

        return detailed
            ? [columns.name, columns.toPay]
            : [columns.name, columns.toPay]
    }, [ToPayTitle, ServiceTitle, detailed, moneyRender, moneyAlign])
}