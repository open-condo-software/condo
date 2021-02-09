import { useEffect, useState } from 'react'
import { useMediaQuery } from 'react-responsive'

const DEFAULT_MEDIA = 'md'
const MEDIA_QUERIES = {
    xs: {
        maxWidth: 575,
        matchMedia: '(max-width: 575px)',
    },
    sm: {
        minWidth: 576,
        maxWidth: 767,
        matchMedia: '(min-width: 576px) and (max-width: 767px)',
    },
    md: {
        minWidth: 768,
        maxWidth: 991,
        matchMedia: '(min-width: 768px) and (max-width: 991px)',
    },
    lg: {
        minWidth: 992,
        maxWidth: 1199,
        matchMedia: '(min-width: 992px) and (max-width: 1199px)',
    },
    xl: {
        minWidth: 1200,
        maxWidth: 1599,
        matchMedia: '(min-width: 1200px) and (max-width: 1599px)',
    },
    xxl: {
        minWidth: 1600,
        matchMedia: '(min-width: 1600px)',
    },
}

/**
 * loop query screen className
 * Array.find will throw a error
 * `Rendered more hooks than during the previous render.`
 * So should use Array.forEach
 */
const getScreenClassName = (defaultMedia = DEFAULT_MEDIA) => {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return defaultMedia
    }
    return Object.keys(MEDIA_QUERIES).find(key => {
        const { matchMedia } = MEDIA_QUERIES[key]
        return window.matchMedia(matchMedia).matches
    })
}

const useAntdMediaQuery = (initialValue = DEFAULT_MEDIA) => {
    const isMd = useMediaQuery(MEDIA_QUERIES.md)
    const isLg = useMediaQuery(MEDIA_QUERIES.lg)
    const isXxl = useMediaQuery(MEDIA_QUERIES.xxl)
    const isXl = useMediaQuery(MEDIA_QUERIES.xl)
    const isSm = useMediaQuery(MEDIA_QUERIES.sm)
    const isXs = useMediaQuery(MEDIA_QUERIES.xs)
    const [colSpan, setColSpan] = useState(initialValue)

    useEffect(() => {
        if (isXxl) {
            setColSpan('xxl')
            return
        }
        if (isXl) {
            setColSpan('xl')
            return
        }
        if (isLg) {
            setColSpan('lg')
            return
        }
        if (isMd) {
            setColSpan('md')
            return
        }
        if (isSm) {
            setColSpan('sm')
            return
        }
        if (isXs) {
            setColSpan('xs')
            return
        }
        setColSpan(DEFAULT_MEDIA)
    }, [isMd, isLg, isXxl, isXl, isSm, isXs])

    return colSpan
}

export {
    getScreenClassName,
    useAntdMediaQuery,
}
