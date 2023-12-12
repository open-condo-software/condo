import React, { CSSProperties } from 'react'

const checkboxCardStyle: CSSProperties = {
    'borderRadius': '8px',
    border: '1px #E1E5ED solid',
    padding: '40px',
    minWidth: '190px',

    position: 'relative',

    display: 'flex',
    justifyContent: 'center',
}

const checkboxCardIconContainerStyle: CSSProperties = {
    width: '50px',
    height: '50px',
    position: 'absolute',
    right: '10px',
    top: '10px',
}

type SharingAppCheckboxProps = {
    icon?: string | React.ReactNode,
    checked?: boolean,
    disabled?: boolean,
    onClick?: () => void
}

export const SharingAppCheckboxCard: React.FC<SharingAppCheckboxProps> = ({ icon, checked, disabled, children, onClick }) => {

    let resolvedIcon = null

    // todo @toplenboren check out how it is made in other places!
    if (icon && typeof icon === 'string') {
        resolvedIcon = (
            <div style={checkboxCardIconContainerStyle}>
                <img src={icon} alt='Icon'/>
            </div>
        )
    } else if (icon) {
        resolvedIcon = (
            <div style={checkboxCardIconContainerStyle}>
                {icon}
            </div>
        )
    }

    return (
        <div style={checkboxCardStyle} onClick={onClick}>
            { resolvedIcon }
            { children }
        </div>
    )
}