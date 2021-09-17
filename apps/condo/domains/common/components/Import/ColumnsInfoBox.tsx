import styled from '@emotion/styled'
import {
    Columns,
} from '@condo/domains/common/utils/importer'
import { useIntl } from '@core/next/intl'
import { Space, Typography } from 'antd'

const InfoBoxContainer = styled.div`
  max-width: 300px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`
type ColumnsInfoBoxProps = {
    columns: Columns
}
export function ColumnsInfoBox ({ columns }: ColumnsInfoBoxProps) {
    const intl = useIntl()
    const ColumnsFormatMessage = intl.formatMessage({ id: 'ImportRequiredColumnsFormat' })
    const RequiredFieldsMessage = intl.formatMessage({ id: 'ImportRequiredFields' })
    return (
        <Space direction={'vertical'} size={10}>
            <Typography.Text>
                {ColumnsFormatMessage}
            </Typography.Text>
            <InfoBoxContainer>
                {
                    columns.map((column, index) => {
                        return (
                            <>
                                {index !== 0 && ', '}
                                <Typography.Text keyboard key={column.name}>
                                    {column.required && (
                                        <Typography.Text type={'danger'} style={{ marginRight: 3 }}>
                                            <sup>*</sup>
                                        </Typography.Text>
                                    )}
                                    {column.name}
                                </Typography.Text>
                            </>
                        )
                    })
                }
            </InfoBoxContainer>
            <Typography.Text>
                <Typography.Text type={'danger'} style={{ marginRight: 3 }}>
                    <sup>*</sup>
                </Typography.Text>
                {` - ${RequiredFieldsMessage}`}
            </Typography.Text>
        </Space>
    )
}