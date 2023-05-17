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

type CondoTabsProps = {
    leftExtraContent?: React.ReactNode
    rightExtraContent?: React.ReactNode
}

export type TabsProps = Pick<DefaultTabsProps,
'className' |
'id' |
'defaultActiveKey' |
'activeKey' |
'destroyInactiveTabPane' |
'onChange'> & {
    items?: Array<TabItem>
} & CondoTabsProps

export const Tabs: React.FC<TabsProps> = (props) => {
    const { onChange, id, items = [], leftExtraContent = null, rightExtraContent = null,  ...restProps } = props

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

    const tabBarExtraContent = {
        left: leftExtraContent,
        right: rightExtraContent,
    }

    return <DefaultTabs {...restProps} id={id} onChange={handleChange} items={itemsWithIcons} tabBarExtraContent={tabBarExtraContent} prefixCls={TABS_CLASS_PREFIX}/>
}