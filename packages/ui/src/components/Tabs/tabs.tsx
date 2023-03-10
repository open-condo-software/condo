import {
    Tabs as DefaultTabs,
    TabsProps as DefaultTabsProps,
} from 'antd'
import React, { useCallback } from 'react'

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
'onChange'> & {
    items?: Array<TabItem>
}

export const Tabs: React.FC<TabsProps> = (props) => {
    const { onChange, items = [], ...restProps } = props

    const handleChange = useCallback((activeKey: string) => {
        if (onChange) {
            onChange(activeKey)
        }
    }, [onChange])

    const itemsWithIcons = items.map(item => ({
        ...item,
        label: (
            <div className={`${TABS_CLASS_PREFIX}-tab-label`}>
                {Boolean(item.icon) && item.icon}
                <span>{item.label}</span>
            </div>
        ),
    }))

    return <DefaultTabs {...restProps} onChange={handleChange} items={itemsWithIcons} prefixCls={TABS_CLASS_PREFIX}/>
}