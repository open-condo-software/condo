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
const DEFAULT_CURRENCY_CODE = 'RUB'

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

const getIntegerPartOfReading = (value: string) => value?.split(DEFAULT_CURRENCY_SEPARATOR)[0]

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

const dimText = (text: string, extraStyles: React.CSSProperties = {}) => (
    <Typography.Text type={'secondary'} style={extraStyles}>
        {text}
    </Typography.Text>
)

const renderMoney = (formattedValue: string, currencyDelimeter = ',') => {
    const [integerWithPrefix, decimalWithPostfix] = formattedValue.split(currencyDelimeter)

    if (!decimalWithPostfix) {
        return (<>{integerWithPrefix}</>)
    }

    // We might have the case when the currency sign or other things are located after the end of decimal part
    // We don't want to dim them, so we find the end of decimal part by simple iteration
    // Example: 2 200,00 RUB (only ,00 should be dimmed)
    let decimal = ''
    let postfix = ''

    for (let i = 0; i < decimalWithPostfix.length; ++i ) {
        const currentChar = decimalWithPostfix[i]
        if (/^[0-9]$/.test(currentChar)) {
            decimal += currentChar
        } else {
            postfix = decimalWithPostfix.slice(i - 1)
        }
    }

    return (<>{integerWithPrefix}{dimText(currencyDelimeter + decimal)}{postfix}</>)
}

export const getMoneyRender = (
    search: string,
    intl,
    currencyCode = DEFAULT_CURRENCY_CODE
) => {
    return function render (text: string): RenderReturnType {
        if (!text) return <EmptyTableCell/>

        const formattedCurrency = intl.formatNumber(
            parseFloat(text),
            { style: 'currency', currency: currencyCode }
        )

        if (isEmpty(search)) {
            return renderMoney(formattedCurrency, ',')
        }
        return (
            <>
                <TextHighlighter
                    text={text}
                    search={search}
                    renderPart={() => renderMoney(formattedCurrency, ',')}
                />
            </>
        )
    }
}