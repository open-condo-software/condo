import {
    EmptyBuildingBlock,
    EmptyFloor,
    BuildingAxisY,
    BuildingChooseSections,
} from './BuildingPanelCommon'
import { Col, Row } from 'antd'
import React, { useEffect, useState } from 'react'
import cloneDeep from 'lodash/cloneDeep'
import { UnitButton } from '@condo/domains/property/components/panels/Builder/UnitButton'
import { MapView } from './MapConstructor'
import { BuildingMap } from '@app/condo/schema'
import { useObject } from '@condo/domains/property/utils/clientSchema/Property'
import { useRouter } from 'next/router'
import ScrollContainer from 'react-indiana-drag-scroll'
import { FullscreenWrapper, FullscreenHeader } from './Fullscreen'
import get from 'lodash/get'
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
    ...CHESS_COL_STYLE,
}
const CHESS_SCROLL_CONTAINER_STYLE: React.CSSProperties = {
    paddingBottom: '60px',
    width: '100%',
    overflowY: 'hidden',
}

export const PropertyMapView: React.FC<IPropertyMapViewProps> = ({ Builder, refresh }) => {
    const { query: { id } } = useRouter()
    const { obj: property } = useObject({ where: { id: id as string } })

    const [isFullscreen, setFullscreen] = useState(false)

    const toggleFullscreen = () => {
        localStorage && localStorage.setItem('isFullscreen', String(!isFullscreen))
        setFullscreen(!isFullscreen)
    }

    useEffect(() => {
        setFullscreen(localStorage && localStorage.getItem('isFullscreen') === 'true')
    }, [])

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
                                    Builder.sections.length > 0 ? <BuildingAxisY floors={Builder.possibleChosenFloors} /> : null
                                }
                                {
                                    Builder.sections.map(section => {
                                        return (
                                            <div key={section.id}
                                                style={{
                                                    display: Builder.isSectionVisible(section.id) ? 'inline-block' : 'none',
                                                    marginRight: '12px',
                                                    textAlign: 'center',
                                                }}
                                            >{
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
                                                <UnitButton
                                                    secondary
                                                    style={{ width: '100%', marginTop: '8px' }}
                                                    disabled
                                                >{section.name}</UnitButton>
                                            </div>
                                        )
                                    })
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
