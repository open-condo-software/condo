import { BuildingPanelView } from './Builder/BuildingPanelView'
import { BuildingPanelEdit } from './Builder/BuildingPanelEdit'
import { ResidentPanelEdit, ResidentPanelView } from './ResidentPanel'
import { BuildingMap } from './Builder/MapConstructor'
import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { Tabs } from 'antd'

import { useIntl } from '@core/next/intl'

const { TabPane } = Tabs

interface IPropertyPanels {
    map: BuildingMap | null
    mode: 'view' | 'edit' 
    updateMap?(map: BuildingMap): void    
}


export const PropertyPanels: React.FC<IPropertyPanels> = ({ mode, map, updateMap }) => {
    const intl = useIntl()
    const BuildingTabTitle = intl.formatMessage({ id: 'pages.condo.property.form.BuildingTabTitle' })
    const ResidentsTabTitle = intl.formatMessage({ id: 'pages.condo.property.form.ResidentsTabTitle' })
    return (
        <Tabs defaultActiveKey='1'>
            <TabPane tab={BuildingTabTitle} key='1'>
                <FocusContainer style={{ margin: 'initial', marginTop: '40px' }}>
                    {
                        mode === 'view' ? <BuildingPanelView map={map as BuildingMap} /> : <BuildingPanelEdit map={map as BuildingMap} updateMap={updateMap}/>
                    }
                </FocusContainer>
            </TabPane>
            <TabPane tab={ResidentsTabTitle} key='2'>
                <FocusContainer style={{ margin: 'initial', marginTop: '40px' }}>
                    {
                        mode === 'view' ? <ResidentPanelView /> : <ResidentPanelEdit />
                    }
                </FocusContainer>
            </TabPane>
        </Tabs>

    )
}
