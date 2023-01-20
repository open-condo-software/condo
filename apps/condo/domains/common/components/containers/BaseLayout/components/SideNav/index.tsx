import React from 'react'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

import { DesktopSideNav } from './DesktopSideNav'
import { MobileSideNav } from './MobileSideNav'

interface ISideNav {
    menuData?: React.ElementType
    onLogoClick?: () => void
}

export const SideNav: React.FC<ISideNav> = (props) => {
    const { isSmall } = useLayoutContext()
    const { menuData, onLogoClick } = props

    return (
        isSmall
            ? <MobileSideNav menuData={menuData}/>
            : <DesktopSideNav onLogoClick={onLogoClick} menuData={menuData}/>
    )
}
