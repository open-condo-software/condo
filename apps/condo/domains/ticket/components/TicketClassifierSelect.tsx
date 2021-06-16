import React, { useEffect, useMemo, useState } from 'react'
import { Select, Space, Input, Row, Col } from 'antd'
import { TicketClassifier } from '@condo/domains/ticket/utils/clientSchema'
import { isEmpty, sortBy } from 'lodash'
import { TicketClassifier as TicketClassifierType, SortTicketClassifiersBy } from '../../../schema'

interface ITicketClassifierSelect {
    onSelect?: (...args: Array<unknown>) => void
    disabled?: boolean
    initialValue?: string
}

export const TicketClassifierSelect: React.FC<ITicketClassifierSelect> = (props) => {
    const { disabled } = props 
    const {
        objs: classifiers,
        loading: isLoading,
    } = TicketClassifier.useObjects({
        first: 500,
        sortBy: [SortTicketClassifiersBy.NameAsc],
    })

    const [places, setPlaces] = useState<TicketClassifierType[]>([])
    const [categories, setCategories] = useState<TicketClassifierType[]>([])
    const [subjects, setSubjects] = useState<TicketClassifierType[]>([])
    

    const [placesFiltered, setPlacesFiltered] = useState<TicketClassifierType[]>([])
    const [categoriesFiltered, setCategoriesFiltered] = useState<TicketClassifierType[]>([])
    const [subjectsFiltered, setSubjectsFiltered] = useState<TicketClassifierType[]>([])

    useEffect(() => {
        const places = classifiers.filter(classifier => !classifier.parent)
        const placesIds: string[] = places.map(place => place.id)
        const categories = classifiers.filter(classifier => classifier.parent && placesIds.includes(classifier.parent.id))
        const categoryIds = categories.map(category => category.id)
        const subjects = classifiers.filter(classifier => classifier.parent && categoryIds.includes(classifier.parent.id))
        setPlaces(places)
        setCategories(categories)
        setSubjects(subjects)
        setPlacesFiltered(places)
        setCategoriesFiltered(categories)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const placeOptions = useMemo(() => {
        return <>
            {
                placesFiltered.map(place => (
                    <Select.Option value={place.id} key={place.id}>{place.name}</Select.Option>
                ))
            }
        </>
    }, [placesFiltered])

    const categoryOptions = useMemo(() => {
        return <>
            {
                categoriesFiltered.map(category => (
                    <Select.Option value={category.id} key={category.id}>{category.name}</Select.Option>
                ))
            }
        </>
    }, [categoriesFiltered])

    const subjectOptions = useMemo(() => {
        return <>
            {
                subjectsFiltered.map(subject => (
                    <Select.Option value={subject.id} key={subject.id}>{subject.name}</Select.Option>
                ))
            }
        </>
    }, [subjectsFiltered])

   /* const [placesFiltered, setPlacesFiltered] = useState([])
    const [categoriesFiltered, setCategoriesFiltered] = useState([])
    const [subjectsFiltered, setSubjectsFiltered] = useState([])

    const [placeSelected, setPlaceSelected] = useState(null)
    const [categorySelected, setCategorySelected] = useState(null)
    const [subjectSelected, setSubjectSelected] = useState(null)

    const choosePlace = (value) => {
        placeSelected(value.id)
        setCategoriesFiltered(categories.filter(category => category.parent === value.id))
    }

    const chooseCategory = (value) => {
        categorySelected(value.id)
        setSubjectsFiltered(subjects.filter(category => category.parent === value.id))
        if (!placeSelected) {
            setPlacesFiltered(places.filter(place => place.id === value.parent))
        }
    }
    

    const chooseSubject = (value) => {
        setSubjectSelected(value.id)
        setCategorySelected(value.parent)
        setResult(value.id)
    }

*/


    const [result, setResult] = useState(null)
    

    return (
        <Row style={{ paddingBottom: '200px' }}>
            <Col span={7}  style={{ paddingRight: '20px' }}>
                <Select
                    style={{ width: '100%' }}
                    loading={isLoading}
                    allowClear={true}
                >
                    {placeOptions}
                </Select>
            </Col>      
            <Col span={7} style={{ paddingRight: '20px' }}>
                <Select
                    style={{ width: '100%' }}
                    loading={isLoading}
                    allowClear={true}
                >
                    {categoryOptions}
                </Select>
            </Col>     
            <Col span={7}  style={{ paddingRight: '20px' }}>
                {
                    ( !isEmpty(subjectsFiltered) &&  
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
