declare const slugify: {
    (
        replacement: string,
        options?:
        | {
            replacement?: string;
            remove?: RegExp;
            lower?: boolean;
            strict?: boolean;
            locale?: string;
            trim?: boolean;
        }
        | string,

    ): string;
    extend: (charMap: Record<string, string>) => void;
    extendLocale: (locale: string, charMap: Record<string, string>) => void;
    reset: () => void;
}

export default slugify