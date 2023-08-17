import _ from 'lodash'
import getConfig from 'next/config'
import React from 'react'

type BehaviourRecordingEngine = 'plerdy'

type Props = {
    engine: BehaviourRecordingEngine;
}

/**
 * Container for behaviour recorder HTML code, that will be embedded into DOM in unsafe way.
 * Reads Next Config object with keys, appropriate to engine, set in props.
 * For Plerdy it expects params in Strict (not relaxed) JSON Format, like following:
 * ```json
 * {"site_hash_code": "…", "suid": 12345}
 * ```
 * Keys should be double quoted!
 * String values should be double quoted!
 */
const BehaviorRecorder = ({ engine }: Props) => {
    const { publicRuntimeConfig } = getConfig()
    // Don't know yet, what type comes here, will check it below ;)
    const { behaviorRecorder }  = publicRuntimeConfig

    if (!_.get(behaviorRecorder, engine) || !_.get(parseParamsFor, engine) || !_.get(htmlFor, engine)) {
        return null
    }

    const params = parseParamsFor[engine](behaviorRecorder[engine])

    return (
        <div dangerouslySetInnerHTML={{
            // this is injection of prepared engine rely html (see bellow)
            // not a user input
            // nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml
            __html: htmlFor[engine](params),
        }}>
        </div>
    )
}

type PlerdyParams = {
    site_hash_code: string;
    suid: number;
}

export const parseParamsFor = {
    plerdy: (params: string): PlerdyParams => {
        const SITE_HASH_CODE_REGEXP = /\b([a-z0-9]{32})\b/

        let plerdyParams
        try {
            plerdyParams = JSON.parse(params)
        } catch (e) {
            throw new Error('Incorrect JSON syntax in config for Plerdy behaviour recorder')
        }

        let site_hash_code

        if (plerdyParams.site_hash_code.match(SITE_HASH_CODE_REGEXP)) {
            site_hash_code = plerdyParams.site_hash_code
        } else {
            throw new Error('Incorrect value of site_hash_code param for Plerdy behaviour recorder')
        }

        const suid = parseInt(plerdyParams.suid)

        if (isNaN(suid)) {
            throw new Error('Incorrect value of suid param for Plerdy behaviour recorder')
        }

        return { site_hash_code, suid }
    },
}


export const htmlFor = {
    plerdy: ({ site_hash_code, suid }: PlerdyParams) => (
        `<script type="text/javascript" defer>var _protocol = (("https:" == document.location.protocol) ? " https://" : " http://");var _site_hash_code = "${site_hash_code}";var _suid = ${suid};</script><script type="text/javascript" defer src="https://a.plerdy.com/public/js/click/main.js"></script>`
    ),
}

export default BehaviorRecorder