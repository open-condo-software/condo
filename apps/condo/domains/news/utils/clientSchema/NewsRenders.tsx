import {
    NewsItem as INewsItem,
} from '@app/condo/schema'
import { FilterValue } from 'antd/es/table/interface'
import { TextProps } from 'antd/es/typography/Text'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isNull from 'lodash/isNil'
import getConfig from 'next/config'
import { ColumnType } from 'rc-table/lib/interface'
import React, { CSSProperties, useCallback } from 'react'
import { IntlShape } from 'react-intl/src/types'

import { RefreshCw } from '@open-condo/icons'

import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { LOCALES } from '@condo/domains/common/constants/locale'
import { NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'
import { getOneAddressAndPropertiesCountRender } from '@condo/domains/property/utils/clientSchema/Renders'


type GetRenderType = ColumnType<INewsItem>['render']

type GetRenderTitleType = (search: FilterValue) => GetRenderType

type GetRenderBodyType = (search: FilterValue) => GetRenderType

type GetRenderNewsDateType = (intl: IntlShape, search: FilterValue) => GetRenderType

type GetTypeRenderType = (intl: IntlShape, search: FilterValue) => GetRenderType

type GetRenderPropertiesType = (intl: IntlShape, search: FilterValue) => GetRenderType

const DATE_FORMAT = 'DD.MM.YYYY'
const TIME_FORMAT = 'DD.MM.YYYY HH:mm'
const { publicRuntimeConfig: { defaultLocale } } = getConfig()
const DEFAULT_LOCALE = defaultLocale || 'ru'

const getNewsDate = (intl, stringDate: string, format: string): string => {
    if (!stringDate) return '—'

    const locale = get(LOCALES, intl.locale, DEFAULT_LOCALE)
    const date = dayjs(stringDate).locale(locale)
    const text = date.format(format)

    return text
}

export const getRenderTitle: GetRenderTitleType = (search) => (body) => {
    return getTableCellRenderer({ search, extraTitle: body })(body)
}

export const getRenderBody: GetRenderBodyType = (search) => (body) => {
    return getTableCellRenderer({ search, extraTitle: body, ellipsis: true })(body)
}

export const getRenderNewsDate: GetRenderNewsDateType = (intl, search) => (stringDate, news) => {
    const NotSentNews = intl.formatMessage({ id: 'pages.condo.news.index.field.notSentYet' })

    if (!stringDate) return '—'

    const text = getNewsDate(intl, stringDate, TIME_FORMAT)
    const postfix = `\n${NotSentNews}`

    const sendAt = get(news, 'sendAt', null)
    const sentAt = get(news, 'sentAt', null)

    if (sentAt) return getTableCellRenderer({ search, ellipsis: true })(text)

    if (isNull(sendAt)) return getTableCellRenderer({ search, ellipsis: true, postfix, extraPostfixProps: POSTFIX_PROPS })(text)

    const sendAtDate = getNewsDate(intl, sendAt, TIME_FORMAT)
    return getTableCellRenderer({ search, ellipsis: true, postfix, extraPostfixProps: POSTFIX_PROPS })(sendAtDate)
}

const RESEND_MESSAGE_CONTAINER_STYLE: CSSProperties = { cursor: 'pointer' }
const POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }


export const ResendNewsButton = ({ intl, newsItem }) => {
    const ResendMessage = intl.formatMessage({ id: 'pages.condo.news.resend' })

    //TODO(DOMA-5917) this functionality will be implemented as part of next task
    const handleClick = useCallback((e) => {
        e.stopPropagation()
    }, [])
    

    return (
        <Tooltip title={ResendMessage} placement='bottomLeft'>
            <div style={RESEND_MESSAGE_CONTAINER_STYLE} onClick={handleClick}>
                <RefreshCw size='small'/>
            </div>
        </Tooltip>
    )
}

export const getTypeRender: GetTypeRenderType = (intl, search) => (text, newsItem) => {
    const CommonTypeMessage = intl.formatMessage({ id: 'news.type.common' })
    const ЕmergencyCommonTypeMessage = intl.formatMessage({ id: 'news.type.emergency' })

    const newsType = get(newsItem, 'type', null)
    const validBefore = get(newsItem, 'validBefore', null)
    const timeLeft = dayjs.duration(dayjs(validBefore).diff(dayjs()))

    const localeText = newsType === NEWS_TYPE_EMERGENCY ? ЕmergencyCommonTypeMessage : CommonTypeMessage

    if (newsType !== NEWS_TYPE_EMERGENCY || !validBefore || timeLeft.asMilliseconds() < 0) return getTableCellRenderer({ search, ellipsis: true })(localeText)

    const postfix = `\n${intl.formatMessage(
        { id: 'pages.condo.news.validBefore' }, 
        { validBefore: getNewsDate(intl, validBefore, DATE_FORMAT) }
    )}`

    return getTableCellRenderer({ search, ellipsis: true, postfix, extraPostfixProps: POSTFIX_PROPS })(localeText)
}

export const getRenderProperties: GetRenderPropertiesType = (intl, search) => (properties, newsItem) => {
    const AllPropertiesMessage = intl.formatMessage({ id: 'news.fields.properties.allSelected' })

    if (get(newsItem, 'hasAllProperties')) {
        return AllPropertiesMessage
    }

    return getOneAddressAndPropertiesCountRender(search)(intl, properties)
}