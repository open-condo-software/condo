import { Space, Form } from 'antd'
import React from 'react'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useRouter } from 'next/router'
import { useIntl } from '@core/next/intl'
import BaseDivisionForm from '../BaseDivisionForm'
import { Button } from '@condo/domains/common/components/Button'
import { ErrorsContainer } from '../BaseDivisionForm/ErrorsContainer'
import { Division } from '@condo/domains/division/utils/clientSchema'
import { useOrganization } from '@core/next/organization'
import ActionBar from '@condo/domains/common/components/ActionBar'
import { get } from 'lodash'

export const CreateDivisionForm: React.FC = () => {
    const intl = useIntl()
    const CreateDivisionMessage = intl.formatMessage({ id: 'pages.condo.division.index.CreateDivisionButtonLabel' })
    const router = useRouter()
    const { organization } = useOrganization()

    const attrs = {
        organization: get(organization, 'id'),
    }

    const handleComplete = () => {
        router.push('/property?tab=divisions')
    }

    const action = Division.useCreate(attrs, handleComplete)

    return (
        <BaseDivisionForm
            action={action}
            organization={organization}
        >
            {({ handleSave, isLoading }) => {
                return (
                    <Form.Item noStyle dependencies={['properties', 'responsible']}>
                        {
                            ({ getFieldsValue }) => {
                                const { properties, responsible } = getFieldsValue(['properties', 'responsible'])

                                return (
                                    <ActionBar>
                                        <Space size={12}>
                                            <Button
                                                key='submit'
                                                onClick={handleSave}
                                                type='sberPrimary'
                                                loading={isLoading}
                                                disabled={properties && properties.length === 0 || !responsible}
                                            >
                                                {CreateDivisionMessage}
                                            </Button>
                                            <ErrorsContainer
                                                properties={properties}
                                                responsible={responsible}
                                            />
                                        </Space>
                                    </ActionBar>
                                )
                            }
                        }
                    </Form.Item>
                )
            }}
        </BaseDivisionForm>
    )
}
