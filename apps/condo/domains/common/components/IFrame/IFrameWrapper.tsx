import React, { useEffect } from 'react'
import { sendLoadedStatus } from './utils'

export const IFrameWrapper: React.FC = (props) => {
    useEffect(() => {
        // NOTE: Sending load info manually for Safari support, in which iframe.onload sometimes doesn't trigger
        sendLoadedStatus()
    }, [])

    return (
        <>
            {props.children}
        </>
    )
}