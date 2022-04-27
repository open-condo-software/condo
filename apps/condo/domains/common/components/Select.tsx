import React from 'react'
import { Select as DefaultSelect, SelectProps } from 'antd'
import { useTracking, TrackingEventPropertiesType } from './TrackingContext'

export interface CustomSelectProps<T> extends SelectProps<T> {
    eventName?: string
    eventProperties?: TrackingEventPropertiesType
}

const Select = <T extends string> (props: CustomSelectProps<T>) => {
    const { eventName, eventProperties, children, ...restProps } = props
    const { instrument } = useTracking()

    const onSelect = eventName ? instrument(eventName, eventProperties, restProps.onSelect) : restProps.onSelect

    return (
        <DefaultSelect <T> {...restProps} onSelect={onSelect}>
            {children}
        </DefaultSelect>
    )
}

Select.Option = DefaultSelect.Option

export default Select
