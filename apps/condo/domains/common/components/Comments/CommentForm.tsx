import React from 'react'
import { Comment } from './index'
import { FormWithAction } from '../containers/FormList'
import { Form, Input } from 'antd'
import { Button } from '@condo/domains/common/components/Button'
import { SendOutlined } from '@ant-design/icons'
import { useIntl } from '@core/next/intl'
import styled from '@emotion/styled'
import { green } from '@ant-design/colors'

const Holder = styled.div`
  position: relative;
  button {
    position: absolute;
    right: 4px;
    bottom: 4px;
    background: ${green[6]};
    &:hover {
      background: ${green[7]};
    }
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
                    >
                        <Input.TextArea
                            placeholder={PlaceholderMessage}
                            className="white"
                            autoSize
                        />
                    </Form.Item>
                    <Button
                        size="default"
                        icon={<SendOutlined style={{color: 'white'}}/>}
                        type="sberGreen"
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