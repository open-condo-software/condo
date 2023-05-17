import { BuildingSection, NewsItemScope, Property as PropertyType, Resident as ResidentType } from '@app/condo/schema'
import styled from '@emotion/styled'
import difference from 'lodash/difference'
import every from 'lodash/every'
import filter from 'lodash/filter'
import intersection from 'lodash/intersection'
import map from 'lodash/map'
import uniq from 'lodash/uniq'

import { useIntl } from '@open-condo/next/intl'
import { useOrganization } from '@open-condo/next/organization'
import { Card, Space, Typography } from '@open-condo/ui'

import { queryFindResidentsByNewsItemAndScopes } from '@condo/domains/news/utils/accessSchema'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { Resident } from '@condo/domains/resident/utils/clientSchema'


const Counter = ({ label, value }) => (
    <Space direction='vertical' size={8}>
        <Typography.Title type='success'>{value}</Typography.Title>
        <Typography.Text type='secondary'>{label}</Typography.Text>
    </Space>
)

const JustifiedSpace = styled(Space)`
  justify-content: space-evenly;
`

const isTargetedToOrganization = ({ property, unitType, unitName }: NewsItemScope) => (
    !property && !unitType && !unitName
)

const isTargetedToEntireProperty = ({ property, unitType, unitName }: NewsItemScope) => (
    !!property && !unitType && !unitName
)

const isTargetedToUnitName = ({ property, unitType, unitName }: NewsItemScope) => (
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
    } else {
        if (newsItemScopes.length === 1 && isTargetedToEntireProperty(newsItemScopes[0])) {
            return intl.formatMessage({ id: 'news.component.RecipientCounter.toResidentsInProperty' })
        }

        if (every(newsItemScopes, isTargetedToEntireProperty)) {
            const displayCount = 3
            const addressList = newsItemScopes.map(({ property }) => property.name).join(', ')
            const andMoreCount = newsItemScopes.length <= displayCount ? null : newsItemScopes.length - displayCount
            const andMore = !andMoreCount ? '' : intl.formatMessage({ id: 'news.component.RecipientCounter.toResidentsInProperties.andMore' }, { count: andMoreCount })
            return intl.formatMessage({ id: 'news.component.RecipientCounter.toResidentsInProperties' }, {
                addressList,
                andMore,
            })
        }

        if (areTargetedToOneProperty(newsItemScopes) && every(newsItemScopes, isTargetedToUnitName)) {
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
}

/**
 * Will subtract units, covered by "residents" from units covered by "properties"
 * @param residents - Residents, that will receive NewsItem, scoped by NewsItemScope records
 * @param properties - Properties, covered by NewsItemScope records
 */
const calculateWillNotReceiveCount = (residents: ResidentType[], properties: PropertyType[]) => {
    return properties.reduce((acc, property) => {
        const propertyResidents = filter(residents, r => r.property.id === property.id)
        const propertyUnits = getUnitsFromProperty(property)
        const residentUnits = uniq(map(propertyResidents, 'unitName'))
        return acc + difference(propertyUnits, residentUnits).length
    }, 0)
}

interface RecipientCounterProps {
    newsItemScopes: NewsItemScope[]
}

export const RecipientCounter: React.FC<RecipientCounterProps> = ({ newsItemScopes }) => {
    console.debug('newsItemScopes', newsItemScopes)
    const intl = useIntl()
    const MailingMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.mailing' })
    const PropertiesLabelMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.label.properties' })
    const WillReceiveLabelMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.label.willReceive' })
    const WillNotReceiveLabelMessage = intl.formatMessage({ id: 'news.component.RecipientCounter.label.willNotReceive' })

    const { organization } = useOrganization()

    const { objs: properties, loading: loadingProperties } = Property.useObjects({ where: { organization: { id: organization.id } } })

    const { objs: residents, loading: loadingResidents } = Resident.useObjects({
        where: queryFindResidentsByNewsItemAndScopes(organization.id, newsItemScopes),
    })

    if (loadingProperties || loadingResidents) {
        return null
    }

    console.debug('residents', residents)

    const message = buildMessageFromNewsItemScopes(newsItemScopes, intl)

    // NOTE(antonal): Not all corner cases are handled, because they are rarely will occur:
    // - When some records of NewsItemScope are connected to Property and some are not
    // - When some records of NewsItemScope have unitName, that does not exist in connected Property
    const propertiesWillReceiveCount = newsItemScopes.length === 0 || newsItemScopes.length === 1 && isTargetedToOrganization(newsItemScopes[0])
        ? properties.length
        : uniq(map(newsItemScopes, ['property', 'id'])).length

    const willNotReceiveUnitsCount = calculateWillNotReceiveCount(residents, properties)

    return (
        <div style={{ maxWidth: '500px' }}>
            <Card>
                <Space direction='vertical' size={24} width='100%'>
                    <Typography.Text>{MailingMessage} <Typography.Text strong>{message}</Typography.Text></Typography.Text>
                    <JustifiedSpace direction='horizontal' align='start' size={24} width='100%'>
                        <Counter label={PropertiesLabelMessage} value={propertiesWillReceiveCount}/>
                        <Counter label={WillReceiveLabelMessage} value={residents.length}/>
                        <Counter label={WillNotReceiveLabelMessage} value={willNotReceiveUnitsCount}/>
                    </JustifiedSpace>
                </Space>
            </Card>
        </div>
    )
}
