import { Menu, Collapse } from 'antd'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { ChevronUp, ChevronDown } from '@open-condo/icons'
import { Typography } from '@open-condo/ui'
import { useBreakpoints } from '@open-condo/ui/dist/hooks'

import styles from './CollapsibleMenu.module.css'

import type { MenuProps, CollapseProps } from 'antd'


export const CollapsibleMenu: React.FC<MenuProps & { menuTitle: string }> = (props) => {
    const breakpoints = useBreakpoints()
    const { menuTitle, onClick, ...restProps } = props
    const [activeKey, setActiveKey] = useState<'menu' | undefined>(undefined)
    const isDesktop = Boolean(breakpoints.DESKTOP_SMALL)

    const handleMenuClick = useCallback<Required<MenuProps>['onClick']>((evt) => {
        setActiveKey(undefined)
        if (onClick) {
            onClick(evt)
        }
    }, [onClick])

    const handleIconChange = useCallback<Required<CollapseProps>['expandIcon']>(({ isActive }) => {
        return isActive ? <ChevronUp size='medium'/> : <ChevronDown size='medium' />
    }, [])

    const handleActiveKeyChange = useCallback<Required<CollapseProps>['onChange']>((keys) => {
        if (Array.isArray(keys)) {
            setActiveKey(keys.length ? 'menu' : undefined)
        }
    }, [])
    
    const menu =  useMemo(() => (
        <Menu {...restProps} onClick={handleMenuClick}/>
    ), [restProps, handleMenuClick])

    useEffect(() => {
        if (isDesktop) {
            setActiveKey(undefined)
        }
    }, [isDesktop])
    
    if (isDesktop) {
        return menu 
    } 
    
    return (
        <Collapse
            bordered={false}
            activeKey={activeKey}
            onChange={handleActiveKeyChange}
            className={styles.menuCollapse}
            expandIcon={handleIconChange}
            expandIconPosition='end'
        >
            <Collapse.Panel
                key='menu'
                header={<Typography.Title type='secondary' level={4}>{menuTitle}</Typography.Title>}
            >
                {menu}
            </Collapse.Panel>
        </Collapse>
    )
}