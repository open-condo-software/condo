import { Col, Row, RowProps } from 'antd'
import get from 'lodash/get'
import has from 'lodash/has'
import isArray from 'lodash/isArray'
import isBoolean from 'lodash/isBoolean'
import isEmpty from 'lodash/isEmpty'
import isObject from 'lodash/isObject'
import isString from 'lodash/isString'
import getConfig from 'next/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { Banner, Carousel, Typography } from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'


interface HintI18n {
    title: string
    description: string
    targetUrl: string
    // You can add an override common fields here if you really need it
}

interface Hint {
    image: string
    color: string
    invertedTextColor: boolean
    i18n: Record<string, HintI18n>
}

type ReadableHint = Omit<Hint, 'i18n'> & HintI18n


const { publicRuntimeConfig: { globalHints } } = getConfig()

const HINTS_CONTAINER_CLASS = 'global-hints-slider'
const HINTS_BY_PAGES = get(globalHints, 'pages', []) || []
const HINTS_AUTOPLAY_SPEED = 5000
const HINTS_WRAPPER_STYLE: CSSProperties = { marginBottom: 40 }
const HINTS_ROW_GUTTERS: RowProps['gutter'] = [0, 8]

export const useGlobalHints = () => {
    const intl = useIntl()
    const CanDisableHintsMessage = intl.formatMessage({ id: 'global.globalHints.canDisableHints' })
    const InProfileMessage = intl.formatMessage({ id: 'global.globalHints.canDisableHints.inProfile' })
    const MoreMessage = intl.formatMessage({ id: 'global.globalHints.banner.more' })

    const [hints, setHints] = useState<ReadableHint[]>([])

    const { user } = useAuth()
    const { route } = useRouter()

    const locale = intl.locale
    const showHints = get(user, 'showGlobalHints', false)

    const handleBannerClick = useCallback((url) => () => {
        if (!url || !isString(url)) return

        window.open(url)
    }, [])

    useEffect(() => {
        if ((isArray(HINTS_BY_PAGES) && !isEmpty(HINTS_BY_PAGES))
            && showHints
            && (isString(locale) && locale !== '')
        ) {
            const hintsByRoute: Hint[] = get(HINTS_BY_PAGES.find(page => get(page, 'routeTemplate') === route), 'hints', []) || []

            const validHints = hintsByRoute.filter(hint => {
                const i18n = get(hint, 'i18n', {}) || {}

                if (!isObject(i18n) || !has(i18n, locale)) return false

                const title = get(i18n, [locale, 'title'])
                const description = get(i18n, [locale, 'description'])
                const targetUrl = get(i18n, [locale, 'targetUrl'])
                const image = get(hint, 'image')
                const color = get(hint, 'color')
                const invertedTextColor = get(hint, 'invertedTextColor')

                return (isString(title) && title !== '')
                    && (isString(description) && description !== '')
                    && (isString(targetUrl) && targetUrl !== '')
                    && isString(image) && isString(color) && isBoolean(invertedTextColor)
            })

            const readableHints: ReadableHint[] = validHints.map(hint => ({
                title: get(hint, ['i18n', locale, 'title'], ''),
                description: get(hint, ['i18n', locale, 'description'], ''),
                targetUrl: get(hint, ['i18n', locale, 'targetUrl'], ''),
                image: get(hint, 'image', null),
                color: get(hint, 'color', colors.green['1']),
                invertedTextColor: get(hint, 'invertedTextColor', false),
            }))

            setHints(readableHints)
        } else {
            setHints([])
        }
    }, [route, showHints, locale])

    const renderHints = useMemo(() => !isEmpty(hints) && (
        <div style={HINTS_WRAPPER_STYLE} className={HINTS_CONTAINER_CLASS}>
            <Row gutter={HINTS_ROW_GUTTERS}>
                <Col span={24}>
                    <Carousel
                        effect='fade'
                        autoplay
                        autoplaySpeed={HINTS_AUTOPLAY_SPEED}
                    >
                        {
                            hints.map((hint, ind) => (
                                <Banner
                                    id={`global-hint-${ind}`}
                                    key={ind}
                                    actionText={MoreMessage}
                                    size='small'
                                    title={hint.title}
                                    subtitle={hint.description}
                                    onClick={handleBannerClick(hint.targetUrl)}
                                    imgUrl={hint.image}
                                    backgroundColor={hint.color}
                                    invertText={hint.invertedTextColor}
                                />
                            ))
                        }
                    </Carousel>
                </Col>
                <Col span={24}>
                    <Typography.Text>
                        <Typography.Text type='secondary' size='small'>
                            {CanDisableHintsMessage}
                        </Typography.Text>&nbsp;
                        <Link href='/user'>
                            <Typography.Link size='small'>{InProfileMessage}</Typography.Link>
                        </Link>
                    </Typography.Text>
                </Col>
            </Row>
        </div>
    ), [CanDisableHintsMessage, InProfileMessage, MoreMessage, handleBannerClick, hints])

    return {
        GlobalHints: renderHints,
    }
}
