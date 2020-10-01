import React from 'react'
import { CheckCircleOutlined, FrownOutlined, HeatMapOutlined, SmileOutlined } from '@ant-design/icons'

import '../styles/global.less'
import { BasicLayout } from '../layout/BasicLayout'
import { IntlProvider } from '../layout/IntlProvider'

const menuDataRender = () => [
    // type MenuDataItem
    { name: 'test', path: '/test', icon: <HeatMapOutlined/>, hideInMenu: false },
    {
        name: 'Result', path: '/result', icon: <CheckCircleOutlined/>, children: [
            { name: 'success', path: '/result/success', icon: <SmileOutlined/> },
            { name: 'failure', path: '/result/failure', icon: <FrownOutlined/> },
        ],
    },
]

function App ({ Component, pageProps }) {
    return (
        <IntlProvider>
            <BasicLayout menuDataRender={menuDataRender}>
                <Component {...pageProps} />
            </BasicLayout>
        </IntlProvider>
    )
}

export default App
