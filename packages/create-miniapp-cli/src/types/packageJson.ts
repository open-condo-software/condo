export type PackageJson = {
    [key: string]: unknown
    name?: string
    version?: string
    private?: boolean
    description?: string
    license?: string
    repository?: unknown
    author?: unknown
    type?: string
    exports?: unknown
    bin?: unknown
    files?: string[]
    scripts?: Record<string, string>
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
    resolutions?: Record<string, string>
}
