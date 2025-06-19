import classNames from 'classnames'
import React, { useMemo } from 'react'

import { Typography } from '../../Typography'
import { OptGroup, Option, SELECT_CLASS_PREFIX } from '../select'

import type { OptionsItem } from '../select'

type UseItems = (items?: Array<OptionsItem>, selectId?: string) => null | Array<null | JSX.Element>

const convertOptions = (items: Array<OptionsItem>, selectId?: string, groupKey?: React.Key) => {
    if (items.length < 1) return null

    return items
        .map((item,  index) => {
            if (item === null) return null

            const { key } = item
            const mergedKey = groupKey ? `${groupKey}__${key || index}` : (key || index)
            const isOptionsGroup = item.options !== undefined

            if (isOptionsGroup) {
                // Options group
                const { label, options } = item

                return (
                    <OptGroup key={mergedKey} label={label}>
                        {convertOptions(options, selectId, mergedKey)}
                    </OptGroup>
                )
            } else {
                // Option
                const { value, disabled, title, textType, label, hidden } = item

                const className = classNames({
                    [`${SELECT_CLASS_PREFIX}-item-hidden`]: hidden,
                })

                return (
                    <Option
                        id={selectId && `${selectId}__${mergedKey}`}
                        key={mergedKey}
                        value={value}
                        disabled={disabled}
                        title={title ? title : label}
                        className={className}
                    >
                        <Typography.Text size='medium' disabled={disabled} type={textType} children={label} />
                    </Option>
                )
            }
        })
        .filter(Boolean)
}

export const useItems: UseItems = (items, selectId) => {
    return useMemo(() => {
        if (!items || items.length < 1) return null

        return convertOptions(items, selectId)
    }, [items, selectId])
}