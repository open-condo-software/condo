import { QuestionCircleOutlined } from '@ant-design/icons'
import { useLazyQuery } from '@apollo/client'
import { BuildingSection, NewsItemScope, Property as PropertyType } from '@app/condo/schema'
import { Col, notification, Row, Skeleton } from 'antd'
import get from 'lodash/get'
import intersectionWith from 'lodash/intersectionWith'
import isEqual from 'lodash/isEqual'
import map from 'lodash/map'
import throttle from 'lodash/throttle'
import React, { CSSProperties, useCallback, useEffect, useMemo, useState } from 'react'

import { getClientSideSenderInfo } from '@open-condo/miniapp-utils/helpers/sender'
import { useAuth } from '@open-condo/next/auth'
import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import {
    Card,
    Space,
    Typography,
    TypographyTitleProps,
    Tooltip,
} from '@open-condo/ui'
import { colors } from '@open-condo/ui/colors'

import {
    GET_NEWS_ITEMS_RECIPIENTS_COUNTERS_MUTATION,
    GET_NEWS_SHARING_RECIPIENTS_COUNTERS_QUERY,
} from '@condo/domains/news/gql'
import { useNewsItemRecipientsExportToExcelTask } from '@condo/domains/news/hooks/useNewsItemRecipientsExportToExcelTask'

import styles from './RecipientCounter.module.css'
import { NewsItemScopeNoInstanceType, TUnit } from './types'


interface CounterProps {
    label: string
    value: number
    type?: TypographyTitleProps['type']
    hint?: string
    downloadButton?: React.ReactNode
    isLoading?: boolean
}

const styleQuestionCircle: CSSProperties = { color: colors.gray['5'], cursor: 'help' }

export const RecipientCounterContainer: React.FC<React.PropsWithChildren<{ title?: string }>> = ({ children, title }) => {
    return (
        <Card title={title && <Typography.Title level={3}>{title}</Typography.Title>}>
            <Row align='top' justify='space-evenly' gutter={[16, 16]}>
                {children}
            </Row>
        </Card>
    )
}

export const Counter: React.FC<CounterProps> = ({ label, value, type = 'success', hint, downloadButton, isLoading }) => (
    <Space size={8} align='center' direction='vertical'>
        <Space size={8} direction='horizontal' align='center'>
            {
                isLoading
                    ? (<Skeleton paragraph={false} title={{ style: { height: '100%' } }} active style={{ height: 28, minWidth: 30 }} />)
                    : (
                        <Space size={8} direction='horizontal'>
                            <Typography.Title level={3} type={type}>{value}</Typography.Title>
                            {hint && (
                                <Tooltip
                                    title={hint}
                                    placement='bottom'
                                    children={<QuestionCircleOutlined style={styleQuestionCircle}/>}
                                />
                            )}
                        </Space>
                    )
            }
        </Space>
        <Row wrap={false} align='middle' className={styles.counterLabelWrapper}>
            <Typography.Text type='secondary'>{label}</Typography.Text>
            {downloadButton}
        </Row>
    </Space>
)

const getUnitsFromSection = (section: BuildingSection): TUnit[] => section.floors.flatMap(floor => floor.units.map(unit => ({
    unitType: unit.unitType,
    unitName: unit.label,
})))

export const detectTargetedSections = (newsItemScopes: NewsItemScope[], property: PropertyType): {
    sections: BuildingSection[]
    parking: BuildingSection[]
} => {
    const newsItemScopesUnits = map(newsItemScopes, ({ unitType, unitName }) => ({ unitType, unitName }))

    const sections = property.map?.sections?.filter(section => {
        const sectionUnits = getUnitsFromSection(section)
        return intersectionWith(sectionUnits, newsItemScopesUnits, isEqual).length === sectionUnits.length
    }) || []

    const parking = property.map?.parking?.filter(section => {
        const sectionUnits = getUnitsFromSection(section)
        return intersectionWith(sectionUnits, newsItemScopesUnits, isEqual).length === sectionUnits.length
    }) || []

    return { sections, parking }
}

interface RecipientCounterProps {
    newsItemScopes: NewsItemScopeNoInstanceType[]
    withTitle?: boolean
}

const processNewsItemScopes = (newsItemScopes: NewsItemScopeNoInstanceType[]) => {
    return newsItemScopes.reduce<NewsItemScopeNoInstanceType[]>((acc, scope) => {
        const property = get(scope, 'property')

        return [
            ...acc,
            {
                property: property ? { id: property.id } : null,
                unitType: get(scope, 'unitType', null),
                unitName: get(scope, 'unitName', null),
            },
        ]
    }, [])
}

export const RecipientCounter: React.FC<RecipientCounterProps> = ({ newsItemScopes, withTitle = true }) => {
    const intl = useIntl()
    const StatisticsMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.statistics' })
    const formatPropertiesLabelMessage = (count) => intl.formatMessage({ id: 'news.component.RecipientCounter.label.properties' }, { count })
    const WillReceiveLabelMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.willReceive.label' })
    const WillNotReceiveLabelMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.willNotReceive.label' })
    const formatWillNotReceiveHintMessage = (count) => intl.formatMessage({ id: 'news.component.RecipientCounter.willNotReceive.hint' }, { count })
    const WillZeroNotReceiveHintMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.willNotReceive.hintZero' })
    const formatWillReceiveHintMessage = (count) => intl.formatMessage({ id: 'news.component.RecipientCounter.willReceive.hint' }, { count })
    const WillZeroReceiveHintMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.willReceive.hintZero' })
    const ErrorLoadingMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.error.loading' })

    const [counters, setCounters] = useState<{
        propertiesCount: number
        unitsCount: number
        receiversCount: number
    }>(null)

    const { organization } = useOrganization()

    const auth = useAuth() as { user: { id: string } }
    const user = get(auth, 'user')

    const processedNewsItemScope = useMemo(() => {
        return processNewsItemScopes(newsItemScopes)
    }, [newsItemScopes])

    const { NewsItemRecipientsExportToXlsxButton } = useNewsItemRecipientsExportToExcelTask({
        organization,
        user,
        scopes: processedNewsItemScope,
    })

    const [getCounters, { loading: isCountersLoading }] = useLazyQuery(
        GET_NEWS_ITEMS_RECIPIENTS_COUNTERS_MUTATION,
        {
            onCompleted: (data) => {
                setCounters(data.result)
            },
            onError: (error) => {
                console.error({ msg: 'Failed to load recipients counters', error })
                const message = get(error, ['graphQLErrors', 0, 'extensions', 'messageForUser'], ErrorLoadingMessage) as string
                notification.error({ message })
            },
            fetchPolicy: 'cache-first',
        },
    )

    const throttledGetCounters = useCallback(throttle(getCounters, 1500), [throttle])

    useEffect(() => {
        const sender = getClientSideSenderInfo()
        const meta = { dv: 1, sender }

        throttledGetCounters({
            variables: {
                data: {
                    newsItemScopes: processedNewsItemScope,
                    organization: { id: organization.id },
                    ...meta,
                },
            },
        })
    }, [getCounters, organization.id, processedNewsItemScope])

    // NOTE(antonal): Not all corner cases are handled, because they rarely will occur:
    // - When some records of NewsItemScope are connected to Property and some are not
    // - When some records of NewsItemScope have unitName, that does not exist in connected Property
    // - When some Resident's unitName is out of units range of a property, that can happen if Property.map was changed after Resident was registered

    const propertiesCount = get(counters, 'propertiesCount', 0)
    const unitsCount = get(counters, 'unitsCount', 0)
    const receiversCount = get(counters, 'receiversCount', 0)
    const willNotReceiveUnitsCount = unitsCount - receiversCount

    const isLoadingCounters = isCountersLoading || !counters

    return (
        <RecipientCounterContainer
            title={withTitle ? StatisticsMessage : ''}
        >
            <Col>
                <Counter
                    label={formatPropertiesLabelMessage(propertiesCount)}
                    value={propertiesCount}
                    isLoading={isLoadingCounters}
                />
            </Col>
            <Col>
                <Counter
                    label={WillReceiveLabelMessage}
                    value={receiversCount}
                    hint={receiversCount === 0 ? WillZeroReceiveHintMessage : formatWillReceiveHintMessage(receiversCount)}
                    isLoading={isLoadingCounters}
                />
            </Col>
            <Col>
                <Counter
                    label={WillNotReceiveLabelMessage}
                    value={Math.max(unitsCount - receiversCount, 0)}
                    type='danger'
                    hint={willNotReceiveUnitsCount === 0 ? WillZeroNotReceiveHintMessage : formatWillNotReceiveHintMessage(willNotReceiveUnitsCount)}
                    downloadButton={(
                        <NewsItemRecipientsExportToXlsxButton key='exportToExcel' />
                    )}
                    isLoading={isLoadingCounters}
                />
            </Col>
        </RecipientCounterContainer>
    )
}

const NewsSharingRecipientCounter: React.FC<{ contextId: string, newsItemScopes: NewsItemScopeNoInstanceType[], withTitle?: boolean }> = ({ contextId, newsItemScopes, withTitle = true }) => {
    const intl = useIntl()
    const StatisticsMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.statistics' })
    const WillReceiveLabelMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.willReceive.label' })
    const ErrorLoadingMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.error.loading' })

    const [counter, setCounter] = useState(null)

    const [getCounter, { loading: isCounterLoading }] = useLazyQuery(
        GET_NEWS_SHARING_RECIPIENTS_COUNTERS_QUERY,
        {
            onCompleted: (data) => {
                setCounter(get(data, ['result', 'receiversCount']))
            },
            onError: (error) => {
                console.error({ msg: 'Failed to load recipients counters', error })
                const message = get(error, ['graphQLErrors', 0, 'extensions', 'messageForUser'], ErrorLoadingMessage) as string
                notification.error({ message })
            },
            fetchPolicy: 'cache-first',
        },
    )

    const processedNewsItemScope = useMemo(() => {
        return processNewsItemScopes(newsItemScopes)
    }, [newsItemScopes])

    useEffect(() => {
        const sender = getClientSideSenderInfo()
        const meta = { dv: 1, sender }

        getCounter({
            variables: {
                data: {
                    newsItemScopes: processedNewsItemScope,
                    b2bAppContext: { id: contextId },
                    ...meta,
                },
            },
        })
    }, [getCounter, contextId, newsItemScopes])

    // if typeof counter !== number is used here instead of just if !counter because bool(0) => false
    const isLoadingCounter = isCounterLoading || typeof counter !== 'number'

    return (
        <RecipientCounterContainer title={withTitle ? StatisticsMessage : ''}>
            <Col>
                <Counter label={WillReceiveLabelMessage} value={counter} isLoading={isLoadingCounter}/>
            </Col>
        </RecipientCounterContainer>
    )
}

export const MemoizedRecipientCounter = React.memo(RecipientCounter)

export const MemoizedNewsSharingRecipientCounter = React.memo(NewsSharingRecipientCounter)