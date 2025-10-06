import React from 'react'
import { env, requiredKeys } from '@/config/env'

type Props = {
  children: React.ReactNode
}

export const EnvGuard: React.FC<Props> = ({ children }) => {
  const missing = requiredKeys.filter((k) => !env[k]);
  if (missing.length) {
    return (
      <div style={{ padding: 16, color: 'crimson' }}>
        Missing environment variables: {missing.join(', ')}
      </div>
    );
  }

  return <>{children}</>;
}

export default EnvGuard
