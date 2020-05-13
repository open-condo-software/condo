import * as React from "react"
import {
    Row,
    Col,
    Form,
    Radio,
    List,
    Button,
    Divider,
} from 'antd';

import { AuthContext } from "../../lib/auth";
import disct_data from "./disc_data";
import BaseLayout from '../../containers/BaseLayout'
import { withAuth } from '../../lib/auth'

function DiscTest (props) {
    const [form] = Form.useForm()
    const [isLoading, setIsLoading] = React.useState(false)

    const onFinish = values => {
        setIsLoading(true)
        console.log(values);
        setTimeout(() => {
            setIsLoading(false)
        }, 1000);
    }

    return (
        <AuthContext.Consumer>
            {
                ({isAuthenticated, isLoading}) => {
                    if (isLoading) {
                        return "Загрузка..."
                    }

                    if (!isAuthenticated) {
                        return "Страница доступна только авторизованному пользователю"
                    }

                    return (
                        <div>
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
                                    dataSource={disct_data}
                                    renderItem={(question, question_index) => (
                                        <List.Item key={question_index}>
                                            <Row gutter={8}>
                                                <Col span={24}>

                                                    <Form.Item
                                                        name={`disc_question_${question_index}`}
                                                        label={question.title}
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
                                                                    {option}
                                                                </Radio>
                                                            ))}
                                                        </Radio.Group>
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </List.Item>
                                    )}
                                />
                            </Form>
                        </div>
                    )
                }
            }
        </AuthContext.Consumer>
    )
}

function CustomContainer (props) {
    return (
        <BaseLayout
            {...props}
            logo="topMenu"
            sideMenuStyle={{ display: 'none' }}
            mainContentWrapperStyle={{ maxWidth: '1024px', minWidth: '490px', paddingTop: '50px', margin: '0 auto' }}
            mainContentBreadcrumbStyle={{ display: 'none' }}
        />
    )
}

DiscTest.container = CustomContainer

export default withAuth({ ssr: false })(DiscTest)
