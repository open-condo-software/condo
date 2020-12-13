import { Modal, Button, Typography, Select, Divider } from 'antd'
import dynamic from 'next/dynamic'
const CodeMirrorHack = dynamic(import('../../../components/CodeMirrorHack'), {ssr: false})

const CODE = `/**
 * Получает название управляющей компании через GUID дома
 *
 * @param {string} guid - GUID дома
 * @return Название УК
 * @customfunction
 */
function GET_MANAGEMENT_COMPANY_BY_GUID(guid) {
  const response = UrlFetchApp.fetch("https://99c09c2c43cb4ffe9445844e30ada1c3.apig.ru-moscow-1.hc.sbercloud.ru/building/" + guid);
  return response.getContentText();
}`;

const DownloadCode = () => {
    const cm = React.useRef(null);

    return (
        <div>
            <Select defaultValue={'Google sheets'}>
                <Select.Option value={'Google sheets'}>Google sheets</Select.Option>
                <Select.Option value={'Javascript'}>Javascript</Select.Option>
                <Select.Option value={'Python'}>Python</Select.Option>
            </Select>
            <Divider />
            <CodeMirrorHack cmRef={cm} value={CODE} mode={"javascript"} />
            <Divider />
            <div style={{ display: 'flex' }}>
                <Button type={"primary"} onClick={() => cm.current.editor.execCommand('selectAll')}>Скопировать</Button>
                <Button type={"primary"} style={{ marginLeft: 16 }}>Скачать</Button>
            </div>
        </div>
    );
}

export const PaymentModal = ({ function_data }) => {
    const [visible, setVisible] = React.useState(false)
    const [confirmLoading, setConfirmLoading] = React.useState(false)
    const [has_bought, setHasBought] = React.useState(false)

    const showModal = () => {
        setVisible(true);
    };

    const handleOk = () => {
        setConfirmLoading(true);
        setTimeout(() => {
            setHasBought(true);
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
                title={has_bought ? 'Скачать исходный код' : `Подтверждение покупки`}
                visible={visible}
                onOk={handleOk}
                confirmLoading={confirmLoading}
                onCancel={handleCancel}
            >
                {
                    has_bought
                        ? <DownloadCode />
                        : (
                            <>
                                {function_data.markerplaceName}
                                <Typography.Paragraph>Покупаем?</Typography.Paragraph>
                            </>
                        )
                }
            </Modal>
        </>
    );
};
