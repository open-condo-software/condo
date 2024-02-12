import React from 'react'


export type EmojiProps = {
    className?: string
    label?: string
    symbol: number
}

const Emoji: React.FC<EmojiProps> = React.memo(({ className, label, symbol }) =>
    <span className={className} role='img' aria-label={label} style={{ fontSize: '20px' }}>
        {String.fromCodePoint(symbol)}
    </span>
)

export {
    Emoji,
}