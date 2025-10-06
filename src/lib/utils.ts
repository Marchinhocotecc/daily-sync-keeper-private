import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...parts: Array<string | undefined | null | false>) {
  return parts.filter(Boolean).join(' ')
}

// Simple latency controller with debounce and jitter to smooth UI updates
export const debounce = <T extends (...args: any[]) => void>(fn: T, delayMs = 150) => {
  let timer: any
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delayMs)
  }
}

export const withJitterDelay = async (baseMs = 50, jitterMs = 100) => {
  const ms = baseMs + Math.floor(Math.random() * jitterMs)
  await new Promise(res => setTimeout(res, ms))
}
