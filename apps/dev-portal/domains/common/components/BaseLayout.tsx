import { Collapse } from 'antd'
import classnames from 'classnames'
import React, { useCallback } from 'react'
import { useIntl } from 'react-intl'

import { ChevronDown, ChevronUp } from '@open-condo/icons'
import { Typography } from '@open-condo/ui'
import { useBreakpoints } from '@open-condo/ui/dist/hooks'

import { Header } from '@/domains/common/components/Header'

import type { CollapseProps } from 'antd'


const LAYOUT_CLASS_PREFIX = 'main-layout'

type BaseLayoutProps = {
    menuElement?: React.ReactElement
    children?: React.ReactElement
    anchorElement?: false | React.ReactElement
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({ menuElement, anchorElement, children }) => {
    const intl = useIntl()
    const MenuLabel = intl.formatMessage({ id: 'global.menu' })
    const breakpoints = useBreakpoints()
    const layoutClassName = classnames({
        [LAYOUT_CLASS_PREFIX]: true,
        [`${LAYOUT_CLASS_PREFIX}-lg`]: breakpoints.DESKTOP_LARGE,
        [`${LAYOUT_CLASS_PREFIX}-md`]: !breakpoints.DESKTOP_LARGE && breakpoints.DESKTOP_SMALL,
        [`${LAYOUT_CLASS_PREFIX}-sm`]: !breakpoints.DESKTOP_SMALL,
    })

    const handleIconChange = useCallback<Required<CollapseProps>['expandIcon']>(({ isActive }) => {
        return isActive ? <ChevronUp size='medium'/> : <ChevronDown size='medium' />
    }, [])

    return (
        <>
            <Header/>
            <main className={layoutClassName}>
                <section className='menu-container'>
                    {breakpoints.DESKTOP_SMALL ? (
                        menuElement
                    ) : (
                        <Collapse
                            bordered={false}
                            className='menu-collapse'
                            expandIcon={handleIconChange}
                            expandIconPosition='end'
                        >
                            <Collapse.Panel
                                key='menu'
                                header={<Typography.Title type='secondary' level={4}>{MenuLabel}</Typography.Title>}>
                                {menuElement}
                            </Collapse.Panel>
                        </Collapse>
                    )}
                </section>
                <section className='main-content'>{children}</section>
                {breakpoints.DESKTOP_LARGE && anchorElement && (
                    <section className='anchor-column'>{anchorElement}</section>
                )}
            </main>
        </>
    )
}