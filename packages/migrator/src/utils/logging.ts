import Table from 'cli-table3'
import prompts from 'prompts'

interface SimpleLogger {
    info (msg: string): void
    error (msg: string): void
    confirm(msg: string): Promise<boolean>
    table(options: { head: Array<string>, data: Array<Array<string>> }): void
}

class TimedLogger implements SimpleLogger {
    private formatMessage (msg: string): string {
        return [(new Date()).toISOString(), '|', msg].join(' ')
    }

    info (msg: string): void {
        console.log(this.formatMessage(msg))
    }

    error (msg: string) {
        console.error(this.formatMessage(msg))
    }

    async confirm (msg: string): Promise<boolean> {
        return prompts({
            type: 'confirm',
            name: 'value',
            message: msg,
        }).then(({ value }) => Boolean(value))
    }

    table (options: { head: Array<string>, data: Array<Array<string>> }) {
        const table = new Table({ head: options.head })
        table.push(...options.data)
        console.log(table.toString())
    }
}

export function getLogger (): SimpleLogger {
    return new TimedLogger()
}