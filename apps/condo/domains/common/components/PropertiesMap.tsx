import React, { ComponentProps, useMemo } from 'react'
import { css } from '@emotion/core'
import { MapGL } from '@condo/domains/common/components/MapGL'
import has from 'lodash/has'
import { Property } from '@condo/domains/property/utils/clientSchema'

type PropertiesMapProps = {
    propertiesToRender: Property.IPropertyUIState[]
} & Omit<ComponentProps<typeof MapGL>, 'points'>

export default function PropertiesMap ({ propertiesToRender, ...mapGLProps }: PropertiesMapProps) {
    const points = useMemo(() =>
        propertiesToRender
            .filter(property => has(property, ['addressMeta', 'data']))
            .map(property => {
                const { geo_lat, geo_lon } = property.addressMeta.data
                return {
                    title: property.name,
                    text: property.address,
                    location: { lat: geo_lat, lng: geo_lon },
                    route: `/property/${property.id}/`,
                }
            }), [propertiesToRender])
            
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