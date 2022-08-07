import React from 'react'
import { BuildingPanelView } from './Builder/BuildingPanelView'
import { ResidentPanelEdit, ResidentPanelView } from './ResidentPanel'
import { BuildingMap } from '@app/condo/schema'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { Tabs } from 'antd'

import { useIntl } from '@condo/next/intl'

const { TabPane } = Tabs

interface IPropertyPanels {
    map: BuildingMap | null
    mode: 'view' | 'edit'
    updateMap?(map: BuildingMap): void
    handleSave?(): void
    address?: string,
    mapValidationError?: string
}

const FOCUS_CONTAINER_STYLE: React.CSSProperties = {
    margin: 'initial',
    marginTop: '40px',
    marginBottom: '60px',
    padding: 0,
}

export const PropertyPanels: React.FC<IPropertyPanels> = ({ mode, map }) => {
    const intl = useIntl()
    const BuildingTabTitle = intl.formatMessage({ id: 'pages.condo.property.form.BuildingTabTitle' })
    const ResidentsTabTitle = intl.formatMessage({ id: 'pages.condo.property.form.ResidentsTabTitle' })
    return (
        <Tabs defaultActiveKey='1'>
            <TabPane tab={BuildingTabTitle} key='1'>
                <FocusContainer style={FOCUS_CONTAINER_STYLE}>
                    <BuildingPanelView
                        map={map}
                    />
                </FocusContainer>
            </TabPane>
            <TabPane tab={ResidentsTabTitle} key='2' disabled>
                <FocusContainer style={FOCUS_CONTAINER_STYLE}>
                    {
                        mode === 'view' ? <ResidentPanelView /> : <ResidentPanelEdit />
                    }
                </FocusContainer>
            </TabPane>
        </Tabs>

    )
}
