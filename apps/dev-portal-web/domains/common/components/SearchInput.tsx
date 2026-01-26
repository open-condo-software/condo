import React, { useCallback } from 'react'

import { Search } from '@open-condo/icons'
import { Input } from '@open-condo/ui'

import { useSearch } from '@/domains/common/hooks/useSearch'

import styles from './SearchInput.module.css'

type SearchInputProps = {
    placeholder: string
}

export const SearchInput: React.FC<SearchInputProps> = ({ placeholder }) => {
    const [search, setSearch] = useSearch()

    const handleSearchChange: React.ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
        setSearch(event.target.value ?? undefined)
    }, [setSearch])

    return (
        <Input
            value={search}
            placeholder={placeholder}
            onChange={handleSearchChange}
            className={styles.transparentSuffixInput}
            // @ts-expect-error Type Element is not assignable to type string
            suffix={<Search size='small'/>}
        />
    )
}