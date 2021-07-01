import React from 'react'
import { Comment } from './index'
import { FormWithAction } from '../containers/FormList'
import { Form, Input } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import Icon from '@ant-design/icons';
import { useIntl } from '@core/next/intl'
import styled from '@emotion/styled'
import { SendMessage } from '../icons/SendMessage'

const Holder = styled.div`
  position: relative;
  button {
    position: absolute;
    right: 4px;
    bottom: 4px;
  }
  .ant-form-item-explain {
    display: none;
  }
`

interface ICommentFormProps {
    comment: Comment,
    action?: (formValues) => Promise<any>
    fieldNames: {
        content: string,
    }
}

const CommentForm: React.FC<ICommentFormProps> = ({ comment, action, fieldNames }) => {
    const intl = useIntl()
    const PlaceholderMessage = intl.formatMessage({ id: 'Comments.form.placeholder' })
    return (
        <FormWithAction
            initialValues={comment}
            action={action}
        >
            {({ handleSave, isLoading, form }) => (
                <Holder>
                    <Form.Item
                        name={fieldNames.content}
                        rules={[{required: true}]}
                    >
                        <Input.TextArea
                            placeholder={PlaceholderMessage}
                            className="white"
                            autoSize
                        />
                    </Form.Item>
                    <Button
                        type="sberPrimary"
                        size="middle"
                        icon={<Icon component={SendMessage} style={{color: 'white'}}/>}
                        onClick={handleSave}
                        loading={isLoading}
                    />
                </Holder>
            )}
        </FormWithAction>
    )
}

CommentForm.defaultProps = {
    fieldNames: {
        content: 'content',
    },
}

export {
    CommentForm
}