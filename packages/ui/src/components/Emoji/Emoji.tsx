import React from 'react'


export type EmojiProps = {
    className?: string
    ariaLabel?: string
    symbol: number
}

const Emoji: React.FC<EmojiProps> = React.memo(({ className, ariaLabel, symbol }) =>
    <span className={className} role='img' aria-label={ariaLabel} style={{ fontSize: '20px' }}>
        {String.fromCodePoint(symbol)}
    </span>
)

export {
    Emoji,
}