interface typeMap {
    string: string
    number: number
    boolean: boolean
    // eslint-disable-next-line @typescript-eslint/ban-types
    function: Function
}

type PrimitiveOrConstructor = { new (...args: any[]): any } | keyof typeMap // 'string' | 'number' | 'boolean' | constructor

// infer the guarded type from a specific case of PrimitiveOrConstructor
type GuardedType<T extends PrimitiveOrConstructor> = T extends {
    new (...args: any[]): infer U
}
    ? U
    : T extends keyof typeMap
    ? typeMap[T]
    : never

// finally, guard ALL the types!
function isOfType<T extends PrimitiveOrConstructor>(o, className: T): o is GuardedType<T> {
    const localPrimitiveOrConstructor: PrimitiveOrConstructor = className

    if (typeof localPrimitiveOrConstructor === 'string') {
        return typeof o === localPrimitiveOrConstructor
    }

    return o instanceof localPrimitiveOrConstructor
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function isFunction(arg: any): arg is Function {
    return isOfType(arg, 'function')
}
