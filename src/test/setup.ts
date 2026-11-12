import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  if (typeof document !== 'undefined') cleanup()
  if (typeof localStorage !== 'undefined') localStorage.clear()
})
