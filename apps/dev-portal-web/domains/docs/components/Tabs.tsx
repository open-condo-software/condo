import get from 'lodash/get'
import React, { useMemo } from 'react'

import { Tabs as UITabs } from '@open-condo/ui'
import type { TabItem } from '@open-condo/ui'

type TabsProps = {
    labels?: Array<string>
    children?: React.ReactNode
}

/**
 * Wrapper around Tabs from Condo UI to map MDX children nodes to actual tabs
 * @param labels
 * @param children
 * @constructor
 */
export const Tabs = ({ labels = [], children }: TabsProps): React.ReactElement => {
    const items: Array<TabItem> = useMemo(() => {
        const mappedItems =  React.Children.map(children, (child, index) => {
            const stringIdx = String(index)
            const label = get(labels, index, stringIdx)
            return { key: label, label, children: child }
        })

        return mappedItems || []
    }, [children, labels])

    return <UITabs items={items}/>
}