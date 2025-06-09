import { Input as DefaultInput } from 'antd'
import { TextAreaProps as AntdTextAreaProps } from 'antd/es/input'
import classNames from 'classnames'
import React, { forwardRef, useState, useEffect, TextareaHTMLAttributes } from 'react'

import type { InputRef } from 'antd'

import './textArea.less'

const { TextArea: DefaultTextArea } = DefaultInput

export const TEXTAREA_CLASS_PREFIX = 'condo-input'

export type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'style' | 'size'> &
Pick<AntdTextAreaProps, 'autoSize'> & {
    bottomPanelUtils?: React.ReactNode[]
    submitButton?: React.ReactNode
    showCount?: boolean
    value?: string
    defaultValue?: string
    onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
}


const TextArea = forwardRef<InputRef, TextAreaProps>((props, ref) => {
    const {
        className,
        bottomPanelUtils = [],
        disabled,
        maxLength = 1000,
        autoSize = { minRows: 1 },
        showCount = true,
        submitButton,
        value: propsValue,
        defaultValue = '',
        onChange: propsOnChange,
        autoFocus,
        ...restProps
    } = props

    const [internalValue, setInternalValue] = useState(defaultValue)

    useEffect(() => {
        if (propsValue !== undefined) {
            setInternalValue(propsValue)
        }
    }, [propsValue])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value

        if (propsValue === undefined) {
            setInternalValue(newValue)
        }

        if (propsOnChange) {
            propsOnChange(e)
        }
    }

    const currentValue = propsValue !== undefined ? propsValue : internalValue
    const characterCount = `${currentValue.length}/${maxLength}`

    const hasBottomPanelUtils = bottomPanelUtils.length > 0
    const shouldShowRightPanel = showCount || submitButton
    const showBottomPanel = hasBottomPanelUtils || shouldShowRightPanel

    const textareaClassName = classNames(
        `${TEXTAREA_CLASS_PREFIX}-textarea`,
        {
            [`${TEXTAREA_CLASS_PREFIX}-disabled`]: disabled,
            [`${TEXTAREA_CLASS_PREFIX}-show-bottom-panel`]: showBottomPanel,
            [`${TEXTAREA_CLASS_PREFIX}-focused`]: autoFocus,
        },
        className,
    )

    return (
        <div style={{ position: 'relative' }}>
            <DefaultTextArea
                {...restProps}
                ref={ref}
                prefixCls={TEXTAREA_CLASS_PREFIX}
                className={textareaClassName}
                disabled={disabled}
                autoSize={autoSize}
                maxLength={maxLength}
                showCount={false}
                value={currentValue}
                onChange={handleChange}
                autoFocus={autoFocus}
            />

            {showBottomPanel && (
                <span className={`${TEXTAREA_CLASS_PREFIX}-bottom-panel`}>
                    {hasBottomPanelUtils ? (
                        <span className={`${TEXTAREA_CLASS_PREFIX}-utils`}>
                            {bottomPanelUtils.map((util, index) => (
                                <React.Fragment key={index}>{util}</React.Fragment>
                            ))}
                        </span>
                    ) : (
                        <span />
                    )}

                    {shouldShowRightPanel && (
                        <span className={`${TEXTAREA_CLASS_PREFIX}-bottom-panel-right`}>
                            {showCount && (
                                <span className={`${TEXTAREA_CLASS_PREFIX}-count`}>
                                    {characterCount}
                                </span>
                            )}
                            {submitButton}
                        </span>
                    )}
                </span>
            )}
        </div>
    )
})

TextArea.displayName = 'TextArea'

export { TextArea }