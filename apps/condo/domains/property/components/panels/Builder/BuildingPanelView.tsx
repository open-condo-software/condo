import { 
    EmptyBuildingBlock, 
    EmptyFloor, 
    BuildingAxisY, 
    BuildingChooseSections,
} from './BuildingPanelCommon'

import { Col, Row } from 'antd'
import React, { useState } from 'react'
import { cloneDeep } from 'lodash'
import { UnitButton } from '../../UnitButton'
import {
    MapView,
    BuildingMap,
} from './MapConstructor'

import ScrollContainer from 'react-indiana-drag-scroll'

interface IBuildingPanelViewProps {
    map: BuildingMap
}

export const BuildingPanelView: React.FC<IBuildingPanelViewProps> = ({ map }) => {
    const mapView = new MapView(map)
    const [Map, setMap] = useState(mapView)
    // TODO(zuch): Ask for a better solution
    const refresh = () => setMap(cloneDeep(Map))
    return (
        <PropertyMapView Builder={Map} refresh={refresh}></PropertyMapView>
    )
}

interface IPropertyMapViewProps {
    Builder: MapView
    refresh(): void    
}

export const PropertyMapView: React.FC<IPropertyMapViewProps> = ({ Builder, refresh }) => {
    return (
        <Row align='bottom' style={{ width: '100%', textAlign: 'center' }} >
            {
                Builder.isEmpty ?
                    <Col span={24} style={{ marginTop: '60px', marginBottom: '60px' }}>
                        <EmptyBuildingBlock />
                    </Col>
                    :
                    <Col span={24} style={{ marginTop: '60px', whiteSpace: 'nowrap' }}>
                        <ScrollContainer className="scroll-container" style={{ marginTop: '60px', maxWidth: '1200px', maxHeight: '480px' }}>
                            <BuildingAxisY floors={Builder.possibleFloors} />
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
                                                Builder.possibleFloors.map(floorIndex => {
                                                    const floorInfo = section.floors.find(floor => floor.index === floorIndex)
                                                    if (floorInfo && floorInfo.units.length) {
                                                        return (
                                                            <div key={floorInfo.id} style={{ display: 'block' }}>
                                                                {
                                                                    floorInfo.units.map(unit => {
                                                                        return (
                                                                            <UnitButton
                                                                                key={unit.id}
                                                                                disabled
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
                            <BuildingChooseSections Builder={Builder} refresh={refresh}></BuildingChooseSections>
                        }
                    </Col>
            }
        </Row>
    )
}