import React from 'react'
import { Checkbox as DefaultCheckbox, CheckboxProps } from 'antd'
import { useTracking, TrackingEventPropertiesType, TrackingEventType } from '@condo/domains/common/components/TrackingContext'

export interface CustomCheckboxProps extends CheckboxProps {
    eventName?: string
    eventProperties?: TrackingEventPropertiesType
}

const Checkbox = (props: CustomCheckboxProps) => {
    const { eventProperties = {}, onChange, ...restProps } = props
    const { instrument, getEventName } = useTracking()
    const eventName = getEventName(TrackingEventType.Checkbox)

    const onChangeCallback = eventName && restProps.value
        ? instrument(eventName, {
            ...eventProperties, component: { value: restProps.value, name: restProps.name },
        }, onChange)
        : onChange

    return (
        <DefaultCheckbox {...restProps} onChange={onChangeCallback} />
    )
}

Checkbox.Group = DefaultCheckbox.Group

export default Checkbox
