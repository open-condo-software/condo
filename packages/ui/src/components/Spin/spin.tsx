import { Spin as DefaultSpin } from 'antd'
import classNames from 'classnames'
import React, { useMemo } from 'react'

const SPIN_CLASS_PREFIX = 'condo-spin'

export type SpinProps = {
    className?: string
    size?: 'large' | 'medium'
    block?: boolean
}

export const Spin: React.FC<SpinProps> = ({
    className,
    block,
    size = 'large',
}) => {
    const finalClassName = classNames(className, {
        [`${SPIN_CLASS_PREFIX}-block`]: block,
    })

    const antdSize = useMemo(() => size === 'medium' ? 'default' : size, [size])

    return <DefaultSpin size={antdSize} className={finalClassName} prefixCls={SPIN_CLASS_PREFIX}/>
}
