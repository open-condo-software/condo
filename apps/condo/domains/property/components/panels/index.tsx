import { BuildingMap } from '@app/condo/schema'
import React from 'react'


import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

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
    marginTop: '24px',
    marginBottom: '60px',
    padding: 0,
}

export const PropertyPanels: React.FC<IPropertyPanels> = (props) => {
    const intl = useIntl()
    const BuildingTitle = intl.formatMessage({ id: 'property.form.buildingTabTitle' })

    const { map, canManageProperties = false } = props

    return (
        <>
            <Typography.Title level={3}>{BuildingTitle}</Typography.Title>
            <FocusContainer style={FOCUS_CONTAINER_STYLE}>
                <BuildingPanelView
                    map={map}
                    canManageProperties={canManageProperties}
                />
            </FocusContainer>
        </>
    )
}
