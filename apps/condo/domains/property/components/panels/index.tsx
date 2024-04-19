import { BuildingMap } from '@app/condo/schema'
import React from 'react'

import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { IPropertyMapFormProps } from '@condo/domains/property/components/BasePropertyMapForm'

import { BuildingPanelView } from './Builder/BuildingPanelView'


interface IPropertyPanels extends Pick<IPropertyMapFormProps, 'canManageProperties'> {
    map: BuildingMap | null
    mode: 'view' | 'edit'
    updateMap?(map: BuildingMap): void
    handleSave?(): void
    address?: string,
    mapValidationError?: string
}

const FOCUS_CONTAINER_STYLE: React.CSSProperties = {
    margin: 'initial',
    padding: 0,
}

export const PropertyPanels: React.FC<IPropertyPanels> = (props) => {
    const { map, canManageProperties = false } = props

    return (
        <FocusContainer style={FOCUS_CONTAINER_STYLE}>
            <BuildingPanelView
                map={map}
                canManageProperties={canManageProperties}
            />
        </FocusContainer>
    )
}
