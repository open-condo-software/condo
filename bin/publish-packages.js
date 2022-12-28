const path = require('path')
const multiRelease = require('multi-semantic-release')

// NOTE: Edit this list to add / remove packages from auto-release cycle
const RELEASE_LIST = [
    'tsconfig',
    'icons',
    'ui',
]

const releasePaths = RELEASE_LIST.map(pkgName => path.join(__dirname, '..', 'packages', pkgName, 'package.json'))

multiRelease(releasePaths)
    .then(() => console.log('ALL DONE! ✅'))