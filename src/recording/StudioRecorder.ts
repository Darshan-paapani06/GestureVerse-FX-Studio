import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export type RecordingResult = {
  blob: Blob
  url: string
  mimeType: string
  extension: 'mp4' | 'webm'
}

export class StudioRecorder {
  private recorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private stream: MediaStream | null = null

  static supportedMimeType() {
    const candidates = [
      'video/mp4;codecs=h264,aac',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ]
    return candidates.find(type => MediaRecorder.isTypeSupported(type)) ?? ''
  }

  start(canvas: HTMLCanvasElement, audioTrack?: MediaStreamTrack | null, fps = 30) {
    if (this.recorder?.state === 'recording') throw new Error('A recording is already active.')
    const canvasStream = canvas.captureStream(fps)
    this.stream = new MediaStream(canvasStream.getVideoTracks())
    if (audioTrack) this.stream.addTrack(audioTrack.clone())
    const mimeType = StudioRecorder.supportedMimeType()
    this.chunks = []
    this.recorder = new MediaRecorder(this.stream, mimeType ? { mimeType, videoBitsPerSecond: 8_000_000 } : undefined)
    this.recorder.ondataavailable = event => {
      if (event.data.size > 0) this.chunks.push(event.data)
    }
    this.recorder.start(250)
  }

  stop(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.recorder || this.recorder.state !== 'recording') {
        reject(new Error('No recording is active.'))
        return
      }
      const recorder = this.recorder
      recorder.onerror = () => reject(new Error('The recording could not be completed.'))
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || this.chunks[0]?.type || 'video/webm'
        const blob = new Blob(this.chunks, { type: mimeType })
        const url = URL.createObjectURL(blob)
        this.stream?.getTracks().forEach(track => track.stop())
        this.stream = null
        this.recorder = null
        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm'
        resolve({ blob, url, mimeType, extension })
      }
      recorder.stop()
    })
  }

  isRecording() {
    return this.recorder?.state === 'recording'
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not prepare this capture for export.'))
    reader.onload = () => {
      const result = String(reader.result)
      resolve(result.slice(result.indexOf(',') + 1))
    }
    reader.readAsDataURL(blob)
  })
}

/**
 * Web: triggers a normal file download.
 * Android: writes the file into the app cache and opens the native share/save sheet.
 */
export async function downloadBlob(blob: Blob, filename: string) {
  if (Capacitor.isNativePlatform()) {
    const data = await blobToBase64(blob)
    const result = await Filesystem.writeFile({
      path: `exports/${filename}`,
      data,
      directory: Directory.Cache,
      recursive: true
    })
    await Share.share({
      title: 'Export from GestureVerse FX Studio',
      text: 'Created in GestureVerse FX Studio by Darshan Paapani',
      files: [result.uri],
      dialogTitle: 'Save or share your GestureVerse capture'
    })
    return
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
