import path from 'path'

import { PKG_ROOT } from '@cli/consts.js'
import { type Installer } from '@cli/installers/index.js'
import { addPackageDependency } from '@cli/utils/addPackageDependency.js'
import { addPackageScript } from '@cli/utils/addPackageScript.js'
import { getUserPkgManager } from '@cli/utils/getUserPkgManager.js'
import fs from 'fs-extra'

import { AvailableDependencies } from './dependencyVersionMap.js'

// Also installs prettier
export const dynamicEslintInstaller: Installer = ({ projectDir, packages }) => {
    const devPackages: AvailableDependencies[] = [
        'prettier',
        'eslint',
        'eslint-config-next',
        'typescript-eslint',
        '@eslint/eslintrc',
    ]

    addPackageDependency({
        projectDir,
        dependencies: devPackages,
        devMode: true,
    })
    const extrasDir = path.join(PKG_ROOT, 'template/extras')

    // Prettier
    const prettierSrc = path.join(extrasDir, 'config/_prettier.config.js')
    const prettierDest = path.join(projectDir, 'prettier.config.js')

    fs.copySync(prettierSrc, prettierDest)

    // pnpm
    const pkgManager = getUserPkgManager()
    if (pkgManager === 'pnpm') {
        const pnpmSrc = path.join(extrasDir, 'pnpm/_npmrc')
        fs.copySync(pnpmSrc, path.join(projectDir, '.npmrc'))
    }

    addPackageScript({
        projectDir,
        scripts: {
            lint: 'next lint',
            'lint:fix': 'next lint --fix',
            check: 'next lint && tsc --noEmit',
            'format:write': 'prettier --write "**/*.{ts,tsx,js,jsx,mdx}" --cache',
            'format:check': 'prettier --check "**/*.{ts,tsx,js,jsx,mdx}" --cache',
        },
    })

    // eslint
    const eslintConfigSrc = path.join(extrasDir, 'config/_eslint.base.js')
    const eslintConfigDest = path.join(projectDir, 'eslint.config.js')

    fs.copySync(eslintConfigSrc, eslintConfigDest)
}
