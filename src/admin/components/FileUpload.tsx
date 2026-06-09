import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, AlertCircle, Loader2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadResult {
  url: string
  publicId: string
  format: string
  originalName: string
  size: number
  type: string
}

interface CloudinarySignature {
  cloudName: string
  apiKey: string
  signature: string
  timestamp: number
  folder: string
  maxFileSize: number
}

interface FileUploadProps {
  folder?: string
  accept?: string
  maxSize?: number
  label?: string
  value?: string
  onChange?: (url: string | null) => void
  previewType?: 'image' | 'video' | 'auto'
}

const PROXY_LIMIT = 100 * 1024 * 1024 // 100MB — below this, proxy through our server
const DIRECT_LIMIT = 5 * 1024 * 1024 * 1024 // 5GB — above this, upload directly to Cloudinary

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url)
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url)
}

export function FileUpload({
  folder = 'general',
  accept = 'image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4,video/webm,audio/mpeg,audio/wav,audio/ogg',
  maxSize = DIRECT_LIMIT,
  label = 'Drop file here or click to browse',
  value,
  onChange,
  previewType = 'auto',
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(value ?? null)
  const inputRef = useRef<HTMLInputElement>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)

  const directUpload = useCallback(async (file: File, sig: CloudinarySignature): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', sig.apiKey)
      formData.append('timestamp', String(sig.timestamp))
      formData.append('signature', sig.signature)
      formData.append('folder', sig.folder)
      formData.append('unique_filename', 'true')
      formData.append('overwrite', 'false')

      const resourceType = file.type.startsWith('video') || file.type.startsWith('audio') ? 'video'
        : file.type === 'application/pdf' ? 'raw'
        : 'image'

      const xhr = new XMLHttpRequest()
      xhrRef.current = xhr
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      }

      xhr.onload = () => {
        xhrRef.current = null
        if (xhr.status >= 200 && xhr.status < 300) {
          const result = JSON.parse(xhr.responseText)
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            originalName: file.name,
            size: file.size,
            type: file.type,
          })
        } else {
          try {
            const err = JSON.parse(xhr.responseText)
            reject(new Error(err.error?.message || 'Direct upload failed'))
          } catch {
            reject(new Error('Direct upload failed'))
          }
        }
      }

      xhr.onerror = () => {
        xhrRef.current = null
        reject(new Error('Network error during upload'))
      }

      xhr.send(formData)
    })
  }, [])

  const proxyUpload = useCallback(async (file: File): Promise<UploadResult> => {
    const token = localStorage.getItem('access_token')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? `Upload failed (${res.status})`)
    }
    return res.json()
  }, [folder])

  const doUpload = useCallback(async (file: File) => {
    if (file.size > maxSize) {
      setError(`File too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`)
      return
    }

    if (!accept.split(',').some(t => file.type.match(t.replace('*', '.*')))) {
      setError(`File type ${file.type} is not supported`)
      return
    }

    setError(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      // For files over 100MB, upload directly to Cloudinary from the browser
      let result: UploadResult
      if (file.size > PROXY_LIMIT) {
        const sigRes = await fetch(`/api/upload/signature?folder=${encodeURIComponent(folder)}`)
        if (!sigRes.ok) throw new Error('Failed to get upload signature')
        const sig: CloudinarySignature = await sigRes.json()
        result = await directUpload(file, sig)
      } else {
        result = await proxyUpload(file)
      }

      setPreview(result.url)
      onChange?.(result.url)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [maxSize, accept, folder, directUpload, proxyUpload, onChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) doUpload(file)
  }, [doUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) doUpload(file)
    if (inputRef.current) inputRef.current.value = ''
  }, [doUpload])

  const handleRemove = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort()
      xhrRef.current = null
    }
    setPreview(null)
    onChange?.(null)
  }, [onChange])

  // Preview
  if (preview) {
    const isImage = isImageUrl(preview) || previewType === 'image'
    const isVideo = isVideoUrl(preview) || previewType === 'video'

    return (
      <div className="relative rounded-lg border border-slate-200 bg-slate-50 overflow-hidden group">
        {isImage && (
          <img src={preview} alt="Preview" className="w-full h-40 object-cover" />
        )}
        {isVideo && (
          <video src={preview} controls className="w-full h-40 object-cover" />
        )}
        {!isImage && !isVideo && (
          <div className="flex items-center justify-center h-20 px-4">
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-8 w-8 text-slate-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {preview.split('/').pop()?.split('?')[0]}
                </p>
                <p className="text-xs text-slate-400">Click to replace</p>
              </div>
            </div>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Remove
          </button>
          {isVideo && preview && (
            <a href={preview} target="_blank" rel="noreferrer"
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" /> Open
            </a>
          )}
        </div>
        <input ref={inputRef} type="file" accept={accept} onChange={handleFileSelect} className="hidden" />
      </div>
    )
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 transition-colors',
          dragOver ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50',
        )}
      >
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-2" />
            <p className="text-sm text-slate-500">
              {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Uploading...'}
            </p>
            {uploadProgress > 0 && (
              <div className="mt-2 h-1.5 w-48 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-teal-600 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-600 font-medium">{label}</p>
            <p className="text-xs text-slate-400 mt-1">
              Up to {Math.round(maxSize / 1024 / 1024 / 1024 * 10) / 10}GB
              {maxSize > PROXY_LIMIT ? ' — large files upload directly to Cloudinary' : ''}
            </p>
          </>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} onChange={handleFileSelect} className="hidden" />
      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}
    </div>
  )
}
