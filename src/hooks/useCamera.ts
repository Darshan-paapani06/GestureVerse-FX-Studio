import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraDevice = { deviceId: string; label: string }

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [devices, setDevices] = useState<CameraDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enumerate = useCallback(async () => {
    const all = await navigator.mediaDevices.enumerateDevices()
    const cameras = all
      .filter(device => device.kind === 'videoinput')
      .map((device, index) => ({ deviceId: device.deviceId, label: device.label || `Camera ${index + 1}` }))
    setDevices(cameras)
    if (!selectedDeviceId && cameras[0]) setSelectedDeviceId(cameras[0].deviceId)
  }, [selectedDeviceId])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setIsReady(false)
  }, [])

  const start = useCallback(async (deviceId?: string) => {
    try {
      setError(null)
      stop()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user'
        },
        audio: false
      })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) throw new Error('Camera preview is not mounted.')
      video.srcObject = stream
      await video.play()
      await new Promise<void>(resolve => {
        if (video.readyState >= 2) resolve()
        else video.onloadeddata = () => resolve()
      })
      setIsReady(true)
      await enumerate()
      const current = stream.getVideoTracks()[0]?.getSettings().deviceId
      if (current) setSelectedDeviceId(current)
      return video
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : String(reason)
      setError(message)
      setIsReady(false)
      throw reason
    }
  }, [enumerate, stop])

  const switchCamera = useCallback(async (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    return start(deviceId)
  }, [start])

  useEffect(() => () => stop(), [stop])

  return { videoRef, streamRef, devices, selectedDeviceId, isReady, error, start, stop, switchCamera }
}
