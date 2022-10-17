import React, { useMemo } from 'react'
import { Typography } from 'antd'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { TextProps } from 'antd/es/typography/Text'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isBoolean from 'lodash/isBoolean'
import isString from 'lodash/isString'
import isNull from 'lodash/isNull'
import { FilterValue } from 'antd/es/table/interface'
import { EllipsisConfig } from 'antd/es/typography/Base'

import { ELECTRICITY_METER_RESOURCE_ID } from '@condo/domains/meter/constants/constants'
import { TTextHighlighterRenderPartFN } from '@condo/domains/common/components/TextHighlighter'

import { LOCALES } from '../../constants/locale'
import { TextHighlighter, TTextHighlighterProps } from '../TextHighlighter'
import { ELLIPSIS_ROWS } from '../../constants/style'

import { EmptyTableCell } from './EmptyTableCell'
import { Property, BuildingUnitSubType } from '@app/condo/schema'
import { getAddressDetails } from '../../utils/helpers'
import Link from 'next/link'

export type RenderReturnType = string | React.ReactNode

const DEFAULT_CURRENCY_CODE = 'RUB'
const ELLIPSIS_SETTINGS = { rows: ELLIPSIS_ROWS, expandable: false }
const ELLIPSIS_STYLES = { marginBottom: 0 }
const DATE_FORMAT = 'DD.MM.YYYY'
const TIME_FORMAT = 'HH:mm'
const STATUS_STYLES = {
    'WITHDRAWN': 'warning',
    'DONE': 'success',
}

const DIM_TEXT_STYLE: React.CSSProperties = {
    color: 'inherit',
}

/**
 * Marks text according to marked flag
 * @param part
 * @param startIndex
 * @param marked
 */
export const renderHighlightedPart: TTextHighlighterRenderPartFN = (
    part,
    startIndex,
    marked,
    type,
    style
) => (
    <Typography.Text mark={marked} type={type} style={style}>
        {part}
    </Typography.Text>
)

/**
 * Type for getHighlightedContents fn
 */
type TGetHighlightedFN = (search?: FilterValue | string, postfix?: string | React.ReactElement, extraProps?: Partial<TTextHighlighterProps>, extraPostfixProps?: TextProps, extraTitle?: string) => (text?: string) => React.ReactElement | string

/**
 * Returned function renders provided text with highlighted parts according to search value
 * @param search
 * @param postfix
 * @param extraProps
 * @param extraPostfixProps
 * @param extraTitle
 */
export const getHighlightedContents: TGetHighlightedFN = (search, postfix, extraProps, extraPostfixProps = {}, extraTitle) => (text) => {
    // Sometimes we can receive null/undefined as text
    const renderText = text ? String(text) : ''
    const title = extraTitle || isNull(extraTitle) ? extraTitle : `${text} ${isString(postfix) && postfix || ''}`

    const getPostfix = () => (
        <Typography.Text title={title} {...extraPostfixProps}>
            {postfix}
        </Typography.Text>
    )

    return (
        <TextHighlighter
            text={renderText}
            search={String(search)}
            renderPart={renderHighlightedPart}
            title={title}
            {...extraProps}
        >
            {postfix && getPostfix()}
        </TextHighlighter>
    )
}

const renderLink = (content: JSX.Element | string, href: string) => {
    const handleStopPropagation = (e) => e.stopPropagation()

    return (
        <Link href={href}>
            <a onClick={handleStopPropagation}>
                {content}
            </a>
        </Link>
    )
}

/**
 * Type for getTableCellRenderer fn
 */
type TTableCellRendererFN = (search?: FilterValue | string, ellipsis?: boolean | EllipsisConfig, postfix?: string | React.ReactElement, extraHighlighterProps?: Partial<TTextHighlighterProps>, extraPostfixProps?: TextProps, extraTitle?: string, href?: string) => (text?: string) => React.ReactElement

/**
 * Returned function renders provided text as a cell with highlighted search and multi row ellipsis (if requested)
 * !!! Attention: ellipsis here does not work properly, if ellipsis is also enabled in table column settings for this field, so please remove it from there.
 * @param search
 * @param ellipsis
 * @param postfix
 * @param extraHighlighterProps
 * @param extraPostfixProps
 * @param extraTitle
 * @param href
 * @return cell contents renderer fn
 */
export const getTableCellRenderer: TTableCellRendererFN = (
    search,
    ellipsis = false,
    postfix = '',
    extraHighlighterProps,
    extraPostfixProps,
    extraTitle,
    href?: string,
) =>
    (text) => {
        const title = extraTitle ? extraTitle : text ? `${text} ${postfix || ''}` : null
        const highlightedContent = getHighlightedContents(search, postfix, extraHighlighterProps, extraPostfixProps, null)(text)

        const ellipsisConfig = isBoolean(ellipsis) ? ELLIPSIS_SETTINGS : ellipsis

        const cellContent = text && (
            !ellipsis
                ? highlightedContent
                : (
                    <Typography.Paragraph ellipsis={ellipsisConfig} style={ELLIPSIS_STYLES}>
                        {highlightedContent}
                    </Typography.Paragraph>
                )
        )

        // NOTE Tooltip -> span -> content
        // This hack (span) is needed for tooltip to appear

        return (
            <Tooltip title={title}>
                <span>
                    {
                        href
                            ? renderLink(cellContent, href)
                            : cellContent
                    }
                </span>
            </Tooltip>
        )
    }

/**
 * Renders provided text as a table cell with highlighted search contents
 * @param search
 * @param text
 */
export const renderCellWithHighlightedContents = (search?: FilterValue | string, text?: string) => (
    <EmptyTableCell>{getHighlightedContents(search)(text)}</EmptyTableCell>
)

const POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }

export const getAddressRender = (property: Property, DeletedMessage?: string, search?: FilterValue | string) => {
    const isDeleted = !!get(property, 'deletedAt')
    const { streetPart, renderPostfix } = getAddressDetails(property)
    const extraProps: Partial<TTextHighlighterProps> = isDeleted && { type: 'secondary' }
    const deletedMessage = isDeleted && DeletedMessage ? `(${DeletedMessage})\n` : '\n'
    const postfix = renderPostfix + ' ' + deletedMessage

    return getTableCellRenderer(search, false, postfix, extraProps, POSTFIX_PROPS)(streetPart)
}

export const getUnitNameRender = <T extends Record<string, unknown>>(intl, text: string, record: T, search?: FilterValue | string) => {
    let unitNamePrefix = null
    let extraTitle = null
    const unitType = get(record, 'unitType', BuildingUnitSubType.Flat)

    if (text) {
        extraTitle = intl.formatMessage({ id: `pages.condo.ticket.field.unitType.${unitType}` })
        if (unitType !== BuildingUnitSubType.Flat) {
            unitNamePrefix = intl.formatMessage({ id: `pages.condo.ticket.field.unitType.prefix.${unitType}` })
        }
    }

    const unitName = text && unitNamePrefix ? `${unitNamePrefix} ${text}` : text

    return getTableCellRenderer(search, false, null, null, null, extraTitle)(unitName)
}

export const getDateRender = (intl, search?: FilterValue | string) => {
    return function render (stringDate: string): RenderReturnType {
        if (!stringDate) return '—'

        const locale = get(LOCALES, intl.locale)
        const date = locale ? dayjs(stringDate).locale(locale) : dayjs(stringDate)
        const text = `${date.format(DATE_FORMAT)}`
        const postfix = `\n${date.format(TIME_FORMAT)}`

        return getTableCellRenderer(search, true, postfix, null, POSTFIX_PROPS)(text)
    }
}

export const getTextRender = (search?: FilterValue | string) => {
    return function render (text: string): RenderReturnType {
        return getTableCellRenderer(search)(text)
    }
}

export const renderMeterReading = (values: string[], resourceId: string, measure: string) => {
    // ELECTRICITY multi-tariff meter
    if (resourceId === ELECTRICITY_METER_RESOURCE_ID) {
        const formatMeter = (value, index) => <>{`T${index + 1} - ${Number(value)} ${measure}`}<br /></>
        const nonEmptyValues = values.filter(Boolean)
        if (nonEmptyValues.length) return nonEmptyValues.map(formatMeter)

        return null
    }

    // other resource 1-tariff meter
    if (get(values, '0')) return `${Number(values[0])} ${measure}`
    return null
}

const dimText = (text: string, index: number) => (
    <Typography.Text style={DIM_TEXT_STYLE} key={index}>
        {text}
    </Typography.Text>
)

export const getMoneyRender = (
    intl,
    currencyCode = DEFAULT_CURRENCY_CODE
) => {
    return function render (text: string): RenderReturnType {
        if (!text) return <EmptyTableCell/>
        const formattedParts = intl.formatNumberToParts(parseFloat(text), { style: 'currency', currency: currencyCode })

        return formattedParts.map((part, index) => {
            return ['fraction', 'decimal'].includes(part.type) ? dimText(part.value, index) : part.value
        })
    }
}

export const getStatusRender = (intl, openStatusDescModal, search?: FilterValue | string) => {
    return function render (statusType: string): RenderReturnType {
        const nameStatus = intl.formatMessage({ id: 'payment.status.' + statusType })

        const extraProps: Partial<TTextHighlighterProps> = { type: STATUS_STYLES[statusType] }

        return (
            <div onClick={() => openStatusDescModal(statusType)}>
                {getTableCellRenderer(search, false, null, extraProps)(nameStatus)}
            </div>
        )
    }
}

export const getColumnTooltip = (columnTitle: string, tooltipTitle: string) => {
    return (
        <Tooltip
            title={tooltipTitle}
            placement='top'
        >
            {columnTitle}
        </Tooltip>
    )
}
