import React, { useState, useCallback } from 'react'
import { useIntl } from '@core/next/intl'
import { Col, Row } from 'antd'
import { useRouter } from 'next/router'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import isEmpty from 'lodash/isEmpty'
import {
    EmptyBuildingBlock,
    EmptyFloor,
    BuildingAxisY,
    BuildingChooseSections,
    MapSectionContainer,
} from './BuildingPanelCommon'
import { UnitButton } from '@condo/domains/property/components/panels/Builder/UnitButton'
import { MapView } from './MapConstructor'
import { BuildingMap } from '@app/condo/schema'
import { useObject } from '@condo/domains/property/utils/clientSchema/Property'
import ScrollContainer from 'react-indiana-drag-scroll'
import { FullscreenWrapper, FullscreenHeader } from './Fullscreen'
import { AddressTopTextContainer } from './BuildingPanelEdit'

interface IBuildingPanelViewProps {
    map: BuildingMap
}

export const BuildingPanelView: React.FC<IBuildingPanelViewProps> = ({ map }) => {
    const mapView = new MapView(map)
    const [Map, setMap] = useState(mapView)
    // TODO(zuch): Ask for a better solution
    const refresh = () => setMap(cloneDeep(Map))
    return (
        <PropertyMapView Builder={Map} refresh={refresh} />
    )
}

interface IPropertyMapViewProps {
    Builder: MapView
    refresh(): void
}

const CHESS_ROW_STYLE: React.CSSProperties = {
    width: '100%',
    height: '100%',
    textAlign: 'center',
}
const CHESS_COL_STYLE: React.CSSProperties = {
    paddingTop: '60px',
    paddingBottom: '60px',
}
const CHESS_SCROLL_HOLDER_STYLE: React.CSSProperties = {
    whiteSpace: 'nowrap',
    position: 'static',
    paddingTop: '20px',
}
const CHESS_SCROLL_CONTAINER_STYLE: React.CSSProperties = {
    paddingBottom: '20px',
    width: '100%',
    overflowY: 'hidden',
}
const FULL_SIZE_UNIT_STYLE: React.CSSProperties = { width: '100%', marginTop: '8px', display: 'block' }

export const PropertyMapView: React.FC<IPropertyMapViewProps> = ({ Builder, refresh }) => {
    const intl = useIntl()
    const AtticTitlePrefix = intl.formatMessage({ id: 'Attic' })
    const BasementTitlePrefix = intl.formatMessage({ id: 'Basement' })
    const RoofTitlePrefix = intl.formatMessage({ id: 'Roof' })

    const { query: { id } } = useRouter()
    const { obj: property } = useObject({ where: { id: id as string } })

    const [isFullscreen, setFullscreen] = useState(false)

    const toggleFullscreen = useCallback(() => {
        setFullscreen(!isFullscreen)
    }, [isFullscreen])

    return (
        <FullscreenWrapper mode={'view'} className={isFullscreen ? 'fullscreen' : '' }>
            <FullscreenHeader edit={false}>
                <Row>
                    <Col flex={0}>
                        <AddressTopTextContainer>{get(property, 'address')}</AddressTopTextContainer>
                    </Col>
                </Row>
            </FullscreenHeader>
            <Row align='middle' style={CHESS_ROW_STYLE}>
                {
                    Builder.isEmpty ?
                        <Col span={24} style={CHESS_COL_STYLE}>
                            <EmptyBuildingBlock />
                        </Col>
                        :
                        <Col span={24} style={CHESS_SCROLL_HOLDER_STYLE}>
                            <ScrollContainer
                                className="scroll-container"
                                style={CHESS_SCROLL_CONTAINER_STYLE}
                                vertical={false}
                                horizontal={true}
                                hideScrollbars={false}
                                nativeMobileScroll={true}
                            >
                                {
                                    !isEmpty(Builder.sections) && (
                                        <BuildingAxisY
                                            floors={Builder.possibleChosenFloors}
                                            hasBasement={Builder.possibleBasements}
                                        />
                                    )
                                }
                                {
                                    Builder.sections.map(section => (
                                        <MapSectionContainer
                                            key={section.id}
                                            visible={Builder.isSectionVisible(section.id)}
                                        >
                                            {section.roof && (
                                                <UnitButton
                                                    ellipsis={false}
                                                    disabled
                                                    style={FULL_SIZE_UNIT_STYLE}
                                                >{RoofTitlePrefix}</UnitButton>
                                            )}
                                            {section.attic && section.attic.map(attic => (
                                                <UnitButton
                                                    key={attic.index}
                                                    ellipsis={false}
                                                    disabled
                                                    style={FULL_SIZE_UNIT_STYLE}
                                                >{AtticTitlePrefix} {attic.label}</UnitButton>
                                            ))}
                                            {
                                                Builder.possibleChosenFloors.map(floorIndex => {
                                                    const floorInfo = section.floors.find(floor => floor.index === floorIndex)
                                                    if (floorInfo && floorInfo.units.length) {
                                                        return (
                                                            <div key={floorInfo.id} style={{ display: 'block' }}>
                                                                {
                                                                    floorInfo.units.map(unit => {
                                                                        return (
                                                                            <UnitButton
                                                                                key={unit.id}
                                                                                noninteractive
                                                                            >{unit.label}</UnitButton>
                                                                        )
                                                                    })
                                                                }
                                                            </div>
                                                        )
                                                    } else {
                                                        return (
                                                            <EmptyFloor key={`empty_${section.id}_${floorIndex}`} />
                                                        )
                                                    }
                                                })
                                            }
                                            {section.basement && section.basement.map(basement => (
                                                <UnitButton
                                                    key={basement.index}
                                                    ellipsis={false}
                                                    disabled
                                                    style={FULL_SIZE_UNIT_STYLE}
                                                >{BasementTitlePrefix} {basement.label}</UnitButton>
                                            ))}
                                            <UnitButton
                                                secondary
                                                style={{ width: '100%', marginTop: '8px' }}
                                                disabled
                                            >{section.name}</UnitButton>
                                        </MapSectionContainer>
                                    ))
                                }
                            </ScrollContainer>
                            {
                                <BuildingChooseSections
                                    Builder={Builder}
                                    refresh={refresh}
                                    toggleFullscreen={toggleFullscreen}
                                    isFullscreen={isFullscreen}
                                    mode="view"
                                />
                            }
                        </Col>
                }
            </Row>
        </FullscreenWrapper>
    )
}
