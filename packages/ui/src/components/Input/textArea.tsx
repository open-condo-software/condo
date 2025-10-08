import { Input as DefaultInput } from 'antd'
import { TextAreaProps as AntdTextAreaProps } from 'antd/es/input'
import classNames from 'classnames'
import React, { forwardRef, useState, useEffect, TextareaHTMLAttributes, useRef, useImperativeHandle } from 'react'

import { ArrowUp } from '@open-condo/icons'

import { RichTextArea, RichTextAreaRef, createCheckboxButton, createListButton } from './richTextArea'
import './richTextArea.less'

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
    enableRichText?: boolean
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
        enableRichText = false,
        ...restProps
    } = props

    const [internalValue, setInternalValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const richTextRef = useRef<RichTextAreaRef>(null)
    const textAreaRef = useRef<InputRef>(null)

    useImperativeHandle(ref, () => ({
        focus: () => {
            if (enableRichText && richTextRef.current) {
                richTextRef.current.focus()
            } else if (textAreaRef.current) {
                textAreaRef.current.focus()
            }
        },
        blur: () => {
            if (enableRichText && richTextRef.current) {
                richTextRef.current.blur()
            } else if (textAreaRef.current) {
                textAreaRef.current.blur()
            }
        },
        input: textAreaRef.current?.input,
        setSelectionRange: textAreaRef.current?.setSelectionRange,
        select: textAreaRef.current?.select,
    }) as InputRef)

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

    const handleRichTextChange = (value: string) => {
        if (propsValue === undefined) {
            setInternalValue(value)
        }

        if (propsOnChange) {
            const syntheticEvent = {
                target: { value },
            } as React.ChangeEvent<HTMLTextAreaElement>
            propsOnChange(syntheticEvent)
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


    if (enableRichText) {
        // Add rich text buttons to bottomPanelUtils
        const editor = richTextRef.current?.editor
        const richTextButtons = editor ? [
            createCheckboxButton(editor, disabled),
            createListButton(editor, disabled),
        ] : []
        
        const enhancedBottomPanelUtils = [...richTextButtons, ...bottomPanelUtils]
        const hasEnhancedUtils = enhancedBottomPanelUtils.length > 0

        return (
            <div className={textAreaWrapperClassName}>
                <RichTextArea
                    ref={richTextRef}
                    value={currentValue}
                    onChange={handleRichTextChange}
                    placeholder={restProps.placeholder}
                    disabled={disabled}
                    className={textareaClassName}
                    autoFocus={autoFocus}
                    maxLength={maxLength}
                />

                {showBottomPanel && (
                    <span className={`${TEXTAREA_CLASS_PREFIX}-bottom-panel`}>
                        {hasEnhancedUtils && (
                            <span className={`${TEXTAREA_CLASS_PREFIX}-utils`}>
                                {enhancedBottomPanelUtils.map((util, index) => (
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
    }

    return (
        <div className={textAreaWrapperClassName}>
            <DefaultTextArea
                {...restProps}
                ref={textAreaRef}
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