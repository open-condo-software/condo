import { Row, Col } from 'antd'

import { useIntl } from '@open-condo/next/intl'
import { Typography } from '@open-condo/ui'

import styles from './styles.module.css'

import { PosterLayout } from '../containers/PosterLayout'


const ERROR_IMAGE_SRC = { main: '/dino/success@2x.png', placeholder: '/404PosterPlaceholder.jpg' }

export const OutdatedLinkPoster = () => {
    const intl = useIntl()
    const PosterTitle = intl.formatMessage({ id: 'component.outdatedLinkPoster.title' })
    const PosterDescription = intl.formatMessage({ id: 'component.outdatedLinkPoster.description' })

    return (
        <PosterLayout
            image={ERROR_IMAGE_SRC}
            children={(
                <Row className={styles.contentWrapper} gutter={[0, 16]}>
                    <Col span={24}>
                        <Typography.Title level={1}>
                            {PosterTitle}
                        </Typography.Title>
                    </Col>
                    <Col span={24}>
                        <Typography.Text>
                            {PosterDescription}
                        </Typography.Text>
                    </Col>
                </Row>
            )}
        />
    )
}
