import { CSSProperties, useMemo } from 'react'


export const FormItemTooltipWrapper = ({ children, padding = '10px 8px' }) => {
    const wrapperStyles: CSSProperties = useMemo(() =>
        ({ display: 'flex', flexDirection: 'column', gap: '8px', padding }), [padding])

    return (
        <div style={wrapperStyles}>
            {children}
        </div>
    )
}