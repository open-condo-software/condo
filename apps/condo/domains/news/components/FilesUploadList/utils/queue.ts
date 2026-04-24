type QueueTask<T> = {
    item: T
    resolve: (value: T) => void
    reject: (reason: any) => void
    onProgress?: (progress: any) => void
}

export class Queue<T> {
    private tasks: QueueTask<T>[] = []
    private busy = false

    constructor (private processor: (item: T, onProgress?: (progress: any) => void) => Promise<T>) {}

    add (item: T, onProgress?: (progress: any) => void): Promise<T> {
        return new Promise((resolve, reject) => {
            this.tasks.push({ item, resolve, reject, onProgress })
            this.next()
        })
    }

    private async next () {
        if (this.busy || this.tasks.length === 0) return

        this.busy = true
        const task = this.tasks.shift()!

        try {
            const result = await this.processor(task.item, task.onProgress)
            task.resolve(result)
        } catch (error) {
            task.reject(error)
        } finally {
            this.busy = false
            this.next()
        }
    }
}
