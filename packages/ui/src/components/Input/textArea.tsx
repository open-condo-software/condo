import { Input as DefaultInput } from 'antd'
import { TextAreaProps as AntdTextAreaProps } from 'antd/es/input'
import classNames from 'classnames'
import React, { forwardRef, useState, useEffect, TextareaHTMLAttributes } from 'react'

import { ArrowUp } from '@open-condo/icons'

import { Button } from '../Button'

import type { InputRef } from 'antd'

const { TextArea: DefaultTextArea } = DefaultInput

export const TEXTAREA_CLASS_PREFIX = 'condo-input'

export type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'style' | 'size' | 'onResize'> &
Pick<AntdTextAreaProps, 'autoSize'> & {
    value?: string
    isSubmitDisabled?: boolean
    showCount?: boolean
    onSubmit?: (value: string) => void
    bottomPanelUtils?: React.ReactElement[]
}

const TextArea = forwardRef<InputRef, TextAreaProps>((props, ref) => {
    const {
        className,
        disabled,
        onSubmit,
        autoFocus,
        maxLength = 1000,
        showCount = true,
        isSubmitDisabled,
        value: propsValue,
        bottomPanelUtils = [],
        onChange: propsOnChange,
        autoSize = { minRows: 1 },
        ...restProps
    } = props

    const [internalValue, setInternalValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)

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

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        setIsFocused(true)
        if (restProps.onFocus) restProps.onFocus(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        setIsFocused(false)
        if (restProps.onBlur) restProps.onBlur(e)
    }

    const currentValue = propsValue !== undefined ? propsValue : internalValue
    const characterCount = `${currentValue.length}/${maxLength}`

    const hasBottomPanelUtils = bottomPanelUtils.length > 0
    const shouldShowRightPanel = showCount || onSubmit
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

    const textAreaWrapperClassName = classNames(
        `${TEXTAREA_CLASS_PREFIX} ${TEXTAREA_CLASS_PREFIX}-textarea-wrapper`,
        {
            [`${TEXTAREA_CLASS_PREFIX}-wrapper-focused`]: isFocused,
            [`${TEXTAREA_CLASS_PREFIX}-disabled`]: disabled,
        },
    )


    return (
        <div className={textAreaWrapperClassName}>
            <DefaultTextArea
                {...restProps}
                ref={ref}
                prefixCls={TEXTAREA_CLASS_PREFIX}
                className={textareaClassName}
                disabled={disabled}
                onFocus={handleFocus}
                onBlur={handleBlur}
                autoSize={autoSize}
                maxLength={maxLength}
                showCount={false}
                value={currentValue}
                onChange={handleChange}
                autoFocus={autoFocus}
            />

            {showBottomPanel && (
                <span className={`${TEXTAREA_CLASS_PREFIX}-bottom-panel`}>
                    {hasBottomPanelUtils && (
                        <span className={`${TEXTAREA_CLASS_PREFIX}-utils`}>
                            {bottomPanelUtils.map((util, index) => (
                                <React.Fragment key={index}>
                                    {React.cloneElement(util, { disabled: util.props.disabled || disabled })}
                                </React.Fragment>
                            ))}
                        </span>
                    )}

                    {shouldShowRightPanel && (
                        <span className={`${TEXTAREA_CLASS_PREFIX}-bottom-panel-right`}>
                            {showCount && (
                                <span className={`${TEXTAREA_CLASS_PREFIX}-count`}>
                                    {characterCount}
                                </span>
                            )}

                            {
                                onSubmit &&
                                <Button
                                    disabled={disabled || isSubmitDisabled}
                                    type='accent'
                                    size='medium'
                                    onClick={() => onSubmit(currentValue)}
                                    icon={<ArrowUp size='small' />}
                                />
                            }
                        </span>
                    )}
                </span>
            )}
        </div>
    )
})

TextArea.displayName = 'TextArea'

export { TextArea }