import React from 'react'
import { BuildingPanelView } from './Builder/BuildingPanelView'
import { BuildingMap } from '@app/condo/schema'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { Typography } from '@open-condo/ui'
import { useIntl } from '@open-condo/next/intl'
import { IPropertyMapFormProps } from '@condo/domains/property/components/BasePropertyMapForm'


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
    const BuildingTitle = intl.formatMessage({ id: 'pages.condo.property.form.BuildingTabTitle' })

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
