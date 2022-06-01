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
    const { eventProperties = {}, onSelect, ...restProps } = props
    const { instrument, getEventName } = useTracking()
    const eventName = getEventName(TrackingEventType.Select)

    const onSelectCallback = eventName && restProps.value
        ? instrument(eventName, { ...eventProperties, component: { value: restProps.value } }, onSelect)
        : onSelect

    return (
        <DefaultSelect <T> {...restProps } onSelect={onSelectCallback} />
    )
}

Select.Option = DefaultSelect.Option
Select.OptGroup = DefaultSelect.OptGroup

export default Select
