import React from 'react'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import { DesktopUserMenu } from './DesktopUserMenu'
import { MobileUserMenu } from './MobileUserMenu'

export const UserMenu = () => {
    const { breakpoints } = useLayoutContext()

    return (
        !breakpoints.TABLET_LARGE ? <MobileUserMenu/> : <DesktopUserMenu/>
    )
}
