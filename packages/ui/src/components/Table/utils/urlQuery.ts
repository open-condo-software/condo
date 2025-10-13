import get from 'lodash/get'

export type QueryArgType = string | Array<string>
export type FiltersFromQueryType = { [key: string]: QueryArgType }

export type SorterColumn = {
    columnKey: string
    order: 'ascend' | 'descend'
}

export enum FULL_TO_SHORT_ORDERS_MAP {
    ascend = 'ASC',
    descend = 'DESC',
}

enum SHORT_TO_FULL_ORDERS_MAP {
    ASC = 'ascend',
    DESC = 'descend',
}

export type ParsedQueryType = {
    startRow: number
    endRow: number
    filters: FiltersFromQueryType
    sorters: SorterColumn[]
    tab: string | undefined
    type: string | undefined
}

/**
 * Парсит URL search параметры в объект
 * @param search - строка поиска (например, "?param1=value1&param2=value2")
 * @returns объект с параметрами
 */
export const parseUrlQuery = (search?: string): Record<string, string | string[]> => {
    if (!search) {
        search = typeof window !== 'undefined' ? window.location.search : ''
    }
    
    const params = new URLSearchParams(search)
    const result: Record<string, string | string[]> = {}
    
    for (const [key, value] of params.entries()) {
        if (result[key]) {
            // Если ключ уже существует, преобразуем в массив
            if (Array.isArray(result[key])) {
                (result[key] as string[]).push(value)
            } else {
                result[key] = [result[key] as string, value]
            }
        } else {
            result[key] = value
        }
    }
    
    return result
}

/**
 * Извлекает фильтры из query параметров
 * @param query - объект с query параметрами
 * @returns объект с фильтрами
 */
export const getFiltersFromQuery = (query: Record<string, string | string[]>): { [x: string]: QueryArgType } => {
    const { filters } = query
    if (!filters || typeof filters !== 'string') {
        return {}
    }
    try {
        const json = JSON.parse(filters)
        const result: { [x: string]: QueryArgType } = {}
        Object.keys(json).forEach((key) => {
            const value = json[key]
            if (Array.isArray(value)) {
                result[key] = value.filter((v) => typeof v === 'string' && Boolean(v))
            } else {
                if (typeof value === 'string' && !!value) result[key] = value
            }
        })
        return result
    } catch (e) {
        return {}
    }
}

/**
 * Извлекает сортировку из query параметров (новый формат - массив)
 * @param query - объект с query параметрами
 * @returns массив колонок для сортировки
 */
export const getSortersFromQuery = (query: Record<string, string | string[]>): SorterColumn[] => {
    const sorters = get(query, 'sort', [])
    
    // Если sort не массив, пытаемся распарсить как JSON
    let sortArray: string[] = []
    if (Array.isArray(sorters)) {
        sortArray = sorters
    } else if (typeof sorters === 'string') {
        try {
            sortArray = JSON.parse(sorters)
        } catch {
            // Fallback к старому формату для обратной совместимости
            sortArray = sorters.split(',')
        }
    }

    return sortArray
        .map((sorter) => {
            const [column, order] = sorter.split('_')
            if (!column || !order || !(order in SHORT_TO_FULL_ORDERS_MAP)) return undefined
            return { 
                columnKey: column, 
                order: (SHORT_TO_FULL_ORDERS_MAP as Record<string, 'ascend' | 'descend'>)[order] as 'ascend' | 'descend',
            }
        })
        .filter((sorter): sorter is SorterColumn => sorter !== undefined)
}

/**
 * Получает индекс страницы из offset
 * @param offset - смещение
 * @param pageSize - размер страницы
 * @returns индекс страницы (начиная с 1)
 */
export const getPageIndexFromOffset = (offset: number, pageSize: number): number => {
    return Math.floor(offset / pageSize) + 1
}

/**
 * Получает индекс страницы из startRow
 * @param startRow - начальная строка
 * @param pageSize - размер страницы
 * @returns индекс страницы (начиная с 1)
 */
export const getPageIndexFromStartRow = (startRow: number, pageSize: number): number => {
    return Math.floor(startRow / pageSize) + 1
}

/**
 * Получает startRow и endRow из пагинации
 * @param pageIndex - индекс страницы (начиная с 0)
 * @param pageSize - размер страницы
 * @returns объект с startRow и endRow
 */
export const getStartEndRows = (pageIndex: number, pageSize: number): { startRow: number, endRow: number } => {
    const startRow = pageIndex * pageSize
    const endRow = startRow + pageSize
    return { startRow, endRow }
}

/**
 * Парсит query параметры для таблицы
 * @param search - строка поиска URL
 * @returns объект с распарсенными параметрами таблицы
 */
export const parseTableQuery = (search?: string): ParsedQueryType => {
    const query = parseUrlQuery(search)
    
    const filters = getFiltersFromQuery(query)
    const sorters = getSortersFromQuery(query)
    
    // Получаем startRow и endRow из URL
    const queryStartRow = get(query, 'startRow', '0')
    const queryEndRow = get(query, 'endRow', '30')
    const startRow = Number(queryStartRow) ? Number(queryStartRow) : 0
    const endRow = Number(queryEndRow) ? Number(queryEndRow) : 30
    
    // Обратная совместимость с offset
    const queryOffset = get(query, 'offset')
    if (queryOffset && !queryStartRow) {
        const offset = Number(queryOffset) ? Number(queryOffset) : 0
        const pageSize = endRow - startRow || 30
        const pageIndex = Math.floor(offset / pageSize)
        const newStartRow = pageIndex * pageSize
        const newEndRow = newStartRow + pageSize
        return { 
            filters, 
            sorters, 
            startRow: newStartRow, 
            endRow: newEndRow, 
            tab: undefined, 
            type: undefined,
        }
    }
    
    const queryTab = get(query, 'tab')
    const tab = Array.isArray(queryTab) ? undefined : (queryTab as string | undefined)
    const queryType = get(query, 'type')
    const type = Array.isArray(queryType) ? undefined : (queryType as string | undefined)
    
    return { filters, sorters, startRow, endRow, tab, type }
}

/**
 * Конвертирует сортировку TanStack Table в формат для URL
 * @param sorting - состояние сортировки из TanStack Table
 * @returns массив строк сортировки для URL
 */
export const convertSortingToUrlFormat = (sorting: Array<{ id: string, desc: boolean }>): string[] => {
    return sorting.map(sort => 
        `${sort.id}_${FULL_TO_SHORT_ORDERS_MAP[sort.desc ? 'descend' : 'ascend']}`,
    )
}

/**
 * Обновляет URL с новыми параметрами
 * @param newParams - новые параметры для URL
 * @param options - опции обновления
 */
export const updateUrl = (
    newParams: Record<string, unknown>, 
    options?: { 
        resetOldParameters?: boolean 
        shallow?: boolean 
    }
) => {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    
    if (options?.resetOldParameters) {
        // Очищаем старые параметры
        url.search = ''
    }

    // Добавляем новые параметры
    Object.entries(newParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
                // Для массивов используем JSON.stringify для лучшей совместимости
                url.searchParams.set(key, JSON.stringify(value))
            } else {
                url.searchParams.set(key, String(value))
            }
        }
    })

    // Обновляем URL
    if (options?.shallow) {
        window.history.replaceState({}, '', url.toString())
    } else {
        window.history.pushState({}, '', url.toString())
    }
}
