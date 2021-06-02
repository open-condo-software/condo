import { Affix } from 'antd'
import React from 'react'

const ActionBar: React.FC = ({ children }) => {
    return (
        <Affix offsetBottom={24}>
            <div className={'floatingActionBar'}>
                { children }
            </div>
        </Affix>
    )
}

export default ActionBar
