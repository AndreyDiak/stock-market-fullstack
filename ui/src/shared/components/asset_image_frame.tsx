import { type CSSProperties, type ReactNode } from 'react'

import { getRealEstateImage } from '../../constants/realEstateImages'

import './asset_image_frame.css'

export type AssetImageFrameSize = 'loan' | 'paid' | 'history' | 'fill'

export interface AssetImageFrameProps {
  src?: string | null
  assetId?: string
  alt: string
  size?: AssetImageFrameSize
  width?: string | number
  height?: string | number
  className?: string
  imageClassName?: string
  decorations?: boolean
  fallback?: ReactNode
  children?: ReactNode
}

function toCssSize(value: string | number | undefined) {
  if (value == null) return undefined
  return typeof value === 'number' ? `${value}px` : value
}

export function AssetImageFrame({
  src,
  assetId,
  alt,
  size = 'paid',
  width,
  height,
  className = '',
  imageClassName = '',
  decorations = true,
  fallback,
  children,
}: AssetImageFrameProps) {
  const resolvedSrc = src ?? (assetId ? getRealEstateImage(assetId) : undefined)
  const hasCustomSize = width != null || height != null
  const style: CSSProperties | undefined = hasCustomSize
    ? { width: toCssSize(width), height: toCssSize(height) }
    : undefined

  const sizeClass = hasCustomSize ? '' : `asset-image-frame--${size}`

  return (
    <div
      className={[
        'asset-image-frame',
        sizeClass,
        decorations ? 'asset-image-frame--decorated' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      {decorations ? (
        <>
          <div className="asset-image-frame__glow" aria-hidden />
          <div className="asset-image-frame__floor" aria-hidden />
        </>
      ) : null}

      {resolvedSrc ? (
        <img
          src={resolvedSrc}
          alt={alt}
          className={['asset-image-frame__image', imageClassName].filter(Boolean).join(' ')}
        />
      ) : (
        <div className="asset-image-frame__fallback">{fallback ?? <span>{alt}</span>}</div>
      )}

      {decorations ? <div className="asset-image-frame__vignette" aria-hidden /> : null}
      {children ? <div className="asset-image-frame__children">{children}</div> : null}
    </div>
  )
}
