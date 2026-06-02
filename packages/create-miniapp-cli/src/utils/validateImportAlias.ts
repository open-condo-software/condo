export const validateImportAlias = (input: string | undefined) => {
    // Clack may call validate with undefined during prompt lifecycle.
    // We let empty value pass so text prompt can apply defaultValue on submit.
    if (!input) return

    if (input.startsWith('.') || input.startsWith('/')) {
        return 'Import alias can\'t start with \'.\' or \'/\''
    }
    return
}
