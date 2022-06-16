import React from 'react'
import { Select as DefaultSelect, SelectProps } from 'antd'
import { useTracking, TrackingEventPropertiesType, TrackingEventType } from '@condo/domains/common/components/TrackingContext'
import { RefSelectProps } from 'antd/lib/select'
import get from 'lodash/get'
import isFunction from 'lodash/isFunction'
import isObject from 'lodash/isObject'

export interface CustomSelectProps<T> extends SelectProps<T> {
    eventName?: string
    eventProperties?: TrackingEventPropertiesType
    ref?: React.Ref<RefSelectProps>
}

const Select = <T extends string | number | { value: any, label: any }> (props: CustomSelectProps<T>) => {
    const { eventName: propEventName, eventProperties = {}, onChange, ...restProps } = props
    const { logEvent, getEventName } = useTracking()

    const eventName = propEventName ? propEventName : getEventName(TrackingEventType.Select)
    const componentProperties = { ...eventProperties }

    const onChangeCallback: CustomSelectProps<T>['onChange'] = (value, option) => {
        if (eventName && isObject(option)) {
            const selectedValue = get(option, 'title')

            if (selectedValue) {
                componentProperties['component'] = { value: selectedValue }
                logEvent({ eventName, eventProperties: componentProperties })
            }
        }

        // fire prop onChange callback if it was passed to component props
        if (isFunction(onChange)) {
            onChange(value, option)
        }
    }

    return (
        <DefaultSelect <T> {...restProps } onChange={onChangeCallback} />
    )
}

Select.Option = DefaultSelect.Option
Select.OptGroup = DefaultSelect.OptGroup

export default Select
