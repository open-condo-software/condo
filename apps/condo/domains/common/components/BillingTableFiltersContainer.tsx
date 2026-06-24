import classNames from 'classnames'
import { forwardRef, HTMLAttributes } from 'react'

import styles from './BillingTableFiltersContainer.module.css'

type BillingTableFiltersContainerProps = HTMLAttributes<HTMLDivElement> & {
    disabled?: boolean
}

export const BillingTableFiltersContainer = forwardRef<HTMLDivElement, BillingTableFiltersContainerProps>(function BillingTableFiltersContainer ({
    children,
    className,
    disabled = false,
    ...props
}, ref) {
    const hasDisabledClassName = className?.split(' ').includes('disabled')

    return (
        <div
            {...props}
            ref={ref}
            className={classNames(styles.container, className, {
                [styles.disabled]: disabled || hasDisabledClassName,
            })}
        >
            {children}
        </div>
    )
})
