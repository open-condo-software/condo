import React from 'react'
import { BuildingPanelView } from './Builder/BuildingPanelView'
import { BuildingPanelEdit } from './Builder/BuildingPanelEdit'
import { ResidentPanelEdit, ResidentPanelView } from './ResidentPanel'
import { BuildingMap } from '@app/condo/schema'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { Tabs } from 'antd'

import { useIntl } from '@core/next/intl'

const { TabPane } = Tabs

interface IPropertyPanels {
    map: BuildingMap | null
    mode: 'view' | 'edit'
    updateMap?(map: BuildingMap): void
    handleSave?(): void
    address?: string,
    mapValidationError?: string
}


export const PropertyPanels: React.FC<IPropertyPanels> = ({ mapValidationError, mode, map, updateMap, handleSave, address }) => {
    const intl = useIntl()
    const BuildingTabTitle = intl.formatMessage({ id: 'pages.condo.property.form.BuildingTabTitle' })
    const ResidentsTabTitle = intl.formatMessage({ id: 'pages.condo.property.form.ResidentsTabTitle' })
    return (
        <Tabs defaultActiveKey='1'>
            <TabPane tab={BuildingTabTitle} key='1'>
                <FocusContainer style={{ margin: 'initial', marginTop: '40px' }}>
                    {
                        mode === 'view'
                            ? <BuildingPanelView
                                map={map}
                            />
                            : <BuildingPanelEdit
                                mapValidationError={mapValidationError}
                                handleSave={handleSave}
                                map={map}
                                updateMap={updateMap}
                                address={address}
                            />
                    }
                </FocusContainer>
            </TabPane>
            <TabPane tab={ResidentsTabTitle} key='2' disabled>
                <FocusContainer style={{ margin: 'initial', marginTop: '40px' }}>
                    {
                        mode === 'view' ? <ResidentPanelView /> : <ResidentPanelEdit />
                    }
                </FocusContainer>
            </TabPane>
        </Tabs>

    )
}
