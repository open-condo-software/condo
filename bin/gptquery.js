// NOTE: based on python version: https://gist.github.com/pahaz/17c66fd6d75b74ff307aca2b6bf942f3
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const fetch = require('node-fetch') // Import fetch from node-fetch

const DEFAULT_OUTPUT_DIR = 'out'
const GPT_KEY_FILE = path.resolve(process.env.HOME, '.openai.key')
const GPT_CACHE_DIR = path.resolve(process.env.HOME, '.openai.cache')

function cleanAndTrimText (text) {
    return text.replace(/[\n\r\t\f\v]/g, ' ').split(/\s+/).join(' ').slice(0, 50).trim()
}

function loadApiKey () {
    if (fs.existsSync(GPT_KEY_FILE)) {
        return fs.readFileSync(GPT_KEY_FILE, 'utf-8').trim()
    } else if (process.env.OPENAI_API_KEY) {
        return process.env.OPENAI_API_KEY.trim()
    } else {
        throw new Error('API key file not found and OPENAI_API_KEY environment variable is not set.')
    }
}

function calculateQueryHash (query) {
    return crypto.createHash('sha256').update(query, 'utf8').digest('hex')
}

function isQueryCached (queryHash) {
    if (!fs.existsSync(GPT_CACHE_DIR)) {
        fs.mkdirSync(GPT_CACHE_DIR, { recursive: true })
    }
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const queryFile = path.join(GPT_CACHE_DIR, `${queryHash}.query.txt`)
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const answerFile = path.join(GPT_CACHE_DIR, `${queryHash}.answer.txt`)
    return fs.existsSync(queryFile) && fs.existsSync(answerFile)
}

function loadCachedAnswer (queryHash) {
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const answerFile = path.join(GPT_CACHE_DIR, `${queryHash}.answer.txt`)
    return fs.readFileSync(answerFile, 'utf-8')
}

function cacheQueryAndAnswer (query, answer, queryHash) {
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const queryFile = path.join(GPT_CACHE_DIR, `${queryHash}.query.txt`)
    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
    const answerFile = path.join(GPT_CACHE_DIR, `${queryHash}.answer.txt`)
    fs.writeFileSync(queryFile, query, 'utf-8')
    fs.writeFileSync(answerFile, answer, 'utf-8')
}

async function getOpenAiResponse (query) {
    const apiKey = loadApiKey()
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: query }],
        }),
    })

    if (!response.ok) {
        throw new Error(`OpenAI API returned an error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content.trim()
}

async function main (inputFile, outputDir) {
    if (!fs.existsSync(inputFile)) {
        console.error(`Input file not found: ${inputFile}`)
        process.exit(1)
    }

    const queries = fs.readFileSync(inputFile, 'utf-8').split('----')
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    for (let i = 0; i < queries.length; i++) {
        let query = queries[i].trim()
        if (!query) continue

        const queryHash = calculateQueryHash(query)
        let answer

        if (isQueryCached(queryHash)) {
            console.log(`Q${i + 1} (cached): ${cleanAndTrimText(query)}`)
            answer = loadCachedAnswer(queryHash)
        } else {
            console.log(`Q${i + 1} (api): ${cleanAndTrimText(query)}`)
            answer = await getOpenAiResponse(query)
            cacheQueryAndAnswer(query, answer, queryHash)
        }

        console.log(`A${i + 1}: ${cleanAndTrimText(answer)}`)

        // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
        const outputFile = path.join(outputDir, `result_${i + 1}.md`)
        fs.writeFileSync(outputFile, answer, 'utf-8')
        console.log(`Result saved to ${outputFile}`)
    }
}

if (require.main === module) {
    const args = process.argv.slice(2)
    if (args.length < 1 || args.length > 3) {
        console.error('Usage: node script.js <input_file> [--out <output_directory>]')
        process.exit(1)
    }

    const inputFile = args[0]
    let outputDir = DEFAULT_OUTPUT_DIR

    // Parse optional arguments
    const outIndex = args.indexOf('--out')
    if (outIndex !== -1) {
        if (args.length > outIndex + 1) {
            outputDir = args[outIndex + 1]
        } else {
            console.error('Error: --out option requires a directory argument')
            process.exit(1)
        }
    }

    main(inputFile, outputDir).catch((err) => {
        console.error('Error:', err)
        process.exit(1)
    })
}
