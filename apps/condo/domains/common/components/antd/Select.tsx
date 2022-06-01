import React from 'react'
import { Select as DefaultSelect, SelectProps } from 'antd'
import { useTracking, TrackingEventPropertiesType, TrackingEventType } from '@condo/domains/common/components/TrackingContext'
import { RefSelectProps } from 'antd/lib/select'

export interface CustomSelectProps<T> extends SelectProps<T> {
    eventName?: string
    eventProperties?: TrackingEventPropertiesType
    ref?: React.Ref<RefSelectProps>
}

const Select = <T extends string | number> (props: CustomSelectProps<T>) => {
    const { eventName: propEventName, eventProperties = {}, onChange, ...restProps } = props
    const { instrument, getEventName } = useTracking()

    const eventName = propEventName ? propEventName : getEventName(TrackingEventType.Select)
    const componentProperties = { ...eventProperties }

    if (restProps.value) {
        componentProperties['component'] = { value: restProps.value }
    }

    const onChangeCallback = eventName
        ? instrument(eventName, componentProperties, onChange)
        : onChange

    return (
        <DefaultSelect <T> {...restProps } onChange={onChangeCallback} />
    )
}

Select.Option = DefaultSelect.Option
Select.OptGroup = DefaultSelect.OptGroup

export default Select
