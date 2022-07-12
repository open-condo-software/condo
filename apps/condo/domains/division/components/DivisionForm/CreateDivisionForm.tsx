import { Form } from 'antd'
import React from 'react'
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
        organization: { connect: { id: get(organization, 'id') } },
    }

    const handleComplete = () => {
        router.push('/property?tab=divisions')
    }

    const action = Division.useCreate(attrs, handleComplete)
    const createAction = (values) => (action(Division.formValuesProcessor(values)))

    return (
        <BaseDivisionForm
            action={createAction}
            organization={organization}
        >
            {({ handleSave, isLoading }) => {
                return (
                    <Form.Item noStyle dependencies={['properties', 'responsible', 'executors']}>
                        {
                            ({ getFieldsValue }) => {
                                const { name, properties, responsible, executors } = getFieldsValue(
                                    ['name', 'properties', 'responsible', 'executors']
                                )
                                return (
                                    <ActionBar>
                                        <Button
                                            key='submit'
                                            onClick={handleSave}
                                            type='sberPrimary'
                                            loading={isLoading}
                                        >
                                            {CreateDivisionMessage}
                                        </Button>
                                        <ErrorsContainer
                                            name={name || ''}
                                            properties={properties}
                                            responsible={responsible}
                                            executors={executors}
                                        />
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
