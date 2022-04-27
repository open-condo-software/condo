import React from 'react'
import { Checkbox as DefaultCheckbox, CheckboxProps } from 'antd'
import { useTracking, TrackingEventPropertiesType } from './TrackingContext'

export interface CustomCheckboxProps extends CheckboxProps {
    eventName?: string
    eventProperties?: TrackingEventPropertiesType
}

const Checkbox = (props: CustomCheckboxProps) => {
    const { eventName, eventProperties, children, ...restProps } = props
    const { instrument } = useTracking()

    const onChange = eventName ? instrument(eventName, eventProperties, restProps.onChange) : restProps.onChange

    return (
        <DefaultCheckbox {...restProps} onChange={onChange}>
            {children}
        </DefaultCheckbox>
    )
}

export default Checkbox
