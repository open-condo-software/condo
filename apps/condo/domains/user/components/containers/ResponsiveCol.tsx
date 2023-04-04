import { Col, ColProps } from 'antd'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

export const ResponsiveCol = ({ style, children, ...otherProps }: ColProps) => {
    const { breakpoints } = useLayoutContext()
    const modifiedStyle = {
        ...style,
        maxWidth: !breakpoints.TABLET_LARGE ? '600px' : '320px',
    }

    return (
        <Col style={modifiedStyle} {...otherProps}>
            {children}
        </Col>
    )
}

