import {
    Tabs as DefaultTabs,
    TabsProps as DefaultTabsProps,
} from 'antd'
import React, { useCallback } from 'react'

import { sendAnalyticsChangeEvent } from '../_utils/analytics'

const TABS_CLASS_PREFIX = 'condo-tabs'

export type TabItem = {
    key: string
    label: string
    icon?: React.ReactNode
    disabled?: boolean
    children?: React.ReactNode
}

export type TabsProps = Pick<DefaultTabsProps,
'className' |
'id' |
'defaultActiveKey' |
'activeKey' |
'destroyInactiveTabPane' |
'onChange' |
'centered'> & {
    items?: Array<TabItem>
}

export const Tabs: React.FC<TabsProps> = (props) => {
    const { onChange, id, items = [], ...restProps } = props

    const handleChange = useCallback((activeKey: string) => {
        sendAnalyticsChangeEvent('Tabs', { activeKey, id })

        if (onChange) {
            onChange(activeKey)
        }
    }, [onChange, id])

    const itemsWithIcons = items.map(item => ({
        ...item,
        label: (
            <div className={`${TABS_CLASS_PREFIX}-tab-label`}>
                {Boolean(item.icon) && item.icon}
                <span>{item.label}</span>
            </div>
        ),
    }))

    return <DefaultTabs {...restProps} id={id} onChange={handleChange} items={itemsWithIcons} prefixCls={TABS_CLASS_PREFIX}/>
}