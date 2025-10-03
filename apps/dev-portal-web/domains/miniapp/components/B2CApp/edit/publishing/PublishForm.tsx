import { Form } from 'antd'
import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import { nonNull } from '@open-condo/miniapp-utils/helpers/collections'
import { Checkbox, Select, Button } from '@open-condo/ui'
import type { CheckboxProps } from '@open-condo/ui'

import { useValidations } from '@/domains/common/hooks/useValidations'
import styles from '@/domains/miniapp/components/B2CApp/edit/publishing/PublishForm.module.css'
import { DEFAULT_PAGE_SIZE } from '@/domains/miniapp/constants/common'

import { useAllB2CAppBuildsLazyQuery } from '@/gql'

export const PublishForm: React.FC<{ id: string, isPublishing: boolean }> = ({ id, isPublishing }) => {
    const intl = useIntl()
    const ChooseComponentsLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.publishForm.items.components.label' })
    const InfoLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.publishForm.items.info.label' })
    const BuildLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.publishForm.items.build.label' })
    const SelectBuildPlaceholder = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.publishForm.items.build.select.placeholder' })
    const PublishButtonLabel = intl.formatMessage({ id: 'pages.apps.b2c.id.sections.publishing.publishForm.actions.publish' })

    const [buildChecked, setBuildChecked] = useState(false)

    const { requiredFieldValidator } = useValidations()

    const [fetchBuilds, { data: buildsData }] = useAllB2CAppBuildsLazyQuery({
        variables: {
            where: {
                app: { id },
                version_contains_i: '',
            },
            first: DEFAULT_PAGE_SIZE,
            skip: 0,
        },
    })

    const handleBuildCheck = useCallback<Required<CheckboxProps>['onChange']>((evt) => {
        if (evt.target.checked) {
            fetchBuilds({
                variables: {
                    where: {
                        app: { id },
                        version_contains_i: '',
                    },
                    first: DEFAULT_PAGE_SIZE,
                    skip: 0,
                },
            })
        }
        setBuildChecked(evt.target.checked)
    }, [fetchBuilds, id])

    const handleSearchChange = useCallback((newSearch: string) => {
        fetchBuilds({
            variables: {
                where: {
                    app: { id },
                    version_contains_i: newSearch,
                },
                first: DEFAULT_PAGE_SIZE,
                skip: 0,
            },
        })
    }, [fetchBuilds, id])

    const buildOptions = (buildsData?.builds || []).filter(nonNull).map(build => {
        return {
            label: build.version as string,
            key: build.version as string,
            value: build.id,
        }
    })

    return (
        <>
            <Form.Item name='info' valuePropName='checked' label={ChooseComponentsLabel} className={styles.checkboxItem}>
                <Checkbox label={InfoLabel}/>
            </Form.Item>
            <Form.Item name='build' valuePropName='checked' className={styles.checkboxItem}>
                <Checkbox label={BuildLabel} onChange={handleBuildCheck}/>
            </Form.Item>
            {buildChecked && (
                <Form.Item name='buildId' rules={[requiredFieldValidator]}>
                    <Select
                        onSearch={handleSearchChange}
                        optionFilterProp='key'
                        options={buildOptions}
                        placeholder={SelectBuildPlaceholder}
                        showSearch
                    />
                </Form.Item>
            )}
            <Button
                type='primary'
                htmlType='submit'
                className={styles.submitButton}
                loading={isPublishing}
                disabled={isPublishing}
            >
                {PublishButtonLabel}
            </Button>
        </>
    )
}