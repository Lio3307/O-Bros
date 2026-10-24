import { useEffect, useState } from 'react'
import { formatBytes } from '../../../shared/format'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import type { ImageFile } from '../../../shared/types'
import { Button } from '../../ui/Button'
import { cn } from '../../ui/cn'
import { followDiskChanges } from './diskSync'
import './imageViewer.css'

interface ImageViewerProps {
  filePath: string
}

interface ImageSize {
  width: number
  height: number
}

export function ImageViewer({ filePath }: ImageViewerProps) {
  const [image, setImage] = useState<ImageFile | null>(null)
  const [size, setSize] = useState<ImageSize | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isActualSize, setIsActualSize] = useState(false)

  useEffect(() => {
    let isCancelled = false

    function load(): void {
      window.api.files.readImage(filePath).then(
        (loaded) => {
          if (!isCancelled) {
            setImage(loaded)
            setErrorMessage(null)
          }
        },
        (error: unknown) => {
          if (!isCancelled) {
            setErrorMessage(friendlyErrorMessage(error, 'Could not open this image.'))
          }
        }
      )
    }

    setImage(null)
    setSize(null)
    load()
    const stopFollowingDisk = followDiskChanges(filePath, load)
    return () => {
      isCancelled = true
      stopFollowingDisk()
    }
  }, [filePath])

  if (errorMessage !== null) {
    return <div className="editor-error">{errorMessage}</div>
  }
  if (image === null) {
    return null
  }
  return (
    <div className="image-viewer">
      <div className={cn('image-stage', isActualSize && 'image-stage-actual')}>
        <img
          className="image-preview"
          src={image.dataUrl}
          alt=""
          draggable={false}
          onLoad={(event) => setSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
          onError={() => setErrorMessage('This image could not be shown. The file may be damaged.')}
        />
      </div>
      <div className="image-info">
        {size !== null && <span>{`${size.width} × ${size.height}`}</span>}
        <span>{formatBytes(image.size)}</span>
        <Button variant="link" className="image-zoom" onClick={() => setIsActualSize(!isActualSize)}>
          {isActualSize ? 'Fit to window' : 'Actual size'}
        </Button>
      </div>
    </div>
  )
}
