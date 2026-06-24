import classNames from 'classnames'
import React, { forwardRef, HTMLAttributes } from 'react'

import styles from './PaymentsSumTable.module.css'

type PaymentsSumTableProps = HTMLAttributes<HTMLDivElement>

export const PaymentsSumTable = forwardRef<HTMLDivElement, PaymentsSumTableProps>(function PaymentsSumTable ({
    children,
    className,
    ...props
}, ref) {
    return (
        <div
            {...props}
            ref={ref}
            className={classNames(styles.container, className)}
        >
            {children}
        </div>
    )
})
