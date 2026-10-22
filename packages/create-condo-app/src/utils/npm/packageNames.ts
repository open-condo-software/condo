type PkgNameInfo = {
    full: string
    name: string
    scope: string | null
}

function encode (value: string) {
    return encodeURIComponent(value).replace(/^%40/, '@')
}

export function getNameDetails (pkgName: string): PkgNameInfo {
    const spec: PkgNameInfo = {
        full: encode(pkgName),
        name: '',
        scope: null,
    }

    if (pkgName.includes('/')) {
        const parts = pkgName.split('/')

        spec.scope = parts[0]
        spec.name = parts[1]
    } else {
        spec.scope = null
        spec.name = pkgName
    }

    return spec
}