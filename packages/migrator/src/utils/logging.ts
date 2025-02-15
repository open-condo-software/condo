import Table from 'cli-table3'
import prompts from 'prompts'

interface SimpleLogger {
    info (msg: string): void
    error (msg: string): void
    confirm (msg: string): Promise<boolean>
    table (options: { head: Array<string>, data: Array<Array<string>> }): void
    updateLine (msg: string): void

}

class TimedLogger implements SimpleLogger {
    private isUpdating = false

    private formatMessage (msg: string): string {
        return [(new Date()).toISOString(), '|', msg].join(' ')
    }

    private preventUpdating () {
        if (this.isUpdating) {
            process.stdout.write('\n')
            this.isUpdating = false
        }
    }

    info (msg: string): void {
        this.preventUpdating()
        console.log(this.formatMessage(msg))
    }

    updateLine (msg: string) {
        this.isUpdating = true
        process.stdout.clearLine(0)
        process.stdout.cursorTo(0)
        process.stdout.write(this.formatMessage(msg) + '\r')
    }

    error (msg: string) {
        this.preventUpdating()
        console.error(this.formatMessage(msg))
    }

    async confirm (msg: string): Promise<boolean> {
        this.preventUpdating()
        return prompts({
            type: 'confirm',
            name: 'value',
            message: msg,
        }).then(({ value }) => Boolean(value))
    }

    table (options: { head: Array<string>, data: Array<Array<string>> }) {
        this.preventUpdating()
        const table = new Table({ head: options.head })
        table.push(...options.data)
        console.log(table.toString())
    }
}

export function getLogger (): SimpleLogger {
    return new TimedLogger()
}