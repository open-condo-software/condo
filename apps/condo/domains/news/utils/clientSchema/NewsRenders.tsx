import { FilterValue } from 'antd/es/table/interface'
import { TextProps } from 'antd/es/typography/Text'
import dayjs from 'dayjs'
import get from 'lodash/get'
import isNull from 'lodash/isNil'
import React, { CSSProperties, useCallback } from 'react'


import { RefreshCw } from '@open-condo/icons'
import { Typography } from '@open-condo/ui'

import { getTableCellRenderer } from '@condo/domains/common/components/Table/Renders'
import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { LOCALES } from '@condo/domains/common/constants/locale'

const DATE_FORMAT = 'DD.MM.YYYY'
const TIME_FORMAT = 'DD.MM.YYYY HH:mm'


const getNewsDate = (intl, stringDate: string, format: string): string => {
    if (!stringDate) return '—'

    const locale = get(LOCALES, intl.locale)
    const date = locale ? dayjs(stringDate).locale(locale) : dayjs(stringDate)
    const text = `${date.format(format)}`

    return text
}

export const getRenderNewsDate = (intl, search: FilterValue) => (stringDate, news) => {
    const NotSentNews = intl.formatMessage({ id: 'pages.condo.news.index.field.notSentYet' })

    if (!stringDate) return '—'

    const text = getNewsDate(intl, stringDate, TIME_FORMAT)
    const postfix = `\n${NotSentNews}`

    const sendAt = get(news, 'sendAt', null)
    if (isNull(sendAt)) return getTableCellRenderer({ search, ellipsis: true })(text)

    const timeLeft = dayjs.duration(dayjs(sendAt).diff(dayjs()))
    if (timeLeft.asMilliseconds() < 0) return getTableCellRenderer({ search, ellipsis: true })(text)

    const sendAtDate = getNewsDate(intl, sendAt, TIME_FORMAT)
    return getTableCellRenderer({ search, ellipsis: true, postfix, extraPostfixProps: POSTFIX_PROPS })(sendAtDate)
}

const FAVORITE_TICKET_INDICATOR_CONTAINER_STYLE: CSSProperties = { cursor: 'pointer' }
const POSTFIX_PROPS: TextProps = { type: 'secondary', style: { whiteSpace: 'pre-line' } }


export const ResendNewsButton = ({ intl, newsItem }) => {
    const ResendMessage = intl.formatMessage({ id: 'pages.condo.news.resend' })

    //dummy for now
    const handleClick = useCallback((e) => {
        e.stopPropagation()

        alert(`новость с id ${newsItem.id}`)
    }, [])
    

    return (
        <Tooltip title={ResendMessage} placement='bottomLeft'>
            <div style={FAVORITE_TICKET_INDICATOR_CONTAINER_STYLE} onClick={handleClick}>
                <RefreshCw size='small'/>
            </div>
        </Tooltip>
    )
}

export const getTypeRender = (intl, search?: FilterValue) => {
    return function render (text, newsItem) {
        const CommonTypeMessage = intl.formatMessage({ id: 'news.type.common' })
        const ЕmergencyCommonTypeMessage = intl.formatMessage({ id: 'news.type.emergency' })

        let localeText = text 

        const newsType = get(newsItem, 'type', null)
        const validBefore = get(newsItem, 'validBefore', null)
        const timeLeft = dayjs.duration(dayjs(validBefore).diff(dayjs()))

        newsType == 'emergency' ? localeText = ЕmergencyCommonTypeMessage : localeText = CommonTypeMessage

        if (newsType !== 'emergency' || !validBefore || timeLeft.asMilliseconds() < 0) return getTableCellRenderer({ search, ellipsis: true })(localeText)

        const postfix = `\n${intl.formatMessage(
            { id: 'pages.condo.news.validBefore' }, 
            { validBefore: getNewsDate(intl, validBefore, DATE_FORMAT) }
        )}`

        return getTableCellRenderer({ search, ellipsis: true, postfix, extraPostfixProps: POSTFIX_PROPS })(localeText)
    }
}