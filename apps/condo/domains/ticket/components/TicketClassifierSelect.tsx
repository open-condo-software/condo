import React, { useEffect, useMemo, useState } from 'react'
import { Rule } from 'rc-field-form/lib/interface'
import { Select, Row, Col, Typography, Space, Form } from 'antd'
import { TicketClassifier as TicketClassifierGQL } from '@condo/domains/ticket/gql'
import { TicketClassifier } from '@condo/domains/ticket/utils/clientSchema'
import { ITicketClassifierUIState } from '@condo/domains/ticket/utils/clientSchema/TicketClassifier'
import { useIntl } from '@core/next/intl'

import { has, isEmpty, isEqual, sortBy } from 'lodash'
import { useLazyQuery } from '@core/next/apollo'
import { useRef } from 'react'
interface ITicketClassifierSelect {
    onSelect?: (...args: Array<unknown>) => void
    disabled?: boolean
    initialValue?: string
    rules?: Rule[]
}

interface ISelectState {
    objects: ITicketClassifierUIState[],
    choosed?: string | null
    parent?: string | null
    isShown?: boolean
}

const selectStyle = {
    width: '264px',
    marginRight: '44px',
}

export const TicketClassifierSelect: React.FC<ITicketClassifierSelect> = (props) => {
    const { rules } = props
    const intl = useIntl()
    const PlacesLabel = 'Где проблема *'
    const CategoriesLabel = 'Категория *'
    const SubjectsLabel = 'Суть проблемы *'

    const [places, setPlaces] = useState<ISelectState>({ objects: [], choosed: null })
    const [categories, setCategories] = useState<ISelectState>({ objects: [], choosed: null, isShown: false })
    const [subjects, setSubjects] = useState<ISelectState>({ objects: [], choosed: null, parent: null, isShown: false })

    const placesRef = useRef(null)
    const categoriesRef = useRef(null)
    const subjectsRef = useRef(null)

    const setState = (type, update: Partial<ISelectState> = {}) => {
        if (type === 'subjects') {
            const newState = { ...subjects, ...update }
            setSubjects(newState)
        }
        if (type === 'places') {
            setPlaces({ ...places, ...update })
        }
        if (type === 'categories') {
            const newState = { ...categories, ...update }
            setCategories(newState)
        }
    }
    const { objs: rootClassifiers, loading: isPlacesLoading } = TicketClassifier.useObjects({ where: { parent_is_null: true } })
    const [loadSubjects, { loading: isSubjectsLoading }] = useLazyQuery(TicketClassifierGQL.GET_ALL_OBJS_QUERY, {
        onCompleted: data => {
            const loadedSubjects = data.objs.map(({ id, name, parent }) => ({ id, name, parent }))
            setState('subjects', { objects: loadedSubjects, choosed: null })
            subjectsRef.current.focus()
        },
    })
    const [loadCategories, { loading: isCategoriesLoading }] = useLazyQuery(TicketClassifierGQL.GET_ALL_OBJS_QUERY, {
        onCompleted: data => {
            const loadedCategories = data.objs.map(({ id, name, parent }) => ({ id, name, parent }))
            setState('categories', { objects: loadedCategories, choosed: null })
            categoriesRef.current.focus()
        },
    })

    useEffect(() => {
        const allPlaces = sortBy(rootClassifiers, 'name').map(({ id, name, parent }) => ({ id, name, parent }))
        setState('places', { objects: allPlaces })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const choosePlace = (id = null) => {
        setState('places', { choosed: id })
        setState('categories', { choosed: null, objects: [], isShown: false })
        setState('subjects', { objects: [], choosed: null, isShown: false })                
        if (id) {
            setState('categories', { isShown: true })
            loadCategories({ variables: { sortBy: 'name_ASC', where: { parent: { id } } } })
            if (categoriesRef.current) {
                categoriesRef.current.focus()
            }
        }
    }

    const chooseCategory = (id = null) => {
        setState('categories', { choosed: id })
        setState('subjects', { objects: [], choosed: null, isShown: false })
        if (id) {
            setState('subjects', { isShown: true })
            loadSubjects({ variables: { sortBy: 'name_ASC', where: { parent: { id } } } })
            if (subjectsRef.current) {
                subjectsRef.current.focus()
            }
        }
    }

    const chooseSubject = (id = null) => {
        setState('subjects', { choosed: id })
    }

    return (
        <div style={{ whiteSpace: 'nowrap' }}>
            <Space direction={'vertical'} size={8}>
                <Typography.Text type={'secondary'}>{PlacesLabel}</Typography.Text>
                <Select
                    style={selectStyle}
                    allowClear={true}
                    onSelect={choosePlace}
                    onClear={choosePlace}
                    optionFilterProp={'title'}
                    value={places.choosed}
                    loading={isPlacesLoading}
                    ref={placesRef}
                >
                    {
                        places.objects.map(place => (
                            <Select.Option value={place.id} key={place.id} title={place.name}>{place.name}</Select.Option>
                        ))
                    }
                </Select>
            </Space>
            {
                categories.isShown &&
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{CategoriesLabel}</Typography.Text>
                    <Select
                        style={selectStyle}
                        allowClear={true}
                        onSelect={chooseCategory}
                        onClear={chooseCategory}
                        optionFilterProp={'title'}
                        value={categories.choosed}
                        loading={isCategoriesLoading}
                        ref={categoriesRef}
                        showAction={['focus', 'click']}
                    >
                        {
                            categories.objects.map(category => (
                                <Select.Option value={category.id} key={category.id} title={category.name}>{category.name}</Select.Option>
                            ))
                        }
                    </Select>
                </Space>
            }
            {
                subjects.isShown &&
                <Space direction={'vertical'} size={8}>
                    <Typography.Text type={'secondary'}>{SubjectsLabel}</Typography.Text>
                    <Form.Item rules={rules} name={'classifier'}>
                        <Select
                            loading={isSubjectsLoading}
                            allowClear={true}
                            onSelect={chooseSubject}
                            onClear={chooseSubject}
                            optionFilterProp={'title'}
                            ref={subjectsRef}
                            value={subjects.choosed}
                            showAction={['focus', 'click']}
                            style={selectStyle}
                        >
                            {
                                subjects.objects.map(subject => (
                                    <Select.Option value={subject.id} key={subject.id} title={subject.name}>{subject.name}</Select.Option>
                                ))
                            }
                        </Select>
                    </Form.Item>
                </Space>
            }
        </div>
    )
}




















