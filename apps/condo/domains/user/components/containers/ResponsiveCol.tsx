import { Col, ColProps } from 'antd'

import { useLayoutContext } from '@condo/domains/common/components/LayoutContext'

type ResponsiveColProps = ColProps & {
    desktopWidth?: ColProps['style']['width']
    mobileWidth?: ColProps['style']['width']
}

export const ResponsiveCol: React.FC<ResponsiveColProps> = (props) => {
    const {
        style,
        children,
        desktopWidth = '324px',
        mobileWidth = '600px',
        ...otherProps
    } = props
    const { breakpoints } = useLayoutContext()
    const modifiedStyle = {
        ...style,
        maxWidth: !breakpoints.TABLET_LARGE ? mobileWidth : desktopWidth,
    }

    return (
        <Col style={modifiedStyle} {...otherProps}>
            {children}
        </Col>
    )
}

