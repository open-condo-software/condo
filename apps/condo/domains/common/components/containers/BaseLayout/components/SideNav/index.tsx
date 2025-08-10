import React from 'react'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import { DesktopSideNav } from './DesktopSideNav'
import { MobileSideNav } from './MobileSideNav'

interface ISideNav {
    menuData?: React.ReactNode
    onLogoClick?: () => void
}

export const SideNav: React.FC<ISideNav> = (props) => {
    const { breakpoints } = useLayoutContext()
    const { menuData, onLogoClick } = props

    return (
        !breakpoints.TABLET_LARGE
            ? <MobileSideNav menuData={menuData}/>
            : <DesktopSideNav onLogoClick={onLogoClick} menuData={menuData}/>
    )
}
