import React, { ComponentProps, useMemo } from 'react'
import { css } from '@emotion/react'
import { MapGL } from '@condo/domains/common/components/MapGL'
import has from 'lodash/has'
import { Division } from '@condo/domains/division/utils/clientSchema'
import { Property as PropertyType } from '@app/condo/schema'

type PropertiesMapProps = {
    properties: (PropertyType | Division.IDivisionUIState)[]
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

        const divisions = properties
            .filter(division => has(division, ['properties']))
            .flatMap((division: Division.IDivisionUIState) => division.properties)
            .filter(property => has(property, ['addressMeta', 'data']))
            .map(propertyMapper)

        return buildings.concat(divisions)

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