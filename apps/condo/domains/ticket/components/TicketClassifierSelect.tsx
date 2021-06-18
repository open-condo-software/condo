import React, { useEffect, useMemo, useState } from 'react'
import { Select, Row, Col } from 'antd'
import { TicketClassifier as TicketClassifierGQL } from '@condo/domains/ticket/gql'
import { TicketClassifier } from '@condo/domains/ticket/utils/clientSchema'
import { ITicketClassifierUIState } from '@condo/domains/ticket/utils/clientSchema/TicketClassifier'


import { has, isEmpty, isEqual } from 'lodash'
import { useLazyQuery } from '@core/next/apollo'
import { useRef } from 'react'
import { useCallback } from 'react'


interface ITicketClassifierSelect {
    onSelect?: (...args: Array<unknown>) => void
    disabled?: boolean
    initialValue?: string
}

interface ISelectState {
    all: ITicketClassifierUIState[],
    filtered?: ITicketClassifierUIState[], 
    groupped?: Record<string, ITicketClassifierUIState>, 
    choosed?: string | null
    parent?: string | null
}

export const TicketClassifierSelect: React.FC<ITicketClassifierSelect> = (props) => {
    
    const [places, setPlaces] = useState<ISelectState>({ all: [], filtered: [], choosed: null })
    const [categories, setCategories] = useState<ISelectState>({ all: [], filtered: [], groupped: {}, choosed: null })
    const [subjects, setSubjects] = useState<ISelectState>({ all: [],  choosed: null, parent: null })
    const placesRef = useRef(null)
    const categoriesRef = useRef(null)
    const subjectsRef = useRef(null)
    const setState = (type, update = {}) => {
        switch (type) {
            case 'places':
                setPlaces({ ...places, ...update })
                break
            case 'categories':
                setCategories({ ...categories, ...update })
                break
            case 'subjects':
                setSubjects({ ...subjects, ...update })
                break
        }
    }

    const { objs: twoLevelClassifiers, loading: isLoading } = TicketClassifier.useObjects(
        { 
            where: { parent: { parent: { id: null } } },
            sortBy: ['name_ASC'],
        }
    )
    useEffect(() => {
        const allPlaces = twoLevelClassifiers.filter(classifier => !classifier.parent).map(({ id, name, parent }) => ({ id, name, parent }))
        const allCategories = twoLevelClassifiers.filter(classifier => classifier.parent).map(({ id, name, parent }) => ({ id, name, parent }))
        const grouppedCategories = {}
        allCategories.forEach(({ id, name, parent }) => {
            if (!has(grouppedCategories, name)){
                grouppedCategories[name] = { name, id, parent: parent.id }
            } else {
                grouppedCategories[name].id += `_${id}`
                grouppedCategories[name].parent += `_${parent.id}`
            }
        })
        setState('places', { all: allPlaces, filtered: allPlaces })
        setState('categories', { groupped: grouppedCategories, all: allCategories, filtered: Object.values(grouppedCategories) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const [ loadClassifiers, { loading: isSubjectsLoading } ] = useLazyQuery(TicketClassifierGQL.GET_ALL_OBJS_QUERY, {
        onError: error => {
            throw new Error(error)
        },
        onCompleted: data => {
            const loadedSubjects = data.objs.map(({ id, name, parent }) => ({ id, name, parent }))
            setState('subjects', { all: loadedSubjects })
        },
        fetchPolicy: 'network-only',
    })

    const choosePlace = (id = null) => {
        setState('places', { choosed: id })
        if (!id) {
            setState('categories', { choosed: null, filtered: Object.values(categories.groupped) })
        } else {
            setState('categories', { choosed: null, filtered: categories.all.filter(category => category.parent.id === id ) })
        }
        setState('subjects', { all: [], choosed: null })
    }

    const chooseCategory = (id = null) => {
        setState('categories', { choosed: id })
        if (id) {
            const isGroupped = id.indexOf('_') !== -1
            if (isGroupped) {
                console.log(id.split('_'))
            } else {
                if (places.choosed) {
                    setState('subjects', { parent: id })
                    loadClassifiers({ variables: { sortBy: 'name_ASC', where: { parent: { id } } } })
                }
            }
        } else {
            setState('subjects', { all: [], choosed: null })
        }
    }

    const chooseSubject = (id = null) => {
        setState('subjects', { choosed: id })
    }


    return (
        <Row style={{ paddingBottom: '200px' }}>
            <Col span={7}  style={{ paddingRight: '20px' }}>
                <Select
                    style={{ width: '100%' }}
                    allowClear={true}
                    onSelect={choosePlace}
                    onClear={choosePlace}
                    optionFilterProp={'title'}
                    value={places.choosed}      
                    loading={isLoading}
                    ref={placesRef}
                >
                    {
                        places.filtered.map(place => (
                            <Select.Option value={place.id} key={place.id} title={place.name}>{place.name}</Select.Option>
                        ))
                    }
                </Select>
            </Col>      
            <Col span={7} style={{ paddingRight: '20px' }}>
                <Select
                    style={{ width: '100%' }}
                    allowClear={true}
                    onSelect={chooseCategory}
                    onClear={chooseCategory}
                    optionFilterProp={'title'}
                    value={categories.choosed}
                    loading={isLoading}
                    ref={categoriesRef}
                >
                    {
                        categories.filtered.map(category => (
                            <Select.Option value={category.id} key={category.id} title={category.name}>{category.name}</Select.Option>
                        ))
                    }
                </Select>
            </Col>     
            <Col span={7}  style={{ paddingRight: '20px' }}>
                {
                    ( !isEmpty(subjects.all) &&  
                        <Select
                            style={{ width: '100%' }}
                            loading={isSubjectsLoading}
                            allowClear={true}
                            onSelect={chooseSubject}
                            onClear={chooseSubject}
                            optionFilterProp={'title'}                    
                            ref={subjectsRef}
                        >
                            {
                                subjects.all.map(subject => (
                                    <Select.Option value={subject.id} key={subject.id} title={subject.name}>{subject.name}</Select.Option>
                                ))
                            }
                        </Select>
                    )
                }
            </Col>
        </Row>
    )
}





















export const TicketClassifier1Select: React.FC<ITicketClassifierSelect> = (props) => {
    const firstLevelRef = useRef([])
    const grouppedSecondLevelRef = useRef([])
    const secondLevelRef = useRef([])
    const thirdLevelRef = useRef([])
    const selected = useRef({
        first: null,
        second: null,
        third: null,
    })
    const [places, setPlaces] = useState([])
    const [categories, setCategories] = useState([])
    const [subjects, setSubjects] = useState([])

    const [ loadClassifiers, { loading: isLoading } ] = useLazyQuery(TicketClassifierGQL.GET_ALL_OBJS_QUERY, {
        onError: error => {
            throw new Error(error)
        },
        onCompleted: data => {
            setSubjects(data.objs.map(({ id, name, parent }) => ({ id, name, parent })))
        },
    })
    const {
        objs: twoLevelClassifiers,
    } = TicketClassifier.useObjects({
        where: { parent: { parent: { id: null } } },
        sortBy: 'name_ASC',
    })

    const rebuildOptions = useCallback(() => {
        let { first, second } = selected.current
        if (!first) {
            setCategories(grouppedSecondLevelRef.current)
        }
        // if (selected.current.third && !first && !second) {
        // 
        // }
        if (!first && second) {
            const choosedCategory = grouppedSecondLevelRef.current.find(item => isEqual(item.id, second))
            const filteredPlaces = firstLevelRef.current.filter(place => choosedCategory.parent.includes(place.id))
            if (filteredPlaces.length === 1) {
                first = filteredPlaces[0]
                second = choosedCategory.id[0]
            } else {
                setPlaces(places)
            }
        }
        if (!first && !second) {
            setPlaces(firstLevelRef.current)
        }
        if (first && !second) {
            setCategories(secondLevelRef.current.filter(item => item.parent.id === first))
        }
        if (first && second) {
            if (Array.isArray(second)) {
                const filteredCategories = secondLevelRef.current.find(item => second.includes(item.id) && item.parent.id === first)
                second = filteredCategories.id
            }
            loadClassifiers({ variables: { parent: second } })
        }
    }, [selected, loadClassifiers])
  
    useEffect(() => {
        firstLevelRef.current = twoLevelClassifiers.filter(classifier => !classifier.parent).map(({ id, name, parent }) => ({ id, name, parent }))
        secondLevelRef.current = twoLevelClassifiers.filter(classifier => classifier.parent).map(({ id, name, parent }) => ({ id, name, parent }))
        const secondLevelGroupped = {}
        secondLevelRef.current.forEach(({ id, name, parent }) => {
            if (!has(secondLevelGroupped, name)){
                secondLevelGroupped[name] = { name, id: [], parent: [] }
            }
            secondLevelGroupped[name].id.push(id)
            secondLevelGroupped[name].parent.push(parent.id)
        })
        grouppedSecondLevelRef.current = Object.values(secondLevelGroupped)
        if (isEmpty(places)) {
            rebuildOptions()
        }        
    }, [twoLevelClassifiers, places, rebuildOptions])





    const placeOptions = useMemo(() => (
        <>
            {
                places.map(place => (
                    <Select.Option value={place.id} key={place.id} title={place.name}>{place.name}</Select.Option>
                ))
            }
        </>)
    , [places])

    const categoryOptions = useMemo(() => (
        <>
            {
                categories.map(place => (
                    <Select.Option value={place.id} key={place.id} title={place.name}>{place.name}</Select.Option>
                ))
            }
        </>)
    , [categories])

    const subjectOptions = useMemo(() => (
        <>
            {
                subjects.map(place => (
                    <Select.Option value={place.id} key={place.id} title={place.name}>{place.name}</Select.Option>
                ))
            }
        </>)
    , [subjects])

    const onSelectChange = (update) => {
        selected.current = { ...selected.current, ...update }
        rebuildOptions()
    }


    return (
        <Row style={{ paddingBottom: '200px' }}>
            <Col span={7}  style={{ paddingRight: '20px' }}>
                <Select
                    style={{ width: '100%' }}
                    loading={isLoading}
                    allowClear={true}
                    onSelect={(id) => onSelectChange({ first: id })}
                    onClear={() => onSelectChange({ first: null })}
                >
                    {placeOptions}
                </Select>
            </Col>      
            <Col span={7} style={{ paddingRight: '20px' }}>
                <Select
                    style={{ width: '100%' }}
                    loading={isLoading}
                    allowClear={true}
                    onSelect={(id) => onSelectChange({ second: id })}
                    onClear={() => onSelectChange({ second: null })}
                    optionFilterProp={'title'}                    
                >
                    {categoryOptions}
                </Select>
            </Col>     
            <Col span={7}  style={{ paddingRight: '20px' }}>
                {
                    ( !isEmpty(thirdLevelRef.current) &&  
                        <Select
                            style={{ width: '100%' }}
                            loading={isLoading}
                        >
                            {subjectOptions}
                        </Select>
                    )
                }
            </Col>
        </Row>
    )
}
