import fs from 'fs'
import path from 'path'

import { sync as globSync } from 'glob'
import matter from 'gray-matter'
import { serialize } from 'next-mdx-remote/serialize'
import rehypePrism from 'rehype-prism-plus'
import { remarkHeadingId } from 'remark-custom-heading-id'
import remarkGfm from 'remark-gfm'

import { DEFAULT_LOCALE } from '@/domains/common/constants/locales'

import type { MDXRemoteSerializeResult } from 'next-mdx-remote'

export type Heading = {
    heading: string
    id: string
}

type MdxData = {
    fileMeta: { [key: string]: unknown }
    serializedContent: MDXRemoteSerializeResult
    headings: Array<Heading>
    fileName: string
}

export async function extractMdx (docsRoot: string, route: string, locale: string): Promise<MdxData> {
    // is part of source code reading - no end user input
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const fullRoute = path.join(docsRoot, route)

    const localizedFiles = globSync(`${fullRoute}.${locale}.md*(x)`)
    const fileName = localizedFiles.length
        ? localizedFiles[0]
        : globSync(`${fullRoute}.${DEFAULT_LOCALE}.md*(x)`)[0]

    const fileData = fs.readFileSync(fileName, 'utf-8')
    const { content, data } = matter(fileData)
    const { contentWithIds, headings } = generateHeadings(content)
    const serialized = await serialize(contentWithIds, {
        parseFrontmatter: false,
        mdxOptions: {
            remarkPlugins: [remarkGfm, remarkHeadingId],
            rehypePlugins: [
                rehypePrism,
            ],
        },
    })

    return {
        fileMeta: data,
        serializedContent: serialized,
        headings,
        fileName,
    }
}

const SPACE_REGEX = /\s+/g
const NON_WORD_REGEX = /[^\p{Alphabetic}\p{Decimal_Number}\s-]/gu

export function generateId (heading: string): string {
    const cleared = heading.replace(NON_WORD_REGEX, ' ').trim()
    return cleared.replace(SPACE_REGEX, '-').toLowerCase()
}

type PatchedContent = {
    contentWithIds: string
    headings: Array<Heading>
}

export function generateHeadings (content: string): PatchedContent {
    const headings: Array<Heading> = []
    const lines: Array<string> = []

    for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('## ')) {
            lines.push(line)
            continue
        }
        const heading = trimmed.substring(3).trim()
        const id = generateId(heading)
        lines.push(`${line} {#${id}}`)
        headings.push({ heading, id })
    }

    return { contentWithIds: lines.join('\n'), headings }
}