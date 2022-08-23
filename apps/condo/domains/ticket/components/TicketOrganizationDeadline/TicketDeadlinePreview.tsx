import React from 'react'

const MAIN_WRAPPER_STYLE: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    border: '1px solid #FFEDE3',
    backgroundColor: '#FFEDE3',
    padding: '0 40px',
}
const IMAGE_WRAPPER_STYLE: React.CSSProperties = { overflow: 'hidden' }
const IMAGE_STYLE: React.CSSProperties = { height: 314 }

export const TicketDeadlinePreview: React.FC = () => {
    return (
        <div style={MAIN_WRAPPER_STYLE}>
            <div style={IMAGE_WRAPPER_STYLE}>
                <img
                    src='/ticketDeadlinePreview.png'
                    style={IMAGE_STYLE}
                    alt='ticketDeadlinePreview'
                />
            </div>
        </div>
    )
}
