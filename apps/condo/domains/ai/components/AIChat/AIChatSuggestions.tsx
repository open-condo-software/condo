import React from 'react'

import { Button, Tooltip } from '@open-condo/ui'

import styles from './AIChatSuggestions.module.css'

export type AIChatSuggestionItem = {
    key: string
    label: string
    onClick: () => void
    disabled?: boolean
    tooltip?: string
    animationDelayMs?: number
}

export type AIChatSuggestionsProps = {
    items: AIChatSuggestionItem[]
}

export const AIChatSuggestions: React.FC<AIChatSuggestionsProps> = ({ items }) => {
    if (items.length === 0) return null

    return (
        <div className={styles.suggestions}>
            {items.map((item) => {
                const button = (
                    <Button
                        type='primary'
                        size='medium'
                        disabled={item.disabled}
                        onClick={item.onClick}
                    >
                        {item.label}
                    </Button>
                )

                return (
                    <span
                        key={item.key}
                        className={styles.suggestionItem}
                        style={item.animationDelayMs ? { animationDelay: `${item.animationDelayMs}ms` } : undefined}
                    >
                        {item.tooltip ? (
                            <Tooltip
                                title={item.tooltip}
                                getPopupContainer={(trigger) => trigger.parentElement || trigger}
                            >
                                <span className={styles.tooltipWrap}>
                                    {button}
                                </span>
                            </Tooltip>
                        ) : button}
                    </span>
                )
            })}
        </div>
    )
}
