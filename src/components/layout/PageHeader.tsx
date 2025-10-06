import React from 'react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

interface PageHeaderProps {
  titleKey: string
  subtitleKey?: string
  fallbackTitle?: string
  fallbackSubtitle?: string
  right?: React.ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  titleKey,
  subtitleKey,
  fallbackTitle,
  fallbackSubtitle,
  right,
  className
}) => {
  const { t } = useTranslation()
  const tr = (k?: string, fb?: string) => (k ? (t(k) === k ? (fb || '') : t(k)) : '')
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {tr(titleKey, fallbackTitle)}
        </h1>
        {subtitleKey && (
          <p className="text-sm text-muted-foreground">
            {tr(subtitleKey, fallbackSubtitle)}
          </p>
        )}
      </div>
      {right}
    </div>
  )
}
