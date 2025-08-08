import { NewsItem as INewsItem } from '@app/condo/schema'
import styled from '@emotion/styled'
import { FilterValue, ColumnType } from 'antd/es/table/interface'
import { TextProps } from 'antd/es/typography/Text'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import getConfig from 'next/config'
import Link from 'next/link'
import React, { useCallback } from 'react'
import { IntlShape } from 'react-intl/src/types'

import { RefreshCw } from '@open-condo/icons'
import { colors } from '@open-condo/ui/colors'

import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { LOCALES } from '@condo/domains/common/constants/locale'
import { NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'
import { getCompactAddressPropertiesRender } from '@condo/domains/property/utils/clientSchema/Renders'


type GetRenderType = ColumnType<INewsItem>['render']

type GetRenderTitleType = (search: FilterValue) => GetRenderType

type GetRenderBodyType = (search: FilterValue) => GetRenderType

type GetRenderNewsDateType = (intl: IntlShape, search: FilterValue) => GetRenderType

type GetTypeRenderType = (intl: IntlShape, search: FilterValue) => GetRenderType

type GetRenderPropertiesType = (intl: IntlShape, search: FilterValue) => GetRenderType

// TODO(DOMA-6153): rewrite to css-modules after migrating from custom style loader plugins
export const ResendButton = styled.div`
  color: ${colors.gray[7]};
  transition: color 0.3s;
  &:hover {
    color: ${colors.black};
    transition: color 0.3s;
  }
`
const DATE_FORMAT = 'DD.MM.YYYY'
const TIME_FORMAT = 'DD.MM.YYYY HH:mm'
const { publicRuntimeConfig: { defaultLocale } } = getConfig()
const DEFAULT_LOCALE = defaultLocale || 'ru'

const getNewsDate = (intl, stringDate: string, format: string): string => {
    if (!stringDate) return '—'

    const locale = get(LOCALES, intl.locale, DEFAULT_LOCALE)
    const date = dayjs(stringDate).locale(locale)
    return date.format(format)
}

export const getRenderTitle: GetRenderTitleType = (search) => (body) => {
    return getTableCellRenderer({ search, extraTitle: body, ellipsis: true })(body)
}

export const getRenderBody: GetRenderBodyType = (search) => (body) => {
    return getTableCellRenderer({ search, extraTitle: body, ellipsis: true })(body)
}

export const getRenderNewsDate: GetRenderNewsDateType = (intl, search) => (_, news) => {
    const NotSentNews = intl.formatMessage({ id: 'pages.condo.news.index.field.date.notSentYet' })
    const Sending = intl.formatMessage({ id: 'pages.condo.news.index.field.date.sending' })

    const sendAt = get(news, 'sendAt', null)
    const sentAt = get(news, 'sentAt', null)
    const isPublished = get(news, 'isPublished', null)
    const isStartSending = sendAt && dayjs().diff(dayjs(sendAt)) > 0

    if (!sendAt) return '—'

    const text = getNewsDate(intl, sendAt, TIME_FORMAT)
    const postfix = (isPublished && isStartSending) ? `\n${Sending}` : `\n${NotSentNews}`

    if (sentAt) return getTableCellRenderer({ search, ellipsis: true })(text)

    return getTableCellRenderer({ search, ellipsis: true, postfix, extraPostfixProps: POSTFIX_PROPS })(text)
}

const POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }


export const ResendNewsButton = ({ intl, newsItem }) => {
    const ResendMessage = intl.formatMessage({ id: 'pages.condo.news.resend' })

    const handleClick = useCallback((e) => {
        e.stopPropagation()
    }, [])


    return (
        <Link key='resend' href={`/news/${get(newsItem, 'id')}/resend`}>
            <Tooltip title={ResendMessage} placement='bottomLeft'>
                <ResendButton onClick={handleClick}>
                    <RefreshCw size='small'/>
                </ResendButton>
            </Tooltip>
        </Link>
    )
}

export const getTypeRender: GetTypeRenderType = (intl, search) => (text, newsItem) => {
    const CommonTypeMessage = intl.formatMessage({ id: 'news.type.common' })
    const EmergencyCommonTypeMessage = intl.formatMessage({ id: 'news.type.emergency' })

    const newsType = get(newsItem, 'type', null)
    const validBefore = get(newsItem, 'validBefore', null)
    const timeLeft = dayjs.duration(dayjs(validBefore).diff(dayjs()))

    const localeText = newsType === NEWS_TYPE_EMERGENCY ? EmergencyCommonTypeMessage : CommonTypeMessage

    if (newsType !== NEWS_TYPE_EMERGENCY || !validBefore || timeLeft.asMilliseconds() < 0) return getTableCellRenderer({ search, ellipsis: true })(localeText)

    const postfix = `\n${intl.formatMessage(
        { id: 'pages.condo.news.validBefore' }, 
        { validBefore: getNewsDate(intl, validBefore, DATE_FORMAT) }
    )}`

    return getTableCellRenderer({ search, ellipsis: true, postfix, extraPostfixProps: POSTFIX_PROPS })(localeText)
}

export const getRenderProperties: GetRenderPropertiesType = (intl, search) => (compactScopes) => {
    const AllPropertiesMessage = intl.formatMessage({ id: 'news.fields.properties.allSelected' })
    const MoreAddressesMessage = intl.formatMessage({ id: 'pages.condo.news.index.tableField.addresses.more' })

    const scopeCount = get(compactScopes, 'count', 0)
    const firstOnesProperties = map(get(compactScopes, 'firstOnes'), 'property').filter(Boolean)
    const hasAllProperties = scopeCount === 1 && !get(compactScopes, 'firstOnes.0.property', null)

    if (hasAllProperties) {
        return AllPropertiesMessage
    }

    if (isEmpty(firstOnesProperties) || scopeCount < 1) {
        return '—'
    }

    return getCompactAddressPropertiesRender(search)(intl, firstOnesProperties, scopeCount, MoreAddressesMessage)
}
