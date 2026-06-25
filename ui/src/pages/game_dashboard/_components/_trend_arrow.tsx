import { TrendArrowIcon } from '../../../shared/icons'

export function TrendArrow({ up }: { up: boolean }) {
  return (
    <TrendArrowIcon
      up={up}
      className={`inline-block h-3 w-3 ${up ? 'text-emerald-400' : 'text-red-400'}`}
    />
  )
}
