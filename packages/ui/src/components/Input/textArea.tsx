import emojiData from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Input as DefaultInput } from 'antd'
import { TextAreaProps as AntdTextAreaProps } from 'antd/es/input'
import classNames from 'classnames'
import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState, TextareaHTMLAttributes } from 'react'

import { ArrowUp, Smile } from '@open-condo/icons'

import { Button } from '../Button'
import { Dropdown } from '../Dropdown'
import { Tooltip } from '../Tooltip'

import type { InputRef } from 'antd'

const { TextArea: DefaultTextArea } = DefaultInput

export const TEXTAREA_CLASS_PREFIX = 'condo-input'

export type TextAreaCustomLabels = {
    emojiDropdown?: Partial<TextAreaEmojiDropdownLabels>
}

type TextAreaEmojiDropdownLabels = {
    categories: {
        activity: string
        flags: string
        foods: string
        frequent: string
        nature: string
        objects: string
        people: string
        places: string
        symbols: string
    }
}

const DEFAULT_EMOJI_DROPDOWN_LABELS: TextAreaEmojiDropdownLabels = {
    categories: {
        activity: 'Activity',
        flags: 'Flags',
        foods: 'Foods',
        frequent: 'Frequent',
        nature: 'Nature',
        objects: 'Objects',
        people: 'People',
        places: 'Places',
        symbols: 'Symbols',
    },
}

type BottomPanelBuiltinKey = 'emoji'
type BottomPanelBuiltinUtilConfig =
    | {
        key: 'emoji'
        dropdownProps?: Pick<React.ComponentProps<typeof Dropdown>, 'placement'>
    }

type BottomPanelReactUtilElement = React.ReactElement<{ disabled?: boolean }>
type BottomPanelUtilsItem = BottomPanelBuiltinKey | BottomPanelBuiltinUtilConfig | BottomPanelReactUtilElement

export type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'style' | 'size' | 'onResize'> &
Pick<AntdTextAreaProps, 'autoSize'> & {
    value?: string
    isSubmitDisabled?: boolean
    showCount?: boolean
    onSubmit?: (value: string) => void
    bottomPanelUtils?: BottomPanelUtilsItem[]
    customLabels?: TextAreaCustomLabels
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
        customLabels,
        onChange: propsOnChange,
        autoSize = { minRows: 1 },
        ...restProps
    } = props

    const [internalValue, setInternalValue] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false)
    const textAreaContainerRef = useRef<HTMLDivElement>(null)

    const resolvedEmojiDropdownLabels = useMemo(() => ({
        categories: {
            ...DEFAULT_EMOJI_DROPDOWN_LABELS.categories,
            ...customLabels?.emojiDropdown?.categories,
        },
    }), [customLabels?.emojiDropdown])

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

    const emitValueChange = useCallback((nextValue: string) => {
        if (propsValue === undefined) {
            setInternalValue(nextValue)
        }

        if (propsOnChange) {
            propsOnChange({
                target: { value: nextValue },
                currentTarget: { value: nextValue },
            } as React.ChangeEvent<HTMLTextAreaElement>)
        }
    }, [propsOnChange, propsValue])

    const handleBottomEmojiOpenChange = useCallback((open: boolean) => {
        if (disabled) {
            setEmojiPickerOpen(false)
            return
        }
        setEmojiPickerOpen(open)
    }, [disabled])

    const handleBottomEmojiSelect = useCallback((emoji: { native?: string }) => {
        if (disabled) return
        const nativeEmoji = emoji?.native
        if (!nativeEmoji) return
        const textAreaElement = textAreaContainerRef.current?.querySelector('textarea')
        const currentText = currentValue || ''
        if (!textAreaElement) {
            emitValueChange(currentText + nativeEmoji)
            return
        }
        const start = textAreaElement.selectionStart ?? currentText.length
        const end = textAreaElement.selectionEnd ?? currentText.length
        textAreaElement.setRangeText(nativeEmoji, start, end, 'end')
        emitValueChange(textAreaElement.value)
        requestAnimationFrame(() => {
            textAreaElement.focus()
        })
    }, [currentValue, disabled, emitValueChange])

    const renderBottomPanelBuiltinUtil = useCallback((util: BottomPanelUtilsItem, index: number) => {
        if (React.isValidElement<{ disabled?: boolean }>(util)) {
            return (
                <React.Fragment key={util.key ?? index}>
                    {React.cloneElement(util, { disabled: util.props?.disabled || disabled })}
                </React.Fragment>
            )
        }

        const normalizedUtil: BottomPanelBuiltinUtilConfig = typeof util === 'string'
            ? { key: util }
            : util

        if (normalizedUtil.key !== 'emoji') return null

        const emojiDropdownContent = (
            <div className='condo-input-emoji-dropdown'>
                <Picker
                    data={emojiData}
                    onEmojiSelect={handleBottomEmojiSelect}
                    previewPosition='none'
                    skinTonePosition='none'
                    searchPosition='none'
                    theme='light'
                    icons='outline'
                    i18n={resolvedEmojiDropdownLabels}
                />
            </div>
        )

        return (
            <Dropdown
                key={`builtin-${normalizedUtil.key}-${index}`}
                trigger={['click']}
                placement='bottomLeft'
                open={emojiPickerOpen}
                onOpenChange={handleBottomEmojiOpenChange}
                overlayClassName='condo-input-emoji-dropdown-overlay'
                dropdownRender={() => emojiDropdownContent}
                {...normalizedUtil.dropdownProps}
            >
                <span>
                    <Tooltip title='Emoji' mouseLeaveDelay={0}>
                        <Button
                            minimal
                            compact
                            type='secondary'
                            size='medium'
                            disabled={disabled}
                            icon={<Smile size='small' />}
                            onClick={() => null}
                        />
                    </Tooltip>
                </span>
            </Dropdown>
        )
    }, [
        disabled,
        emojiPickerOpen,
        handleBottomEmojiOpenChange,
        handleBottomEmojiSelect,
        resolvedEmojiDropdownLabels,
    ])


    return (
        <div className={textAreaWrapperClassName} ref={textAreaContainerRef}>
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
                            {bottomPanelUtils.map(renderBottomPanelBuiltinUtil)}
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