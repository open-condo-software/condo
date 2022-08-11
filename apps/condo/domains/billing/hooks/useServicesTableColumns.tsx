import React, { useMemo } from 'react'
import { useIntl } from '@condo/next/intl'
import { getTextRender, getMoneyRender } from '@condo/domains/common/components/Table/Renders'
import { TableRecord } from '@condo/domains/common/components/Table/Index'
import get from 'lodash/get'
import { Tooltip } from '@condo/domains/common/components/Tooltip'

type AlignType = 'right' | 'left' | 'center'

const DETAILED_COLUMNS_AMOUNT = 9
const BASE_COLUMNS_AMOUNT = 2
const DEFAULT_VOLUME_MAX_DECIMALS = 4


const textRender = getTextRender()
const getExpandTextRender = (detailed: boolean) => {
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

const getHideCellTextRender = () => {
    return function render (text: string, record: TableRecord) {
        if (get(record, ['children', 'length'])) {
            return {
                props: {
                    colSpan: 0,
                },
            }
        }
        return {
            children: textRender(text),
        }
    }
}

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

const getVolumeRender = (decimals: number) => {
    return function render (text: string, record: TableRecord) {
        if (get(record, ['children', 'length'])) {
            return {
                props: {
                    colSpan: 0,
                },
            }
        }
        if (!text) return textRender(text)
        const volume = parseFloat(text)
        const scaleRate = Math.pow(10, decimals)
        const roundedVolume = Math.round((volume + Number.EPSILON) * scaleRate) / scaleRate
        if (roundedVolume === volume) {
            return (
                <Tooltip title={text}>{roundedVolume}</Tooltip>
            )
        }
        return (
            <Tooltip title={text}>{roundedVolume}…</Tooltip>
        )
    }
}

export const useServicesTableColumns = (detailed: boolean, currencyCode: string) => {
    const intl = useIntl()
    const ToPayTitle = intl.formatMessage({ id: 'field.TotalPayment' })
    const ServiceTitle = intl.formatMessage({ id: 'BillingServiceName' })
    const ChargeTitle = intl.formatMessage({ id: 'Charged' })
    const VolumeTitle = intl.formatMessage({ id: 'Volume' })
    const UnitsTitle = intl.formatMessage({ id: 'ServicesUnitsShort' })
    const TariffTitle = intl.formatMessage({ id: 'Tariff' })
    const PrivilegesTitle = intl.formatMessage({ id: 'Privileges' })
    const RecalculationTitle = intl.formatMessage({ id: 'Recalculation' })
    const PenaltyTitle = intl.formatMessage({ id: 'PaymentPenalty' })


    const moneyRender = getAdvancedMoneyRender(intl, currencyCode)
    const moneyAlign: AlignType = 'right'
    return useMemo(() => {
        const expandTextRender = getExpandTextRender(detailed)
        const hideTextRender = getHideCellTextRender()
        const volumeRender = getVolumeRender(DEFAULT_VOLUME_MAX_DECIMALS)
        const columns = {
            name: {
                title: ServiceTitle,
                key: 'serviceName',
                dataIndex: 'name',
                width: detailed ? '20%' : '70%',
                render: expandTextRender,
            },
            toPay: {
                title: ToPayTitle,
                key: 'serviceToPay',
                dataIndex: 'toPay',
                width: detailed ? '10%' : '30%',
                align: moneyAlign,
                render: moneyRender,
            },
            charge: {
                title: ChargeTitle,
                key: 'serviceCharge',
                dataIndex: ['toPayDetails', 'charge'],
                width: '10%',
                align: moneyAlign,
                render: moneyRender,
            },
            volume: {
                title: VolumeTitle,
                key: 'serviceVolume',
                dataIndex: ['toPayDetails', 'volume'],
                width: '10%',
                render: volumeRender,
            },
            units: {
                title: UnitsTitle,
                key: 'serviceMeasure',
                dataIndex: ['toPayDetails', 'measure'],
                width: '10%',
                render: hideTextRender,
            },
            tariff: {
                title: TariffTitle,
                key: 'serviceTariff',
                dataIndex: ['toPayDetails', 'tariff'],
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

        return detailed
            ? [
                columns.name,
                columns.volume,
                columns.units,
                columns.tariff,
                columns.privileges,
                columns.recalculation,
                columns.penalty,
                columns.charge,
                columns.toPay,
            ]
            : [columns.name, columns.toPay]
    }, [
        ToPayTitle,
        UnitsTitle,
        ChargeTitle,
        VolumeTitle,
        ServiceTitle,
        RecalculationTitle,
        PenaltyTitle,
        PrivilegesTitle,
        TariffTitle,
        detailed,
        moneyRender,
        moneyAlign,
    ])
}