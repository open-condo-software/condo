import { Modal, Button, Typography } from 'antd'
import { useAuth } from '@core/next/auth'

export const PaymentModal = ({ function_data }) => {
    const [visible, setVisible] = React.useState(false)
    const [confirmLoading, setConfirmLoading] = React.useState(false)

    const showModal = () => {
        setVisible(true);
    };

    const handleOk = () => {
        setConfirmLoading(true);
        setTimeout(() => {
            setVisible(false);
            setConfirmLoading(false);
        }, 2000);
    };

    const handleCancel = () => {
        setVisible(false);
    };

    return (
        <>
            <Button type="primary" onClick={showModal}>
                Купить
            </Button>
            <Modal
                title={`Подтверждение покупки`}
                visible={visible}
                onOk={handleOk}
                confirmLoading={confirmLoading}
                onCancel={handleCancel}
            >
                {function_data.markerplaceName}
                <Typography.Paragraph>Покупаем?</Typography.Paragraph>
            </Modal>
        </>
    );
};
