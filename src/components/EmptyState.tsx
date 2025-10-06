import React from 'react'
import { LifeSyncButton } from '@/components/LifeSyncButton'
import { z } from 'zod'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  compact?: boolean
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📄',
  title,
  description,
  actionLabel,
  onAction,
  compact
}) => {
  z.object({
    icon: z.string().optional(),
    title: z.string(),
    description: z.string().optional(),
    actionLabel: z.string().optional(),
    onAction: z.function().args().returns(z.void()).optional(),
    compact: z.boolean().optional(),
  }).parse({ icon, title, description, actionLabel, onAction, compact })

  return (
    <div className={`flex flex-col items-center text-center ${compact ? 'py-4' : 'py-8'} px-4`}>
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-4">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <LifeSyncButton size="sm" variant="primary" onClick={onAction}>
          {actionLabel}
        </LifeSyncButton>
      )}
    </div>
  )
}
