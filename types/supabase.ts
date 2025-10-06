// Minimal regenerated Supabase types (extend/replace with full dump when available)
export type Json =
  | string | number | boolean
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      settings: {
        Row: {
          user_id: string
          theme: string | null
            /** ISO language code like 'en' | 'it' */
          language: string | null
          notifications_enabled: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          user_id: string
          theme?: string | null
          language?: string | null
          notifications_enabled?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          theme?: string | null
          language?: string | null
          notifications_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          year: number
          month: number // 1-12
          amount: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          year: number
          month: number
          amount: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          amount: number
          category: string
           description: string          // align with DB and services
          icon: string | null
          date: string                 // ISO date
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          category: string
          description: string
          icon?: string | null
          date: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          description?: string
          icon?: string | null
            /** Allow date correction */
          date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          priority: 'low' | 'normal' | 'high' | 'urgent' | (string | null)
          completed: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          priority?: 'low' | 'normal' | 'high' | 'urgent' | (string | null)
          completed?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          title?: string
          priority?: 'low' | 'normal' | 'high' | 'urgent' | (string | null)
          completed?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          id: string
          user_id: string
          title: string
          date: string
          time: string | null
          duration: number
          color: string | null
          category: string | null
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          date: string
          time?: string | null
          duration?: number
          color?: string | null
          category?: string | null
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          title?: string
          date?: string
          time?: string | null
          duration?: number
          color?: string | null
          category?: string | null
          description?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      // (Other existing tables can be appended here)
    }
  }
}

export type SettingsRow = Database['public']['Tables']['settings']['Row']
export type BudgetRow = Database['public']['Tables']['budgets']['Row']
export type ExpenseRow = Database['public']['Tables']['expenses']['Row']
export type TaskRow = Database['public']['Tables']['tasks']['Row']
export type CalendarEventRow = Database['public']['Tables']['calendar_events']['Row']

// Friendly aliases
export type Budget = BudgetRow
export type Expense = ExpenseRow

// Lightweight app-level user profile shape (used by global store)
export type UserProfile = {
  id: string
  email?: string | null
  userName?: string | null
  avatarUrl?: string | null
  updatedAt?: string | null
}
