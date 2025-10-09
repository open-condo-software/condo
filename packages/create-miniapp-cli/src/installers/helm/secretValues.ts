import crypto from 'crypto'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

import { CONDO_ROOT } from '@cli/consts'
import { logger } from '@cli/utils/logger'
import { execa } from 'execa'
import yaml from 'js-yaml'

interface SecretValues {
    envs: Record<string, Record<string, Record<string, string>>>
    review_env?: Record<string, Record<string, string>>
}

const HELM_DIR = path.resolve(CONDO_ROOT, './.helm')
const SECRET_VALUES = path.join(HELM_DIR, 'secret-values.yaml')
const PLACEHOLDER = 'ENCODED_PLACEHOLDER'

function buildPlaceholderField (reviewEnabled: boolean) {
    const base: Record<string, string> = {
        _default: PLACEHOLDER,
        development: PLACEHOLDER,
        production: PLACEHOLDER,
    }
    if (reviewEnabled) base.review = PLACEHOLDER
    return base
}

function generateCookieSecret (reviewEnabled: boolean) {
    const genSecret = () => crypto.randomBytes(16).toString('base64')
    const cookie_secret: Record<string, string> = {
        _default: genSecret(),
        development: genSecret(),
        production: genSecret(),
    }
    if (reviewEnabled) cookie_secret.review = genSecret()

    return cookie_secret
}

function buildServerUrl (appName: string, reviewEnabled: boolean) {
    const server_url: Record<string, string> = {
        _default: '',
        development: `https://${appName}.d.doma.ai`,
        production: `https://${appName}.doma.ai`,
    }
    if (reviewEnabled) server_url.review = `https://${appName}.r.doma.ai`

    return server_url
}

export async function updateSecretValues (appName: string, reviewEnabled: boolean) {
    try {
        const appUnderscore = appName.replace(/-/g, '_')
        const currentEncryptedContent = await fs.readFile(SECRET_VALUES, 'utf8')
        const encryptedData = yaml.load(currentEncryptedContent) as SecretValues

        const { stdout: decodedYaml } = await execa('werf', [
            'helm',
            'secret',
            'values',
            'decrypt',
            SECRET_VALUES,
        ], { cwd: CONDO_ROOT })

        const data = yaml.load(decodedYaml) as SecretValues
        if (!data.envs) data.envs = {}

        if (data.envs[appUnderscore]) {
            logger.info(`${appUnderscore} already exists in secret-values.yaml, skipping.`)
            return null
        }

        const cookie_secret = generateCookieSecret(reviewEnabled)
        const server_url = buildServerUrl(appName, reviewEnabled)
        const placeholderField = buildPlaceholderField(reviewEnabled)

        const newAppData = {
            redis_url: { ...placeholderField },
            database_url: { ...placeholderField },
            server_url,
            oidc_condo_client_config: { ...placeholderField },
            condo_client_auth_config: { ...placeholderField },
            cookie_secret,
        }

        const tmpNewAppFile = path.join(os.tmpdir(), `werf-newapp-${crypto.randomBytes(6).toString('hex')}.yaml`)
        await fs.writeFile(tmpNewAppFile, yaml.dump({ [appUnderscore]: newAppData }, { indent: 2 }), 'utf8')

        const { stdout: encryptedNewApp } = await execa('werf', [
            'helm',
            'secret',
            'values',
            'encrypt',
            tmpNewAppFile,
        ], { cwd: CONDO_ROOT })

        await fs.unlink(tmpNewAppFile)

        const encryptedNewAppData = yaml.load(encryptedNewApp) as SecretValues['envs']

        if (!encryptedData.envs) {
            encryptedData.envs = {}
        }
        encryptedData.envs[appUnderscore] = encryptedNewAppData[appUnderscore]

        // Use a custom dumper to preserve literal style for multiline strings
        const finalContent = yaml.dump(encryptedData, { 
            indent: 2,
            lineWidth: -1, // Disable line wrapping
            noCompatMode: true,
            styles: {
                '!!str': 'literal', // Use literal style for strings to avoid >-
            },
        })

        await fs.writeFile(SECRET_VALUES, finalContent, 'utf8')

        logger.success(`Added encrypted section for ${appUnderscore} to secret-values.yaml`)

        return SECRET_VALUES
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        if (errorMessage.includes('unable to load secret key: required encryption key not found')) {
            logger.error(`Werf encryption key not found. Please add it to ${CONDO_ROOT}, you can find it in password manager`)
        } else {
            logger.error('Unexpected error occured while updating secret-values.yaml: ', error)
        }

        throw error
    }
}