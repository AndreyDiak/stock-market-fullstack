import type { IconProps } from './types'
import { BarChartIcon } from './bar_chart_icon'
import { ChatBubbleIcon } from './chat_bubble_icon'
import { GraduationCapIcon } from './graduation_cap_icon'
import { PropertySlotIcon } from './property_slot_icon'
import { TradingChartIcon } from './trading_chart_icon'

interface UpgradeIconProps extends IconProps {
  upgradeId: string
}

export function UpgradeIcon({ upgradeId, className, ...props }: UpgradeIconProps) {
  const iconClassName = className ?? 'h-5 w-5 shrink-0 text-emerald-400'

  switch (upgradeId) {
    case 'qualification':
      return <GraduationCapIcon className={iconClassName} {...props} />
    case 'trading':
      return <TradingChartIcon className={iconClassName} {...props} />
    case 'negotiation':
      return <ChatBubbleIcon className={iconClassName} {...props} />
    case 'property_slots':
      return <PropertySlotIcon className={iconClassName} {...props} />
    default:
      return <BarChartIcon className={iconClassName} {...props} />
  }
}
