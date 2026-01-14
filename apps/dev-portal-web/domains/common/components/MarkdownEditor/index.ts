import dynamic from 'next/dynamic'

export const MarkdownEditor = dynamic(
    () => import('./editor').then((mod) => mod.MarkdownEditor),
    { ssr: false }
)