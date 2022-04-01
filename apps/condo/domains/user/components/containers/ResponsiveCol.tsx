import { Col, ColProps } from 'antd'
import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

export const ResponsiveCol = ({ style, children, ...otherProps }: ColProps) => {
    const { isSmall } = useLayoutContext()
    const modifiedStyle = {
        ...style,
        maxWidth: isSmall ? '600px' : '320px',
    }
    return (
        <Col style={modifiedStyle} {...otherProps}>
            {children}
        </Col>
    )
}

