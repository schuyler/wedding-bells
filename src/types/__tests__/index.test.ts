import { describe, it, expect } from 'vitest'
import { guestInfoSchema, recordingSchema } from '../index'

describe('Zod Schemas', () => {
  describe('guestInfoSchema', () => {
    it('validates valid guest info', () => {
      const validGuestInfo = {
        name: 'John Doe'
      }
      
      const result = guestInfoSchema.safeParse(validGuestInfo)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data).toEqual(validGuestInfo)
      }
    })

    it('rejects empty name', () => {
      const invalidGuestInfo = {
        name: ''
      }
      
      const result = guestInfoSchema.safeParse(invalidGuestInfo)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters')
      }
    })

    it('rejects name that is too short', () => {
      const invalidGuestInfo = {
        name: 'A'
      }
      
      const result = guestInfoSchema.safeParse(invalidGuestInfo)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 2 characters')
      }
    })

    it('rejects name that is too long', () => {
      const invalidGuestInfo = {
        name: 'A'.repeat(101) // 101 characters
      }
      
      const result = guestInfoSchema.safeParse(invalidGuestInfo)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('less than 100 characters')
      }
    })

    it('accepts name at minimum length', () => {
      const validGuestInfo = {
        name: 'AB' // 2 characters
      }
      
      const result = guestInfoSchema.safeParse(validGuestInfo)
      expect(result.success).toBe(true)
    })

    it('accepts name at maximum length', () => {
      const validGuestInfo = {
        name: 'A'.repeat(100) // 100 characters
      }
      
      const result = guestInfoSchema.safeParse(validGuestInfo)
      expect(result.success).toBe(true)
    })

    it('rejects missing name field', () => {
      const invalidGuestInfo = {}
      
      const result = guestInfoSchema.safeParse(invalidGuestInfo)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Required')
      }
    })
  })

  describe('recordingSchema', () => {
    it('validates valid recording data', () => {
      const validRecording = {
        duration: 60,
        volume: 0.5
      }
      
      const result = recordingSchema.safeParse(validRecording)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data).toEqual(validRecording)
      }
    })

    it('rejects duration that is too short', () => {
      const invalidRecording = {
        duration: 0,
        volume: 0.5
      }
      
      const result = recordingSchema.safeParse(invalidRecording)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 1 second')
      }
    })

    it('rejects duration that is too long', () => {
      const invalidRecording = {
        duration: 901, // 15 minutes + 1 second
        volume: 0.5
      }
      
      const result = recordingSchema.safeParse(invalidRecording)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 15 minutes')
      }
    })

    it('accepts duration at minimum value', () => {
      const validRecording = {
        duration: 1,
        volume: 0.5
      }
      
      const result = recordingSchema.safeParse(validRecording)
      expect(result.success).toBe(true)
    })

    it('accepts duration at maximum value', () => {
      const validRecording = {
        duration: 900, // 15 minutes
        volume: 0.5
      }
      
      const result = recordingSchema.safeParse(validRecording)
      expect(result.success).toBe(true)
    })

    it('rejects negative volume', () => {
      const invalidRecording = {
        duration: 60,
        volume: -0.1
      }
      
      const result = recordingSchema.safeParse(invalidRecording)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot be negative')
      }
    })

    it('rejects volume greater than 1', () => {
      const invalidRecording = {
        duration: 60,
        volume: 1.1
      }
      
      const result = recordingSchema.safeParse(invalidRecording)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('cannot exceed 1')
      }
    })

    it('accepts volume at minimum value', () => {
      const validRecording = {
        duration: 60,
        volume: 0
      }
      
      const result = recordingSchema.safeParse(validRecording)
      expect(result.success).toBe(true)
    })

    it('accepts volume at maximum value', () => {
      const validRecording = {
        duration: 60,
        volume: 1
      }
      
      const result = recordingSchema.safeParse(validRecording)
      expect(result.success).toBe(true)
    })

    it('rejects missing fields', () => {
      const invalidRecording = {}
      
      const result = recordingSchema.safeParse(invalidRecording)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2) // Both fields are required
      }
    })
  })
})
