// @ts-nocheck
import fetch from 'isomorphic-fetch'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import React from 'react'

function introspectionProvider (query) {
    return fetch(window.location.origin + '/admin/api', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query }),
    })
        .then((response) => response.json())
}

// Note: we don't need to include it inside the main bundle
const DynamicVoyager = dynamic(
    () => import('graphql-voyager').then((mod) => mod.Voyager),
    { ssr: false }
)

const DocsGraphPage: React.FC = () => {
    // TODO(pahaz): remove cdn.jsdelivr.net dependency!
    return <>
        <Head>
            <link
                rel="stylesheet"
                href="https://cdn.jsdelivr.net/npm/graphql-voyager/dist/voyager.css"
            />
        </Head>
        <DynamicVoyager
            workerURI={'https://cdn.jsdelivr.net/npm/graphql-voyager/dist/voyager.worker.js'}
            introspection={introspectionProvider}/>
    </>
}

const NoContainer = ({ children }) => children

DocsGraphPage.container = NoContainer

export default DocsGraphPage
