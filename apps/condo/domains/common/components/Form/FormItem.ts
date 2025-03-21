import styled from '@emotion/styled'
import { Form } from 'antd'


export const FormItem = styled(Form.Item)`
  .ant-form-item-label {
    padding-bottom: 8px;

    label {
      height: auto;
      white-space: nowrap;
    }
  }
  
  .ant-form-item-control {
    gap: 4px 0;
  }
`
