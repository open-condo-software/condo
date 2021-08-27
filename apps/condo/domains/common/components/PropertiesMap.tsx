import React, { ComponentProps, useMemo } from 'react'
import { css } from '@emotion/core'
import { MapGL } from '@condo/domains/common/components/MapGL'
import has from 'lodash/has'
import { Property } from '@condo/domains/property/utils/clientSchema'
import { Division } from '@condo/domains/division/utils/clientSchema'

type PropertiesMapProps = {
    properties: (Property.IPropertyUIState | Division.IDivisionUIState)[]
} & Omit<ComponentProps<typeof MapGL>, 'points'>

export default function PropertiesMap ({ properties, ...mapGLProps }: PropertiesMapProps) {
    const points = useMemo(() => {
        const buildings = properties
            .filter(property => has(property, ['addressMeta', 'data']))
            .map((property: Property.IPropertyUIState) => {
                const { geo_lat, geo_lon } = property.addressMeta.data
                return {
                    title: property.name,
                    text: property.address,
                    location: { lat: geo_lat, lng: geo_lon },
                    route: `/property/${property.id}/`,
                }
            })
        const divisions = properties
            .filter(division => has(division, ['properties']))
            .flatMap((division: Division.IDivisionUIState) => division.properties)
            .filter(property => has(property, ['addressMeta', 'data']))
            .map(divisionProperty => {
                const { geo_lat, geo_lon } = divisionProperty.addressMeta.data
                return {
                    title: divisionProperty.name,
                    text: divisionProperty.address,
                    location: { lat: geo_lat, lng: geo_lon },
                    route: `/property/${divisionProperty.id}/`,
                }
            })
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