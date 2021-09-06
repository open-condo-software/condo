/** @jsx jsx */
import React, { useEffect, useState } from 'react'

import { load } from '@2gis/mapgl'

import { DEFAULT_CENTER, MARKER_SVG_URL } from '../constants/map'
import { Card, Tag } from 'antd'

import getConfig from 'next/config'

import { jsx } from '@emotion/core'

const {
    publicRuntimeConfig: { mapApiKey },
} = getConfig()

export interface IPointsOfInterest {
    title?: string,
    text?: string,
    location: { lat: number, lng: number },
    route?: string
}

export interface IMapProps {
    points: [IPointsOfInterest],
    containerCss?: React.CSSProperties
}


const _toArrCoordinates = ({ lng, lat }) => [Number(lng), Number(lat)] 

export const MapGL: React.FC<IMapProps> = ({ points, containerCss }) => {
    
    const [map, setMap] = useState(null)
    const [api, setApi] = useState(null)

    const [selected, setSelected] = useState(null)

    useEffect(() => {
        let handleResize
        load().then((mapglAPI) => {
            setApi(mapglAPI)
            const map = new mapglAPI.Map('map-container', {
                center: DEFAULT_CENTER,
                zoom: 13,
                zoomControl: true,
                key: mapApiKey,
            })
            setMap(map)
            handleResize = (() => {
                map.invalidateSize()
            })
            window.addEventListener('resize', handleResize)
        })
        return () => {
            window.removeEventListener('resize', handleResize)
        }
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
                marker.on('click', function (){
                    setSelected(point)
                })        
            }
        }
    }, [map, points, api])

    return (
        <>  
            <div id="map-container" css={containerCss}/>
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