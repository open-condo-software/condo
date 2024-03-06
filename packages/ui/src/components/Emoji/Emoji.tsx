import React from 'react'


export type EmojiProps = {
    className?: string
    ariaLabel?: string
    symbol: string
}

const Emoji: React.FC<EmojiProps> = React.memo(({ className, ariaLabel, symbol }) =>
    <span className={className} role='img' aria-label={ariaLabel} style={{ fontSize: '20px' }}>
        {symbol}
    </span>
)

export {
    Emoji,
}