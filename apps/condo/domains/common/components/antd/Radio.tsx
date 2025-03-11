import { Radio as DefaultRadio, RadioProps } from 'antd'
import React, { useCallback } from 'react'

import { analytics } from '@condo/domains/common/utils/analytics'

/** @deprecated use Radio from "@open-condo/ui" */
const Radio = (props: RadioProps) => {
    const { onChange, id, value, ...restProps } = props

    const onChangeWrapped: RadioProps['onChange'] = useCallback((e) => {
        if (typeof value === 'string') {
            analytics.track('check', {
                component: 'Radio',
                location: window.location.href,
                id,
                value,
            })
        }

        if (onChange) {
            onChange(e)
        }
    }, [])

    return (
        <DefaultRadio {...restProps} id={id} onChange={onChangeWrapped} />
    )
}

Radio.Group = DefaultRadio.Group
Radio.Button = DefaultRadio.Button

export default Radio
