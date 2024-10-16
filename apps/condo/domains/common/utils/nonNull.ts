// TODO(INFRA-455): move to package
export function nonNull<TVal> (val: TVal): val is NonNullable<TVal> {
    return val !== null && val !== undefined
}
