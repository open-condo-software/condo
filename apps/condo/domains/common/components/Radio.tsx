import React from 'react'
import { Radio as DefaultRadio, RadioProps } from 'antd'
import { useTracking, TrackingEventPropertiesType } from './TrackingContext'

export interface CustomRadioProps extends RadioProps {
    eventName?: string
    eventProperties?: TrackingEventPropertiesType
}

const Radio = (props: CustomRadioProps) => {
    const { eventName, eventProperties, children, ...restProps } = props
    const { instrument } = useTracking()

    const onChange = eventName ? instrument(eventName, eventProperties, restProps.onChange) : restProps.onChange

    return (
        <DefaultRadio {...restProps} onChange={onChange}>
            {children}
        </DefaultRadio>
    )
}

Radio.Group = DefaultRadio.Group
Radio.Button = DefaultRadio.Button

export default Radio
