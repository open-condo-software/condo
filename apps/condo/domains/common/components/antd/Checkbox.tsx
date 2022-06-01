import React from 'react'
import { Checkbox as DefaultCheckbox, CheckboxProps } from 'antd'
import { useTracking, TrackingEventPropertiesType, TrackingEventType } from '@condo/domains/common/components/TrackingContext'

export interface CustomCheckboxProps extends CheckboxProps {
    eventName?: string
    eventProperties?: TrackingEventPropertiesType
}

const Checkbox = (props: CustomCheckboxProps) => {
    const { eventName: propEventName, eventProperties = {}, onChange, ...restProps } = props
    const { instrument, getEventName } = useTracking()

    const eventName = propEventName ? propEventName : getEventName(TrackingEventType.Checkbox)
    const componentProperties = { ...eventProperties }

    if (restProps.children && typeof restProps.children === 'string') {
        componentProperties['component'] = { value: restProps.children }
    }

    const onChangeCallback = eventName
        ? instrument(eventName, componentProperties, onChange)
        : onChange

    return (
        <DefaultCheckbox {...restProps} onChange={onChangeCallback} />
    )
}

Checkbox.Group = DefaultCheckbox.Group

export default Checkbox
