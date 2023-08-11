import {
    NewsItem as INewsItem,
} from '@app/condo/schema'
import styled from '@emotion/styled'
import { FilterValue } from 'antd/es/table/interface'
import { TextProps } from 'antd/es/typography/Text'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isNull from 'lodash/isNil'
import getConfig from 'next/config'
import Link from 'next/link'
import { ColumnType } from 'rc-table/lib/interface'
import React, { useCallback } from 'react'
import { IntlShape } from 'react-intl/src/types'

import { RefreshCw } from '@open-condo/icons'
import { colors } from '@open-condo/ui/dist/colors'

import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { LOCALES } from '@condo/domains/common/constants/locale'
import { NEWS_TYPE_EMERGENCY } from '@condo/domains/news/constants/newsTypes'
import { FLAT_UNIT_TYPE } from '@condo/domains/property/constants/common'
import { getOneAddressAndPropertiesCountRender } from '@condo/domains/property/utils/clientSchema/Renders'


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
    const text = date.format(format)

    return text
}

export const getRenderTitle: GetRenderTitleType = (search) => (body) => {
    return getTableCellRenderer({ search, extraTitle: body, ellipsis: true })(body)
}

export const getRenderBody: GetRenderBodyType = (search) => (body) => {
    return getTableCellRenderer({ search, extraTitle: body, ellipsis: true })(body)
}

export const getRenderNewsDate: GetRenderNewsDateType = (intl, search) => (stringDate, news) => {
    const NotSentNews = intl.formatMessage({ id: 'news.index.field.notSentYet' })

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

const POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }


export const ResendNewsButton = ({ intl, newsItem }) => {
    const ResendMessage = intl.formatMessage({ id: 'news.resend' })

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
    const ЕmergencyCommonTypeMessage = intl.formatMessage({ id: 'news.type.emergency' })

    const newsType = get(newsItem, 'type', null)
    const validBefore = get(newsItem, 'validBefore', null)
    const timeLeft = dayjs.duration(dayjs(validBefore).diff(dayjs()))

    const localeText = newsType === NEWS_TYPE_EMERGENCY ? ЕmergencyCommonTypeMessage : CommonTypeMessage

    if (newsType !== NEWS_TYPE_EMERGENCY || !validBefore || timeLeft.asMilliseconds() < 0) return getTableCellRenderer({ search, ellipsis: true })(localeText)

    const postfix = `\n${intl.formatMessage(
        { id: 'news.validBefore' }, 
        { validBefore: getNewsDate(intl, validBefore, DATE_FORMAT) }
    )}`

    return getTableCellRenderer({ search, ellipsis: true, postfix, extraPostfixProps: POSTFIX_PROPS })(localeText)
}

export const getRenderProperties: GetRenderPropertiesType = (intl, search) => (properties, newsItem) => {
    const AllPropertiesMessage = intl.formatMessage({ id: 'news.fields.properties.allSelected' })
    const ShortFlatNumber = intl.formatMessage({ id: 'field.shortFlatNumber' })

    if (get(newsItem, 'hasAllProperties')) {
        return AllPropertiesMessage
    }

    const propertiesWithUnits =  properties.map(property => {
        if (property.addressMeta.data.flat_type === FLAT_UNIT_TYPE) {
            property.addressMeta.data.flat_type = ShortFlatNumber
        }
        return property
    })

    return getOneAddressAndPropertiesCountRender(search)(intl, propertiesWithUnits)
}
