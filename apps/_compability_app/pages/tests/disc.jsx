import * as React from "react"
import {
    Row,
    Col,
    Form,
    Radio,
    List,
    Button,
    Divider,
} from 'antd'

import { AuthLayout } from '../../common/containers'
import Translate from '../../common/components/Translate'

export default function DiscTest({disc_data}) {
    const [form] = Form.useForm()
    const [isLoading, setIsLoading] = React.useState(false)
    const onFinish = values => {
        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
        }, 1000);
    }

    return (
        <AuthLayout>
            <Divider orientation="left">Тест DISC</Divider>
            <Form
                layout="vertical"
                form={form}
                name="disc_test_form"
                onFinish={onFinish}
            >
                <List
                    bordered
                    footer={
                        <Button type="primary" htmlType="submit" loading={isLoading}>
                            "Проверить"
                        </Button>
                    }
                    dataSource={disc_data}
                    renderItem={renderTestQuestion}
                />
            </Form>
        </AuthLayout>
    )
}

export async function getStaticProps() {
    const locale_source = await import("../../lang/ru.json")

    return ({
        props: { disc_data: locale_source.default.tests.disc }
    });
}

function renderTestQuestion(question, question_index) {
    return (
        <List.Item key={question_index}>
            <Row gutter={8}>
                <Col span={24}>
                    <Form.Item
                        name={`disc_${question_index}`}
                        label={<Translate id={`tests.disc.${question_index}.title`}/>}
                        rules={[{ required: true }]}
                    >
                        <Radio.Group>
                            {question.options.map((option, option_index) => (
                                <Radio
                                    style={{
                                        display: 'block',
                                        lineHeight: '30px',
                                        whiteSpace: 'normal',
                                    }}
                                    value={option_index}
                                    key={`${question_index + option_index}`}
                                >
                                    {<Translate id={`tests.disc.${question_index}.options.${option_index}`}/>}
                                </Radio>
                            ))}
                        </Radio.Group>
                    </Form.Item>
                </Col>
            </Row>
        </List.Item>
    )
}
