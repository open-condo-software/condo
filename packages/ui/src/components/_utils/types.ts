type Only<T, U> = {
    [P in keyof T]: T[P]
} & {
    [P in keyof Omit<U, keyof T>]?: never
}

export type Either<T, U> = Only<T, U> | Only<U, T>