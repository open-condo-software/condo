import { Property, BuildingUnitSubType } from '@app/condo/schema'
import { Typography } from 'antd'
import { FilterValue } from 'antd/es/table/interface'
import { EllipsisConfig } from 'antd/es/typography/Base'
import { TextProps } from 'antd/es/typography/Text'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isBoolean from 'lodash/isBoolean'
import isNull from 'lodash/isNull'
import isString from 'lodash/isString'
import getConfig from 'next/config'
import React from 'react'
import { IntlShape } from 'react-intl/src/types'

import { IconProps } from '@open-condo/icons'
import { Space, Tag, TypographyLinkProps, Tooltip, TooltipProps } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import { PAYMENT_WITHDRAWN_STATUS } from '@condo/domains/acquiring/constants/payment'
import { EmptyTableCell } from '@condo/domains/common/components/Table/EmptyTableCell'
import { TTextHighlighterRenderPartFN } from '@condo/domains/common/components/TextHighlighter'
import { TextHighlighter, TTextHighlighterProps } from '@condo/domains/common/components/TextHighlighter'
import { LOCALES } from '@condo/domains/common/constants/locale'
import { ELLIPSIS_ROWS } from '@condo/domains/common/constants/style'
import { getAddressDetails, ObjectWithAddressInfo } from '@condo/domains/common/utils/helpers'
import { renderLink } from '@condo/domains/common/utils/Renders'
import { ELECTRICITY_METER_RESOURCE_ID } from '@condo/domains/meter/constants/constants'


export type RenderReturnType = string | React.ReactNode

const ELLIPSIS_SETTINGS: EllipsisConfig = { rows: ELLIPSIS_ROWS, expandable: false }
const ELLIPSIS_STYLES: React.CSSProperties = { marginBottom: 0 }
const DATE_FORMAT = 'DD.MM.YYYY'
const TIME_FORMAT = 'HH:mm'

const DIM_TEXT_STYLE: React.CSSProperties = {
    color: 'inherit',
}

/**
 * Marks text according to marked flag
 * @param part
 * @param startIndex
 * @param marked
 * @param type
 * @param style
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


type GetTitleMessageType = (props: {
    text?: string
    extraTitle?: string
    postfix?: string | React.ReactElement
}) => string | null

const getTitleMessage: GetTitleMessageType = ({ text, extraTitle, postfix }) => {
    if (extraTitle || isNull(extraTitle)) {
        return extraTitle
    }

    if (text) {
        if (postfix && isString(postfix)) {
            return `${text} ${postfix}`
        }
        return `${text}`
    }

    return null
}


/**
 * Type for getHighlightedContents fn
 */
type GetHighlightedContentsType = (props: {
    search?: FilterValue | string
    postfix?: string | React.ReactElement
    extraProps?: Partial<TTextHighlighterProps>
    extraPostfixProps?: TextProps
    extraTitle?: string
}) => (text?: string) => React.ReactElement | string

/**
 * Returned function renders provided text with highlighted parts according to search value
 * @param search
 * @param postfix
 * @param extraProps
 * @param extraPostfixProps
 * @param extraTitle
 */
export const getHighlightedContents: GetHighlightedContentsType = ({
    search,
    postfix,
    extraProps,
    extraPostfixProps = {},
    extraTitle,
} = {}) => (text) => {
    // Sometimes we can receive null/undefined as text
    const renderText = text ? String(text) : ''
    const title = getTitleMessage({ text, extraTitle, postfix })

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


/**
 * Type for getTableCellRenderer fn
 */
type GetTableCellRendererType = (props?: {
    search?: FilterValue | string
    ellipsis?: boolean | EllipsisConfig
    postfix?: string | React.ReactElement
    extraHighlighterProps?: Partial<TTextHighlighterProps>
    extraPostfixProps?: TextProps
    extraTitle?: string
    extraTooltipProps?: TooltipProps
    href?: string
    target?: TypographyLinkProps['target']
    underline?: boolean
    Icon?: React.FC<IconProps>
    iconProps?: IconProps
}) => (text?: string) => React.ReactElement

/**
 * Returned function renders provided text as a cell with highlighted search and multi row ellipsis (if requested)
 * !!! Attention: ellipsis here does not work properly, if ellipsis is also enabled in table column settings for this field, so please remove it from there.
 * @param search
 * @param ellipsis
 * @param postfix
 * @param extraHighlighterProps
 * @param extraPostfixProps
 * @param extraTitle
 * @param extraTooltipProps
 * @param href
 * @param target
 * @param underline
 * @param Icon
 * @param iconProps
 * @return cell contents renderer fn
 */
export const getTableCellRenderer: GetTableCellRendererType = ({
    search,
    ellipsis = false,
    postfix = '',
    extraHighlighterProps,
    extraPostfixProps,
    extraTitle,
    extraTooltipProps,
    href,
    underline,
    target,
    Icon,
    iconProps,
} = {}) =>
    (text) => {
        const title = getTitleMessage({ text, extraTitle, postfix })
        const highlightedContent = getHighlightedContents({
            search,
            postfix,
            extraProps: extraHighlighterProps,
            extraPostfixProps,
            extraTitle: null,
        })(text)

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
            <Tooltip title={title} {...extraTooltipProps}>
                <span>
                    {
                        href
                            ? renderLink(cellContent, href, underline, target)
                            : Icon ? <Space size={8}><Icon {...iconProps} className={`${iconProps ? '' : 'icon'}`}/>{cellContent}</Space>
                                : cellContent
                    }
                </span>
            </Tooltip>
        )
    }


const POSTFIX_PROPS: TextProps = { type: 'secondary' }
const NEW_LINE_POSTFIX_STYLE: TextProps = { style: { whiteSpace: 'pre-line' } }
const ONE_LINE_POSTFIX_STYLE: TextProps =  { style: { whiteSpace: 'nowrap' } }

export const getAddressRender = (property: ObjectWithAddressInfo, DeletedMessage?: string, search?: FilterValue | string, oneLinePostfix?: boolean) => {

    if (!property) {
        return getTableCellRenderer({
            search,
            postfix: DeletedMessage || '–',
            extraPostfixProps: { ...POSTFIX_PROPS, ...ONE_LINE_POSTFIX_STYLE },
        })(' ')
    }

    const isDeleted = !!get(property, 'deletedAt')
    const { streetPart, renderPostfix } = getAddressDetails(property)
    const extraProps: Partial<TTextHighlighterProps> = isDeleted && { type: 'secondary' }
    const deletedMessage = isDeleted && DeletedMessage ? `(${DeletedMessage})\n` : '\n'
    const postfix = renderPostfix + ' ' + deletedMessage

    return getTableCellRenderer({
        search,
        postfix,
        extraHighlighterProps: extraProps,
        extraPostfixProps: oneLinePostfix ?
            { ...POSTFIX_PROPS, ...ONE_LINE_POSTFIX_STYLE } : { ...POSTFIX_PROPS, ...NEW_LINE_POSTFIX_STYLE },
    })(streetPart)
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

    return getTableCellRenderer({ search, extraTitle })(unitName)
}

export const getUnitTypeRender = <T extends Record<string, unknown>>(intl, text: string, record: T, search?: FilterValue | string) => {
    const unitType = get(record, 'unitType', BuildingUnitSubType.Flat)
    const renderUnitType = unitType ? intl.formatMessage({ id: `pages.condo.ticket.field.unitType.${unitType}` }) : null
    return getTableCellRenderer({ search, extraTitle: renderUnitType })(renderUnitType)
}

export const getDateRender = (intl, search?: FilterValue | string, prefix = '\n') => {
    return function render (stringDate: string): RenderReturnType {
        if (!stringDate) return '—'

        const locale = get(LOCALES, intl.locale)
        const date = locale ? dayjs(stringDate).locale(locale) : dayjs(stringDate)
        const text = `${date.format(DATE_FORMAT)}`
        const postfix = `${prefix}${date.format(TIME_FORMAT)}`

        return getTableCellRenderer({ search, ellipsis: true, postfix, extraPostfixProps: POSTFIX_PROPS })(text)
    }
}

export const getTextRender = (search?: FilterValue | string) => {
    return function render (text: string): RenderReturnType {
        return getTableCellRenderer({ search })(text)
    }
}

export const renderMeterReading = (values: string[], resourceId: string, measure: string) => {
    // ELECTRICITY multi-tariff meter
    if (resourceId === ELECTRICITY_METER_RESOURCE_ID) {
        const formatMeter = (value, index) => !value ? null : <>{`T${index + 1} - ${Number(value)} ${measure}`}<br /></>
        return values.map(formatMeter)
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

export const getIconRender = (Icon: React.FC<IconProps>, href?: string, tooltipText?: string) => {
    return function render (): RenderReturnType {
        return (
            getTableCellRenderer({ extraTitle: tooltipText, href: href, Icon: Icon })()
        )
    }
}

export const getMoneyRender = (
    intl,
    currencyCode = '',
) => {
    const { publicRuntimeConfig: { defaultCurrencyCode } } = getConfig()
    const currency = currencyCode || defaultCurrencyCode

    return function render (text: string): RenderReturnType {
        if (!text) return <EmptyTableCell/>
        const formattedParts = intl.formatNumberToParts(parseFloat(text), { style: 'currency', currency })

        return formattedParts.map((part, index) => {
            return ['fraction', 'decimal'].includes(part.type) ? dimText(part.value, index) : part.value
        })
    }
}

export const getStatusRender = (intl: IntlShape, openStatusDescModal, search?: FilterValue | string) => {
    return function render (statusType: string): RenderReturnType {
        const nameStatus = intl.formatMessage({ id: `payment.status.${statusType}` as FormatjsIntl.Message['ids'] })

        return (
            <span onClick={() => openStatusDescModal(statusType)} aria-hidden role='button'>
                <Tag
                    bgColor={ statusType === PAYMENT_WITHDRAWN_STATUS ? colors.orange[5] : colors.green[5]}
                    textColor={colors.white}
                >
                    {nameStatus}
                </Tag>
            </span>
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
