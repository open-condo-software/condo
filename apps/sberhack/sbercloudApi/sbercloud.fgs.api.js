const axios = require('axios');
const availableLanguages = require("./language");
const {getAuthToken, getProjectID} = require("./sbercloud.api");

const fgs = axios.create({
    baseURL: `https://functiongraph.ru-moscow-1.hc.sbercloud.ru/v2/${getProjectID()}/fgs`,
    timeout: 3000,
    headers: {'X-Auth-Token': getAuthToken()}
});

/**
 * Sends a POST-request to the functionGraphService instance on SberCloud to create a function
 * @param {string} func_name - name of the function
 * @param {string} description - description of the function
 * @param {string} handler - function handler, depends on a language
 * @param {string} func_code__file - function code file encoded to BASE64
 * @param {number} memory_size - memory size of the function container
 * @param {string} runtime - environment for executing the function
 * @param {number} timeout - function timeout
 * @returns {Promise<AxiosResponse<any>>}
 */
async function _createFunctionGraph(func_name, description, handler, runtime, func_code__file, memory_size = 128, timeout = 3) {
    const code_type = 'inline'
    const pkg = 'default'

    try {
        const response = await fgs.post('/functions', {
            'func_name': func_name,
            'handler': handler,
            'runtime': runtime,
            'code_type': code_type,
            'package': pkg,
            'memory_size': memory_size,
            'timeout': timeout,
            'func_code': {'file': func_code__file}
        })
        return response.data
    } catch (error) {
        return {'error': error.message}
    }
}

/**
 * Creates the function graph and deploys it to the RELEASE evniroment
 * @param {string} name - function name
 * @param {string} description - function description
 * @param {'Node10' | 'Node12' | 'Python3'} language - function source language
 * @param {string} code - code in raw format
 * @returns {Promise<AxiosResponse<*>>}
 */
async function createFunctionGraph(name, description, language, code) {
    if (!language in availableLanguages) {
        throw(Error("Incorrect language value, I know only Node10, Node12 and Python3"))
    }

    const handler = availableLanguages[language].handler
    const runtime = availableLanguages[language].runtime
    const processedCode = availableLanguages[language].preprocessor(code)

    try {
        const functionCreationResponse = await _createFunctionGraph(name, description, handler, runtime, Buffer.from(processedCode).toString('base64'))
        const publishedFunctionUrn = functionCreationResponse.func_urn

        const functionPublishResponse = await _publishFunctionGraph(publishedFunctionUrn)
        return functionPublishResponse.data
    } catch (e) {
        console.log(e)
        throw(e)
    }
}

/**
 * Published a function
 * @param {string} urn
 */
async function _publishFunctionGraph(urn) {
    const response = await fgs.post(`/functions/${urn}/versions`, {})
    return response.data
}

/**
 * Returns all functions on Sbercloud
 * @returns {Promise<any>}
 */
async function listAllFunctions() {
    const response = await fgs.get('/functions')
    return response.data
}

module.exports = {
    createFunctionGraph,
    listAllFunctions
}

