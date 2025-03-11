import { Select as DefaultSelect, SelectProps } from 'antd'
import { RefSelectProps } from 'antd/lib/select'
import compact from 'lodash/compact'
import get from 'lodash/get'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isFunction from 'lodash/isFunction'
import React, { useCallback } from 'react'

import { analytics } from '@condo/domains/common/utils/analytics'

export interface CustomSelectProps<T> extends SelectProps<T> {
    ref?: React.Ref<RefSelectProps>
}

export type SelectValueType = string | number | { value: any, label: any }

/** @deprecated use Select from "@open-condo/ui" instead */
const Select = <T extends SelectValueType> (props: CustomSelectProps<T>) => {
    const { onChange, id, ...restProps } = props


    const onChangeCallback: CustomSelectProps<T>['onChange'] = useCallback((value, option) => {
        let selectedValue = null

        if (restProps.mode === 'tags' && isArray(value)) {
            selectedValue = compact(value)
        } else if (isArray(option)) {
            selectedValue = compact(option.map(opt => get(opt, 'title', false) || get(opt, 'label')))
        } else {
            selectedValue = get(option, 'title')
        }

        if (!isEmpty(selectedValue)) {
            analytics.track('change', {
                component: 'Select',
                location: window.location.href,
                id,
                value: selectedValue,
            })
        }

        // fire prop onChange callback if it was passed to component props
        if (isFunction(onChange)) {
            onChange(value, option)
        }
    }, [id, onChange])

    return (
        <DefaultSelect <T>
            id={id}
            autoClearSearchValue={props.mode === 'tags'}
            {...restProps}
            onChange={onChangeCallback}
            // NOTE: Autofocus not working with server rendering (antd problem)
            autoFocus={typeof window === 'undefined' ? false : restProps?.autoFocus || false}
        />
    )
}

Select.Option = DefaultSelect.Option
Select.OptGroup = DefaultSelect.OptGroup

export default Select
