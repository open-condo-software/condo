import React from 'react'

import { DesktopSideNav } from './DesktopSideNav'
import { MobileSideNav } from './MobileSideNav'

interface ISideNav {
    menuData?: React.ReactNode
    onLogoClick?: () => void
}

export const SideNav: React.FC<ISideNav> = (props) => {
    const { menuData, onLogoClick } = props

    return (
        <>
            <DesktopSideNav onLogoClick={onLogoClick} menuData={menuData}/>
            <MobileSideNav menuData={menuData}/>
        </>
    )
}
