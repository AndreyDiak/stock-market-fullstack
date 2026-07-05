import { AssetImageFrame, type AssetImageFrameSize } from '../../../../shared/components'

export function BankPropertyPreview({
  itemRef,
  name,
  size = 'loan',
}: {
  itemRef: string
  name: string
  size?: AssetImageFrameSize
}) {
  return <AssetImageFrame assetId={itemRef} alt={name} size={size} />
}
