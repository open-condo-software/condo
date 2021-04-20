import { BMap, BuilderPanelEdit, BuilderPanelView } from './BuilderPanel'
import { ResidentPanelEdit, ResidentPanelView } from './ResidentPanel'

import { FocusContainer } from '@condo/domains/common/components/FocusContainer'
import { Tabs } from 'antd'

import { useIntl } from '@core/next/intl'

const { TabPane } = Tabs
interface IPropertyPanels {
    map: BMap
    mode: 'view' | 'edit' 
}


export const PropertyPanels: React.FC<IPropertyPanels> = ({ mode, map }) => {
    const intl = useIntl()

    const BuilderTabTitle = intl.formatMessage({ id: 'pages.condo.property.form.BuilderTabTitle' })
    const ResidentsTabTitle = intl.formatMessage({ id: 'pages.condo.property.form.ResidentsTabTitle' })
    return (
        <Tabs defaultActiveKey='1'>
            <TabPane tab={BuilderTabTitle} key='1'>
                <FocusContainer style={{ margin: 'initial', marginTop: '40px' }}>
                    {
                        mode === 'view' ? <BuilderPanelView map={map} /> : <BuilderPanelEdit map={map}/>
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

