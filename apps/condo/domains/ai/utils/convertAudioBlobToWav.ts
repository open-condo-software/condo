const WAV_MIME_TYPE = 'audio/wav'
const TARGET_SAMPLE_RATE = 16000

function writeString (view: DataView, offset: number, value: string): void {
    for (let i = 0; i < value.length; i++) {
        view.setUint8(offset + i, value.charCodeAt(i))
    }
}

function floatTo16BitPcm (output: DataView, offset: number, input: Float32Array): void {
    let position = offset
    for (let i = 0; i < input.length; i++, position += 2) {
        const sample = Math.max(-1, Math.min(1, input[i]))
        output.setInt16(position, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
    }
}

function mixToMono (audioBuffer: AudioBuffer): Float32Array {
    const { numberOfChannels, length } = audioBuffer
    if (numberOfChannels === 1) {
        return audioBuffer.getChannelData(0)
    }

    const mixed = new Float32Array(length)
    for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel)
        for (let i = 0; i < length; i++) {
            mixed[i] += channelData[i] / numberOfChannels
        }
    }
    return mixed
}

function resampleLinear (input: Float32Array, inputSampleRate: number, outputSampleRate: number): Float32Array {
    if (inputSampleRate === outputSampleRate) {
        return input
    }

    const ratio = inputSampleRate / outputSampleRate
    const outputLength = Math.max(1, Math.round(input.length / ratio))
    const output = new Float32Array(outputLength)

    for (let i = 0; i < outputLength; i++) {
        const position = i * ratio
        const leftIndex = Math.floor(position)
        const rightIndex = Math.min(leftIndex + 1, input.length - 1)
        const fraction = position - leftIndex
        output[i] = input[leftIndex] * (1 - fraction) + input[rightIndex] * fraction
    }

    return output
}

function encodeWav (samples: Float32Array, sampleRate: number): Blob {
    const bytesPerSample = 2
    const blockAlign = bytesPerSample
    const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample)
    const view = new DataView(buffer)

    writeString(view, 0, 'RIFF')
    view.setUint32(4, 36 + samples.length * bytesPerSample, true)
    writeString(view, 8, 'WAVE')
    writeString(view, 12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true) // PCM
    view.setUint16(22, 1, true) // mono
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bytesPerSample * 8, true)
    writeString(view, 36, 'data')
    view.setUint32(40, samples.length * bytesPerSample, true)
    floatTo16BitPcm(view, 44, samples)

    return new Blob([buffer], { type: WAV_MIME_TYPE })
}

/**
 * Converts a recorded browser audio blob (webm/mp4/ogg/...) to mono 16-bit PCM WAV.
 * Whisper backends (including Cloud.ru) accept WAV much more reliably than MediaRecorder webm.
 */
export async function convertAudioBlobToWav (blob: Blob): Promise<Blob> {
    const AudioContextClass = window.AudioContext || (window as typeof window & {
        webkitAudioContext?: typeof AudioContext
    }).webkitAudioContext

    if (!AudioContextClass) {
        throw new Error('AudioContext is not supported')
    }

    const arrayBuffer = await blob.arrayBuffer()
    const audioContext = new AudioContextClass()

    try {
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0))
        const mono = mixToMono(audioBuffer)
        const resampled = resampleLinear(mono, audioBuffer.sampleRate, TARGET_SAMPLE_RATE)
        return encodeWav(resampled, TARGET_SAMPLE_RATE)
    } finally {
        await audioContext.close()
    }
}

export const SPEECH_TO_TEXT_UPLOAD_MIME_TYPE = WAV_MIME_TYPE
export const SPEECH_TO_TEXT_UPLOAD_EXTENSION = 'wav'
