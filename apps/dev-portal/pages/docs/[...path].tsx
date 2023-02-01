import fs from 'fs'
import path from 'path'

import { DEFAULT_LOCALE } from 'domains/common/constants/locales'
import uniq from 'lodash/uniq'
import React from 'react'

import type { GetStaticPaths, GetStaticProps } from 'next'

// TODO(DOMA-5233): Change path?
const DOC_ROOT_PATH = path.join('docs')
const DEFAULT_LOCALE_REGEXP = getFileNameRegex(DEFAULT_LOCALE)

const ArticlePage: React.FC = () => {
    return (
        <>
            Found!
        </>
    )
}

function getFileNameRegex (locale: string) {
    return new RegExp(`.${locale}.mdx?$`, 'gi')
}

function *scanDirSync (dir: string): IterableIterator<string> {
    const files = fs.readdirSync(dir, { withFileTypes: true })
    for (const file of files) {
        if (file.isDirectory()) {
            yield *scanDirSync(path.join(dir, file.name))
        } else (
            yield path.join(dir, file.name)
        )
    }
}

export const getStaticPaths: GetStaticPaths = ({ locales = [] }) => {
    const allFilePaths = Array.from(scanDirSync(DOC_ROOT_PATH), (route) => path.relative(DOC_ROOT_PATH, route))
    return {
        paths: locales.flatMap((locale) => {
            const localeSpecificRegex = getFileNameRegex(locale)
            // NOTE: Default locale as base + some optional locale-specific pages
            const allRoutesForLocale = uniq(allFilePaths
                .filter(route => DEFAULT_LOCALE_REGEXP.test(route) || localeSpecificRegex.test(route))
                .map(route => route.split('.')[0]))
            return allRoutesForLocale.map(route => ({ params: { path: route.split('/') }, locale }))
        }),
        fallback: false,
    }
}

export const getStaticProps: GetStaticProps = () => {
    return { props: {} }
}

export default ArticlePage
