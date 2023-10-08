import classNames from 'classnames'
import React, { useMemo } from 'react'

import { Typography } from '../../Typography'
import { OptGroup, Option, SELECT_CLASS_PREFIX } from '../select'

import type { OptionsItem } from '../select'

type UseItems = (items?: Array<OptionsItem>) => null | Array<null | JSX.Element>

const convertOptions = (items: Array<OptionsItem>) => {
    if (items.length < 1) return null

    return items
        .map((item,  index) => {
            if (item === null) return null

            const { key } = item
            const mergedKey = key || index
            const isOptionsGroup = item.options !== undefined

            if (isOptionsGroup) {
                // Options group
                const { label, options } = item

                return (
                    <OptGroup key={mergedKey} label={label}>
                        {convertOptions(options)}
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

export const useItems: UseItems = (items) => {
    return useMemo(() => {
        if (!items || items.length < 1) return null

        return convertOptions(items)
    }, [items])
}