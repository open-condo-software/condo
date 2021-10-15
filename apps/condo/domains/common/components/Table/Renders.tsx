import React from 'react'
import isEmpty from 'lodash/isEmpty'
import { TextHighlighter } from '../TextHighlighter'
import { Typography } from 'antd'
import { colors } from '../../constants/style'
import { EmptyTableCell } from './EmptyTableCell'
import { get } from 'lodash'
import { LOCALES } from '../../constants/locale'
import dayjs from 'dayjs'
import { Highliter } from '../Highliter'
import { QueryArgType } from '../../utils/tables.utils'
import { ELECTRICITY_METER_RESOURCE_ID } from '@condo/domains/meter/constants/constants'

type RenderReturnType = string | React.ReactNode

const DEFAULT_CURRENCY_SEPARATOR = '.'
const DEFAULT_CURRENCY_NAME = 'RUB'
const MONEY_PARTS_SEPARATOR = ' '

const getHighlightedText = (search: string, text: string) => {
    let result: RenderReturnType = text
    if (!isEmpty(search) && text) {
        result = (
            <TextHighlighter
                text={String(text)}
                search={String(search)}
                renderPart={(part, startIndex, marked) => (
                    <Typography.Text title={text} style={marked ? { backgroundColor: colors.markColor } : {}}>
                        {part}
                    </Typography.Text>
                )}
            />
        )
    }
    return (<EmptyTableCell>{result}</EmptyTableCell>)
}

export const getDateRender = (intl, search?: string) => {
    return function render (stringDate: string): RenderReturnType {
        if (!stringDate) return '—'

        const locale = get(LOCALES, intl.locale)
        const date = locale ? dayjs(stringDate).locale(locale) : dayjs(stringDate)
        return getHighlightedText(search, date.format('DD MMMM YYYY'))
    }
}

export const getAddressRender = (search?: QueryArgType, unitPrefix?: string) => {
    return function render (text: string): RenderReturnType {
        if (!isEmpty(search)) {
            return (
                <>
                    <Highliter
                        text={text}
                        search={String(search)}
                        renderPart={(part) => (
                            <Typography.Text style={{ backgroundColor: colors.markColor }}>
                                {part}
                            </Typography.Text>
                        )}
                    />
                    {` ${unitPrefix}`}
                </>
            )
        }
        return `${text} ${unitPrefix}`
    }
}

export const getTextRender = (search?: string) => {
    return function render (text: string): RenderReturnType {
        return getHighlightedText(search, text)
    }
}

const getIntegerPartOfReading = (value: string) => value?.split('.')[0]

export const renderMeterReading = (values: string[], resourceId: string, measure: string) => {
    // ELECTRICITY multi-tariff meter
    if (resourceId === ELECTRICITY_METER_RESOURCE_ID) {
        const stringValues = values.reduce((acc, value, index) => {
            if (!value) return acc
            return acc += `, T${index + 1} - ${getIntegerPartOfReading(value)} ${measure}`
        }, '')

        return stringValues?.substr(2)
    }

    // other resource 1-tariff meter
    return `${getIntegerPartOfReading(values[0])} ${measure}`
}

const getCurrencySymbol = (currencyName) => {
    return (0).toLocaleString(
        undefined,
        {
            style: 'currency',
            currency: currencyName,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
            currencyDisplay: 'narrowSymbol',
        }
    ).replace(/\d/g, '').trim()
}

const dimText = (text: string, extraStyles: React.CSSProperties = {}) => (
    <Typography.Text type={'secondary'} style={extraStyles}>
        {text}
    </Typography.Text>
)

const renderMoney = (currencyValuePart: string, currencyDecimalPart: string, currencySymbol: string) => (
    <>{currencyValuePart}{dimText(',' + currencyDecimalPart)}{MONEY_PARTS_SEPARATOR}{currencySymbol}</>
)

export const getMoneyRender = (
    search: string,
    currencyMark = '₽',
    partSeparator = DEFAULT_CURRENCY_SEPARATOR,
    currencyName = DEFAULT_CURRENCY_NAME
) => {
    return function render (text: string): RenderReturnType {
        if (!text) return <EmptyTableCell/>

        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locale_identification_and_negotiation
        // Using undefined will resolve to User-Agent locale
        const formatter = Intl.NumberFormat(
            undefined,
            { style: 'currency', currency: currencyName, currencyDisplay: 'narrowSymbol', signDisplay: 'auto' }
        )
        text = formatter.format(parseFloat(text))

        const currencySymbol = getCurrencySymbol(currencyName)
        const currencyAmount = text
            .replace(currencySymbol, '')
            .replace(',', MONEY_PARTS_SEPARATOR)
            .replace('.', ',')

        const [currencyValuePart, currencyDecimalPart] = currencyAmount.split(',')

        if (isEmpty(search)) {
            return renderMoney(currencyValuePart, currencyDecimalPart, currencySymbol)
        }
        return (
            <>
                <TextHighlighter
                    text={text}
                    search={search}
                    renderPart={() => renderMoney(currencyValuePart, currencyDecimalPart, currencySymbol)}
                />
            </>
        )
    }
}