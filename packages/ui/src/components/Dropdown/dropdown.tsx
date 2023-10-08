import { Dropdown as DefaultDropdown, DropdownProps as DefaultDropdownProps } from 'antd'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import { MenuInfo } from 'rc-menu/lib/interface'
import React, { useCallback } from 'react'

import { extractChildrenContent, sendAnalyticsClickEvent } from '../_utils/analytics'


export const DROPDOWN_CLASS_PREFIX = 'condo-dropdown'

export type DropdownProps = Omit<DefaultDropdownProps, 'visible' | 'prefixCls' | 'overlayStyle'>

const Dropdown: React.FC<DropdownProps> = ({ menu, children,  ...props }) => {
    const handleClickMenu = useCallback(async (info: MenuInfo) => {
        const triggerId = get(children, 'props.id')
        const triggerStringContent = extractChildrenContent(children)
        const onClickMenu = get(menu, 'onClick')

        const item = get(info, 'item')

        if (info && item) {
            const stringContent = extractChildrenContent(item)
            if (stringContent) {
                sendAnalyticsClickEvent('Dropdown', {
                    optionValue: stringContent,
                    triggerValue: triggerStringContent ?? undefined,
                    id: triggerId,
                    optionKey: info.key,
                    optionKeyPath: info.keyPath,
                })
            }
        }

        if (isFunction(onClickMenu)) {
            await onClickMenu(info)
        }
    }, [children, menu])

    return (
        <DefaultDropdown
            {...props}
            menu={{ ...menu, onClick: handleClickMenu }}
            children={children}
            prefixCls={DROPDOWN_CLASS_PREFIX}
        />
    )
}

export { Dropdown }
