import { BuildingMap, BuildingUnitSubType } from '@app/condo/schema'
import { Col, Row, RowProps } from 'antd'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import { useRouter } from 'next/router'
import React, { useState, useCallback, useMemo } from 'react'
import ScrollContainer from 'react-indiana-drag-scroll'

import { useIntl } from '@open-condo/next/intl'

import { IPropertyMapFormProps } from '@condo/domains/property/components/BasePropertyMapForm'
import { UnitButton } from '@condo/domains/property/components/panels/Builder/UnitButton'
import { Property } from '@condo/domains/property/utils/clientSchema'

import {
    EmptyBuildingBlock,
    EmptyFloor,
    BuildingAxisY,
    BuildingChooseSections,
    MapSectionContainer, BuildingViewModeSelect, UnitTypeLegendItem,
} from './BuildingPanelCommon'
import { AddressTopTextContainer } from './BuildingPanelEdit'
import { FullscreenWrapper, FullscreenHeader } from './Fullscreen'
import { MapView, MapViewMode } from './MapConstructor'






interface IBuildingPanelViewProps extends Pick<IPropertyMapFormProps, 'canManageProperties'> {
    map: BuildingMap
}

export const BuildingPanelView: React.FC<IBuildingPanelViewProps> = ({ map, canManageProperties = false }) => {
    const mapView = new MapView(map)
    const [builderMap, setBuilderMap] = useState(mapView)
    // TODO(zuch): Ask for a better solution
    const refresh = () => setBuilderMap(cloneDeep(builderMap))
    return (
        <PropertyMapView builder={builderMap} refresh={refresh} canManageProperties={canManageProperties} />
    )
}

interface IPropertyMapViewProps extends Pick<IPropertyMapFormProps, 'canManageProperties'> {
    builder: MapView
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
    paddingBottom: '10px',
}
const CHESS_SCROLL_CONTAINER_STYLE: React.CSSProperties = {
    paddingBottom: '20px',
    width: '100%',
    overflowY: 'hidden',
}
const UNIT_BUTTON_SECTION_STYLE: React.CSSProperties = { width: '100%', marginTop: '8px' }
const FLOOR_CONTAINER_STYLE: React.CSSProperties = { display: 'block' }
const UNIT_TYPE_ROW_STYLE: React.CSSProperties = { paddingLeft: '8px' }
const FULLSCREEN_HEADER_STYLE: React.CSSProperties = { marginBottom: '28px', alignItems: 'center' }
const UNIT_TYPE_ROW_GUTTER: RowProps['gutter'] = [42, 0]

export const PropertyMapView: React.FC<IPropertyMapViewProps> = ({ builder, refresh, canManageProperties = false }) => {
    const intl = useIntl()
    const ParkingTitlePrefix = intl.formatMessage({ id: 'pages.condo.property.select.option.parking' })
    const SectionNamePrefixTitle = intl.formatMessage({ id: 'pages.condo.property.section.Name' })

    const { query: { id } } = useRouter()
    const { obj: property } = Property.useObject({ where: { id: id as string } })

    const [isFullscreen, setFullscreen] = useState(false)

    const toggleFullscreen = useCallback(() => {
        setFullscreen(!isFullscreen)
    }, [isFullscreen])

    const onViewModeChange = useCallback((option) => {
        builder.viewMode = option.target.value
        refresh()
    }, [builder, refresh])

    const unitTypeOptions = builder.getUnitTypeOptions()

    const UnitTypeOptionsLegend = useMemo(() => <Row
        gutter={UNIT_TYPE_ROW_GUTTER}
        style={UNIT_TYPE_ROW_STYLE}
        hidden={builder.viewMode === MapViewMode.parking}
    >
        {unitTypeOptions
            .filter(unitType => unitType !== BuildingUnitSubType.Flat)
            .map((unitType, unitTypeKey) => (
                <Col key={unitTypeKey} flex={0}>
                    <UnitTypeLegendItem unitType={unitType}>
                        {intl.formatMessage({ id: `pages.condo.property.modal.unitType.${unitType}` })}
                    </UnitTypeLegendItem>
                </Col>
            ))}
    </Row>, [builder.viewMode, unitTypeOptions])

    const showViewModeSelect = !builder.isEmptySections && !builder.isEmptyParking

    return (
        <FullscreenWrapper className={isFullscreen ? 'fullscreen' : '' }>
            <FullscreenHeader edit={false}>
                <Row justify='end' style={FULLSCREEN_HEADER_STYLE} hidden={!showViewModeSelect}>
                    {
                        isFullscreen ? (
                            <Col flex={1}>
                                <AddressTopTextContainer>{get(property, 'address')}</AddressTopTextContainer>
                            </Col>
                        ) : (
                            <Col flex={1}>
                                {UnitTypeOptionsLegend}
                            </Col>
                        )
                    }
                    {
                        showViewModeSelect && (
                            <Col flex={0}>
                                <BuildingViewModeSelect
                                    value={builder.viewMode}
                                    onChange={onViewModeChange}

                                />
                            </Col>
                        )
                    }
                </Row>
                {isFullscreen && UnitTypeOptionsLegend}
            </FullscreenHeader>
            <Row align='middle' style={CHESS_ROW_STYLE}>
                {
                    builder.isEmpty ?
                        <Col span={24} style={CHESS_COL_STYLE}>
                            <EmptyBuildingBlock canManageProperties={canManageProperties} />
                        </Col>
                        :
                        <Col span={24} style={CHESS_SCROLL_HOLDER_STYLE}>
                            <ScrollContainer
                                className='scroll-container'
                                style={CHESS_SCROLL_CONTAINER_STYLE}
                                vertical={false}
                                horizontal={true}
                                hideScrollbars={false}
                                nativeMobileScroll={true}
                            >
                                {
                                    builder.viewMode === MapViewMode.section
                                        ? !builder.isEmptySections && (
                                            <BuildingAxisY floors={builder.possibleChosenFloors} />
                                        )
                                        : !builder.isEmptyParking && (
                                            <BuildingAxisY floors={builder.possibleChosenParkingFloors} />
                                        )
                                }
                                {
                                    builder.viewMode === MapViewMode.section
                                        ? builder.sections.map(section => (
                                            <MapSectionContainer
                                                key={section.id}
                                                visible={builder.isSectionVisible(section.id)}
                                            >
                                                {
                                                    builder.possibleChosenFloors.map(floorIndex => {
                                                        const floorInfo = section.floors.find(floor => floor.index === floorIndex)
                                                        if (floorInfo && floorInfo.units.length) {
                                                            return (
                                                                <div key={floorInfo.id} style={FLOOR_CONTAINER_STYLE}>
                                                                    {
                                                                        floorInfo.units.map(unit => {
                                                                            return (
                                                                                <UnitButton
                                                                                    key={unit.id}
                                                                                    noninteractive
                                                                                    unitType={unit.unitType}
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
                                                <UnitButton
                                                    secondary
                                                    style={UNIT_BUTTON_SECTION_STYLE}
                                                    disabled
                                                >{SectionNamePrefixTitle} {section.name}</UnitButton>
                                            </MapSectionContainer>
                                        ))
                                        : builder.parking.map(parkingSection => (
                                            <MapSectionContainer
                                                key={parkingSection.id}
                                                visible={builder.isParkingSectionVisible(parkingSection.id)}
                                            >
                                                {
                                                    builder.possibleChosenParkingFloors.map(floorIndex => {
                                                        const floorInfo = parkingSection.floors.find(floor => floor.index === floorIndex)
                                                        if (floorInfo && floorInfo.units.length) {
                                                            return (
                                                                <div key={floorInfo.id} style={FLOOR_CONTAINER_STYLE}>
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
                                                                <EmptyFloor key={`empty_${parkingSection.id}_${floorIndex}`} />
                                                            )
                                                        }
                                                    })
                                                }
                                                <UnitButton
                                                    secondary
                                                    style={UNIT_BUTTON_SECTION_STYLE}
                                                    disabled
                                                >{ParkingTitlePrefix} {parkingSection.name}</UnitButton>
                                            </MapSectionContainer>
                                        ))
                                }
                            </ScrollContainer>
                            <BuildingChooseSections
                                builder={builder}
                                refresh={refresh}
                                toggleFullscreen={toggleFullscreen}
                                isFullscreen={isFullscreen}
                                mode='view'
                            />
                        </Col>
                }
            </Row>
        </FullscreenWrapper>
    )
}
