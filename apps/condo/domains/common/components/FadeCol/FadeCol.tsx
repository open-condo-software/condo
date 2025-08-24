import { Col, ColProps } from 'antd'
import cn from 'classnames'

import styles from './FadeCol.module.css'

export const FadeCol: React.FC<ColProps> = (props) => {
    const { className, ...restProps } = props
    return (
        <Col {...restProps} className={cn(className, styles.fadeCol)} />
    )   
}