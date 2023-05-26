import { QuestionCircleOutlined } from '@ant-design/icons'
import { BuildingSection, NewsItemScope, Property as PropertyType, Resident as ResidentType } from '@app/condo/schema'
import { Col, Row } from 'antd'
import compact from 'lodash/compact'
import difference from 'lodash/difference'
import every from 'lodash/every'
import filter from 'lodash/filter'
import intersection from 'lodash/intersection'
import map from 'lodash/map'
import uniq from 'lodash/uniq'
import uniqBy from 'lodash/uniqBy'
import React, { CSSProperties } from 'react'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Card, Space, Typography, TypographyTitleProps } from '@open-condo/ui'
import { colors } from '@open-condo/ui/dist/colors'

import { Tooltip } from '@condo/domains/common/components/Tooltip'
import { queryFindResidentsByNewsItemAndScopes } from '@condo/domains/news/utils/accessSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { Resident } from '@condo/domains/resident/utils/clientSchema'

import { TNewsItemScopeNoInstance } from './types'

interface CounterProps {
    label: string
    value: number
    type?: TypographyTitleProps['type'],
    hint?: string
}

const styleGrayColor: CSSProperties = { color: colors.gray['5'] }
const styleMaxWidth: CSSProperties = { maxWidth: '500px' }

const Counter: React.FC<CounterProps> = ({ label, value, type = 'success', hint }) => (
    <Space direction='vertical' align='center' size={8}>
        <Space size={8} direction='horizontal' align='start'>
            <Typography.Title level={3} type={type}>{value}</Typography.Title>
            {hint && (
                <Tooltip
                    title={hint}
                    placement='bottom'
                    children={<QuestionCircleOutlined style={styleGrayColor}/>}
                />
            )}
        </Space>
        <Typography.Text type='secondary'>{label}</Typography.Text>
    </Space>
)

const isTargetedToEntireProperty = ({ property, unitType, unitName }: TNewsItemScopeNoInstance) => (
    !!property && !unitType && !unitName
)

const isTargetedToUnitName = ({ property, unitType, unitName }: TNewsItemScopeNoInstance) => (
    !!property && !unitType && !!unitName
)

const getUnitsFromProperty = ({ map }: PropertyType) => (
    map?.sections?.reduce((acc, section) => ([
        ...acc,
        ...getUnitsFromSection(section),
    ]), []) || []
)

const getUnitsFromSection = (section: BuildingSection) => section.floors.flatMap(floor => floor.units.map(unit => unit.label))

const detectTargetedSections = (newsItemScopes: NewsItemScope[], property: PropertyType): BuildingSection[] => (
    property.map?.sections?.filter(section => {
        const sectionUnits = getUnitsFromSection(section)
        const newsItemScopesUnits = map(newsItemScopes, 'unitName')
        return intersection(sectionUnits, newsItemScopesUnits).length === sectionUnits.length
    })
)

const areTargetedToOneProperty = (newsItemScopes) => uniq(map(newsItemScopes, ['property', 'id'])).length === 1

const buildMessageFromNewsItemScopes = (newsItemScopes, intl) => {
    if (newsItemScopes.length === 0) {
        return intl.formatMessage({ id: 'news.component.RecipientCounter.toResidentsInAllProperties' })
    } else if (newsItemScopes.length === 1 && isTargetedToEntireProperty(newsItemScopes[0])) {
        return intl.formatMessage({ id: 'news.component.RecipientCounter.toResidentsInProperty' }, {
            address: newsItemScopes[0].property.address,
        })
    } else if (every(newsItemScopes, isTargetedToEntireProperty)) {
        const displayCount = 3
        const addressList = newsItemScopes.map(({ property }) => property.name).join(', ')
        const andMoreCount = newsItemScopes.length <= displayCount ? null : newsItemScopes.length - displayCount
        const andMore = !andMoreCount ? '' : intl.formatMessage({ id: 'news.component.RecipientCounter.toResidentsInProperties.andMore' }, { count: andMoreCount })
        return intl.formatMessage({ id: 'news.component.RecipientCounter.toResidentsInProperties' }, {
            addressList,
            andMore,
        })
    } else if (areTargetedToOneProperty(newsItemScopes) && every(newsItemScopes, isTargetedToUnitName)) {
        const property: PropertyType = newsItemScopes[0].property
        const targetedSections = detectTargetedSections(newsItemScopes, property)
        if (targetedSections.length === 1) {
            return intl.formatMessage({ id: 'news.component.RecipientCounter.toResidentsInPropertySection' }, {
                section: targetedSections[0].name,
                address: newsItemScopes[0].property.address,
            })
        } else if (targetedSections.length > 1) {
            return intl.formatMessage({ id: 'news.component.RecipientCounter.toResidentsInPropertySections' }, {
                sections: map(targetedSections, 'name').join(', '),
                address: newsItemScopes[0].property.address,
            })
        } else {
            return intl.formatMessage({ id: 'news.component.RecipientCounter.toResidentsInPropertyUnits' }, {
                unitNames: map(newsItemScopes, 'unitName').join(', '),
                address: newsItemScopes[0].property.address,
            })
        }
    }
}

/**
 * Will subtract units, covered by "residents" from units covered by "properties"
 * @param residents - Residents, that will receive NewsItem, scoped by NewsItemScope records
 * @param properties - Properties, covered by NewsItemScope records
 */
const calculateWillNotReceiveCount = (residents: ResidentType[], properties: PropertyType[]) => {
    return properties.reduce((acc, property) => {
        const propertyResidents = filter(residents, { property: { id: property.id } })
        const propertyUnits = getUnitsFromProperty(property)
        const residentUnits = uniq(map(propertyResidents, 'unitName'))
        return acc + difference(propertyUnits, residentUnits).length
    }, 0)
}

interface RecipientCounterProps {
    newsItemScopes: TNewsItemScopeNoInstance[]
}

export const RecipientCounter: React.FC<RecipientCounterProps> = ({ newsItemScopes }) => {
    const intl = useIntl()
    const MailingMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.mailing' })
    const PropertiesLabelMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.label.properties' })
    const WillReceiveLabelMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.willReceive.label' })
    const WillNotReceiveLabelMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.willNotReceive.label' })
    const WillNotReceiveHintMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.willNotReceive.hint' })
    const formatWillReceiveHintMessage = (count) => intl.formatMessage({ id: 'news.component.RecipientCounter.willReceive.hint' }, { count })

    const { organization } = useOrganization()

    const propertyIdsFromNewsItemScopes = compact(uniq(map(newsItemScopes, 'property.id')))

    const { objs: properties, loading: loadingProperties } = Property.useAllObjects({
        where: {
            organization: { id: organization.id },
            ...(propertyIdsFromNewsItemScopes.length > 1 ? { id_in: propertyIdsFromNewsItemScopes } : {}),
            deletedAt: null,
        },
    })

    const { objs: residents, loading: loadingResidents } = Resident.useAllObjects({
        where: queryFindResidentsByNewsItemAndScopes(organization.id, newsItemScopes),
    })

    if (loadingProperties || loadingResidents) {
        return null
    }

    const message = buildMessageFromNewsItemScopes(newsItemScopes, intl)

    // NOTE(antonal): Not all corner cases are handled, because they rarely will occur:
    // - When some records of NewsItemScope are connected to Property and some are not
    // - When some records of NewsItemScope have unitName, that does not exist in connected Property
    // - When some Resident's unitName is out of units range of a property, that can happen if Property.map was changed after Resident was registered

    const propertiesWillReceive = newsItemScopes.length === 0
        ? properties
        : properties.filter(p => propertyIdsFromNewsItemScopes.includes(p.id)) // Take Property objects with full set of fields, obtained using Property client utils

    const unitsWillReceive = uniqBy(residents, ({ property, unitName }) => [property.id, unitName].join('-'))

    const willNotReceiveUnitsCount = calculateWillNotReceiveCount(residents, propertiesWillReceive)

    return (
        <div style={styleMaxWidth}>
            <Card>
                <Space direction='vertical' size={24} width='100%'>
                    <Typography.Text>{MailingMessage} <Typography.Text
                        strong>{message}</Typography.Text></Typography.Text>
                    <Col xs={24}>
                        <Row align='top' justify='space-evenly'>
                            <Col>
                                <Counter
                                    label={PropertiesLabelMessage}
                                    value={propertiesWillReceive.length}
                                />
                            </Col>
                            <Col>
                                <Counter
                                    label={WillReceiveLabelMessage}
                                    value={unitsWillReceive.length}
                                    hint={formatWillReceiveHintMessage(unitsWillReceive.length)}
                                />
                            </Col>
                            <Col>
                                <Counter
                                    label={WillNotReceiveLabelMessage}
                                    value={willNotReceiveUnitsCount}
                                    type='danger'
                                    hint={WillNotReceiveHintMessage}
                                />
                            </Col>
                        </Row>
                    </Col>
                </Space>
            </Card>
        </div>
    )
}
