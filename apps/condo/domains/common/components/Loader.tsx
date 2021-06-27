import React from 'react'
import { Spin, SpinProps } from 'antd'

const DEFAULT_DELAY = 200 // milliseconds

interface ILoaderProps extends SpinProps{
    fill: boolean
}

export const Loader: React.FC<ILoaderProps> = (props) => {
    if (props.fill) {
        return (
            <section>
                { <Spin {...props}/> }
            </section>
        )
    }

    return (
        <Spin {...props}/>
    )
}

Loader.defaultProps = {
    fill: false,
    delay: DEFAULT_DELAY,
}