export const namespaces = ['common', 'tasks', 'calendar', 'expenses', 'assistant'] as const;
export type AppNamespace = typeof namespaces[number];
