import React from 'react'
import { Input as BaseInput, InputProps } from 'antd'
import { useTracking, TrackingEventPropertiesType, TrackingEventType } from '../TrackingContext'

export interface CustomInputProps extends InputProps {
    eventName?: string
    eventProperties?: TrackingEventPropertiesType
}

const Input = (props: CustomInputProps) => {
    const { eventName: propEventName, eventProperties, onChange, ...restProps } = props
    const { getTrackingWrappedCallback, getEventName } = useTracking()

    const eventName = propEventName ? propEventName : getEventName(TrackingEventType.Input)
    const componentProperties = { ...eventProperties }

    if (restProps.value) {
        componentProperties['component'] = { value: restProps.value }
    }

    const onChangeCallback = eventName ? getTrackingWrappedCallback(eventName, componentProperties, onChange) : onChange

    return (
        <BaseInput {...restProps} onChange={onChangeCallback} />
    )
}

Input.Password = BaseInput.Password
Input.TextArea = BaseInput.TextArea
Input.Search = BaseInput.Search
Input.Group = BaseInput.Group

export default Input
