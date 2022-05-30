import React from 'react'
import { Input as BaseInput, InputProps } from 'antd'
import { useTracking, TrackingEventPropertiesType } from './TrackingContext'

export interface CustomInputProps extends InputProps {
    eventName?: string
    eventProperties?: TrackingEventPropertiesType
}

const Input = (props: CustomInputProps) => {
    const { children, eventName, eventProperties, ...restProps } = props
    const { instrument } = useTracking()

    const onChange = eventName ? instrument(eventName, eventProperties, restProps.onChange) : restProps.onChange

    return (
        <BaseInput {...restProps} onChange={onChange}>
            {children}
        </BaseInput>
    )
}

export default Input
