import React from 'react'
import { useLayoutContext } from '../../../common/components/LayoutContext'
import { DesktopUserMenu } from './DesktopUserMenu'
import { MobileUserMenu } from './MobileUserMenu'

export const UserMenu = () => {
    const { isSmall } = useLayoutContext()

    return (
        isSmall ? <MobileUserMenu/> : <DesktopUserMenu/>
    )
}
