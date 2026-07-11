export type GuideSectionKey =
  | 'overview'
  | 'quick-start'
  | 'dream'
  | 'turn-economy'
  | 'skills'
  | 'stocks'
  | 'real-estate-bank'
  | 'news'
  | 'deals'
  | 'ui-tips'

export type GuideContentBlock =
  | {
      type: 'hero'
      title: string
      text: string
      icon?: string
    }
  | {
      type: 'intro'
      text: string
    }
  | {
      type: 'actionSteps'
      title: string
      items: string[]
    }
  | {
      type: 'featureCards'
      title: string
      cards: {
        title: string
        text: string
        icon?: string
        badge?: string
      }[]
    }
  | {
      type: 'tip'
      title?: string
      text: string
    }
  | {
      type: 'warning'
      title?: string
      text: string
    }
  | {
      type: 'related'
      title: string
      sectionKeys: GuideSectionKey[]
    }
  | {
      type: 'dreamProgress'
      totalStages: number
      currentStage: number
      completedStages: number
    }

export interface GuideSection {
  key: GuideSectionKey
  title: string
  icon?: string
  description: string
  keywords: string[]
  blocks: GuideContentBlock[]
}