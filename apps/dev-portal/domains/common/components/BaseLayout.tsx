import classnames from 'classnames'
import React from 'react'

import { useBreakpoints } from '@open-condo/ui/dist/hooks'

import { Header } from '@/domains/common/components/Header'


const LAYOUT_CLASS_PREFIX = 'main-layout'

type BaseLayoutProps = {
    menuElement?: React.ReactElement
    children?: React.ReactElement
    anchorElement?: false | React.ReactElement
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({ menuElement, anchorElement, children }) => {
    const breakpoints = useBreakpoints()
    const layoutClassName = classnames({
        [LAYOUT_CLASS_PREFIX]: true,
        [`${LAYOUT_CLASS_PREFIX}-lg`]: breakpoints.DESKTOP_LARGE,
        [`${LAYOUT_CLASS_PREFIX}-md`]: !breakpoints.DESKTOP_LARGE && breakpoints.DESKTOP_SMALL,
        [`${LAYOUT_CLASS_PREFIX}-sm`]: !breakpoints.DESKTOP_SMALL,
    })

    return (
        <>
            <Header/>
            <main className={layoutClassName}>
                {menuElement && (
                    <section className='menu-container'>
                        {menuElement}
                    </section>
                )}
                <section className='main-content'>{children}</section>
                {breakpoints.DESKTOP_LARGE && anchorElement && (
                    <section className='anchor-column'>{anchorElement}</section>
                )}
            </main>
        </>
    )
}