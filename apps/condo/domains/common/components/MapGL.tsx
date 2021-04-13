import React, { useEffect, useState } from 'react'

import { load } from '@2gis/mapgl'

import { DEFAULT_CENTER, GUEST_API_KEY, MARKER_SVG_URL } from '../constants/map'
import { Card, Tag } from 'antd'

export const DEFAULT_MAP_CENTER = [37.618423, 55.751244]

export interface IPointsOfInterest {
    title?: string,
    text?: string,
    location: { lat: number, lng: number },
    route?: string
}

export interface IMapProps {
    points: [IPointsOfInterest],
}

const MapWrapper = React.memo(function MapWrapper () {
    return <>
        <div id="map-container" style={{ position: 'absolute', top: 100, bottom: 0, right: 0, left: 0 }}></div>
    </>
}, () => true )

const _toArrCoordinates = ({ lng, lat }) => [Number(lng), Number(lat)] 


export const MapGL: React.FC<IMapProps> = ({ points }) => {
    
    const [map, setMap] = useState(null)
    const [api, setApi] = useState(null)

    const [selected, setSelected] = useState(null)
    
    useEffect(() => {
        load().then((mapglAPI) => {
            setApi(mapglAPI)
            const map = new mapglAPI.Map('map-container', {
                center: DEFAULT_CENTER,
                zoom: 13,
                zoomControl: true,
                key: GUEST_API_KEY,
            })
            setMap(map)
        })
    }, [])

    useEffect(() => {        
        const center = points.length ? _toArrCoordinates(points[0].location) : DEFAULT_CENTER    
        if (!map) {
            return
        }
        map.setCenter(center)
        if (points.length) {
            for (const point of points) {
                const marker = new api.Marker(map, {
                    coordinates: _toArrCoordinates(point.location),
                    icon: MARKER_SVG_URL,                    
                })
                marker.on('click', function (e){
                    setSelected(point)
                    console.log('Marker is clicked', point)
                })        
            }
        }
    }, [map, points, api])

    return (
        <>  
            <MapWrapper>
            </MapWrapper>
            { selected ? 
                <Card style={{ width: 300, bottom: 20, position: 'absolute' }} >
                    <p>
                        <b>{selected.text}</b>
                    </p>
                    <p>
                        <Tag >{selected.title}</Tag>
                    </p>
                </Card> : null
            }
        </>
    )
}