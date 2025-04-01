import { Checkbox as DefaultCheckbox, CheckboxProps } from 'antd'
import React, { useCallback } from 'react'

import { analytics } from '@condo/domains/common/utils/analytics'

/** @deprecated use Checkbox from @open-condo/ui */
const Checkbox = (props: CheckboxProps) => {
    const { onChange, id, children, ...restProps } = props

    const onChangeWrapped: CheckboxProps['onChange'] = useCallback((e) => {
        if (children && typeof children === 'string') {
            analytics.track('check', {
                component: 'Checkbox',
                value: children,
                location: window.location.href,
                id,
            })
        }

        if (onChange) {
            onChange(e)
        }
    }, [children, id, onChange])

    return (
        <DefaultCheckbox {...restProps} onChange={onChangeWrapped} id={id} children={children}/>
    )
}

Checkbox.Group = DefaultCheckbox.Group

export default Checkbox
