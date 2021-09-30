import React, { useState, Dispatch, SetStateAction } from 'react'
import { Col, Modal, Row, Typography } from 'antd'
import { useIntl } from '@core/next/intl'
import { Button } from '@condo/domains/common/components/Button'
import styled from '@emotion/styled'
import { fontSizes } from '@condo/domains/common/constants/style'
import { FormattedMessage } from 'react-intl'
import { ServiceSubscription } from '../../../schema'
import dayjs from 'dayjs'

interface ISubscriberFirstLoginModalProps {
    subscription: ServiceSubscription
}

interface ISubscriberFirstLoginModal {
    SubscriberFirstLoginModal: React.FC<ISubscriberFirstLoginModalProps>
    setIsSubscriberFirstLoginModalVisible: Dispatch<SetStateAction<boolean>>
    isSubscriberFirstLoginModalVisible: boolean
}

const SubscriberFirstLoginModalParagraph = styled(Typography.Paragraph)`
  font-size: ${fontSizes.content};
  padding: 0;
  margin: 0;
`

export const useSubscriberFirstLoginModal = (): ISubscriberFirstLoginModal => {
    const intl = useIntl()

    const [isSubscriberFirstLoginModalVisible, setIsSubscriberFirstLoginModalVisible] = useState<boolean>(false)

    const SubscriberFirstLoginModal = ({ subscription }: ISubscriberFirstLoginModalProps) => (
        <Modal
            visible={isSubscriberFirstLoginModalVisible}
            onCancel={() => setIsSubscriberFirstLoginModalVisible(false)}
            width={600}
            bodyStyle={{ padding: '30px' }}
            footer={[
                <Button
                    size='large'
                    key='submit'
                    type='sberPrimary'
                    onClick={() => {
                        setIsSubscriberFirstLoginModalVisible(false)
                    }}
                >
                    {intl.formatMessage({ id: 'subscription.modal.complete.action' })}
                </Button>,
            ]}
        >
            <Row gutter={[0, 40]}>
                <Col span={24}>
                    <SubscriberFirstLoginModalParagraph strong>
                        {intl.formatMessage({ id: 'subscription.modal.newClient.gratitude' })}
                    </SubscriberFirstLoginModalParagraph>
                    <SubscriberFirstLoginModalParagraph>
                        {intl.formatMessage({ id: 'subscription.modal.newClient.trialTime' })}
                    </SubscriberFirstLoginModalParagraph>
                    <SubscriberFirstLoginModalParagraph>
                        {intl.formatMessage({ id: 'subscription.modal.newClient.debitsInfo' })}
                    </SubscriberFirstLoginModalParagraph>
                    <SubscriberFirstLoginModalParagraph>
                        {intl.formatMessage({ id: 'subscription.modal.newClient.currentTariff' })}
                    </SubscriberFirstLoginModalParagraph>
                    <SubscriberFirstLoginModalParagraph>
                        <FormattedMessage
                            id={'subscription.modal.newClient.trialTimeEndDate' }
                            values={{
                                endDate: subscription ? dayjs(subscription.finishAt).format('DD/MM/YYYY') : null,
                            }}
                        />
                    </SubscriberFirstLoginModalParagraph>
                    <SubscriberFirstLoginModalParagraph>
                        {intl.formatMessage({ id: 'subscription.modal.newClient.serviceDisconnect' })}
                    </SubscriberFirstLoginModalParagraph>
                </Col>
            </Row>
        </Modal>
    )

    return {
        isSubscriberFirstLoginModalVisible,
        setIsSubscriberFirstLoginModalVisible,
        SubscriberFirstLoginModal,
    }
}
