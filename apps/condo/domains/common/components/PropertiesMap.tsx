import { Property as PropertyType } from '@app/condo/schema'
import { css } from '@emotion/react'
import has from 'lodash/has'
import React, { ComponentProps, useMemo } from 'react'

import { MapGL } from '@condo/domains/common/components/MapGL'


type PropertiesMapProps = {
    properties: (PropertyType)[]
} & Omit<ComponentProps<typeof MapGL>, 'points'>

export default function PropertiesMap ({ properties, ...mapGLProps }: PropertiesMapProps) {

    const propertyMapper = (property: PropertyType) => {
        const { geo_lat, geo_lon } = property.addressMeta.data
        const geo_latNumber = parseFloat(geo_lat) || 0
        const geo_lonNumber = parseFloat(geo_lon) || 0
        return {
            title: property.name,
            text: property.address,
            location: { lat: geo_latNumber, lng: geo_lonNumber },
            route: `/property/${property.id}/`,
        }
    }

    const points = useMemo(() => {
        const buildings = (properties
            .filter((property) => has(property, ['addressMeta', 'data'])) as unknown as PropertyType[])
            .map(propertyMapper)

        return buildings

    }, [properties])

    return (
        <MapGL points={points} {...mapGLProps} />
    )
}
PropertiesMap.defaultProps = {
    containerCss: css`
    position: absolute;
    top: 280px;
    bottom: 0;
    right: 0;
    left: 0;
`,
}