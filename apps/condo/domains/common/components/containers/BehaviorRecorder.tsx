import React from 'react'
import getConfig from 'next/config'

const BehaviorRecorder = () => {
    const { publicRuntimeConfig } = getConfig()
    const { behaviorRecorder } = publicRuntimeConfig

    return behaviorRecorder ? (
        <div dangerouslySetInnerHTML={{
            __html: behaviorRecorder,
        }}>
        </div>
    ) : null
}

export default BehaviorRecorder
