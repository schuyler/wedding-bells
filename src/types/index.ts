import { z } from 'zod'

export interface GuestInfo {
  name: string
}

export interface MessageMetadata {
  guestName: string
  timestamp: string
  duration: number
  originalFilename: string
}

export interface AudioUploadResponse {
  success: boolean
  url?: string
  error?: string
}

// States for the recording process
export type RecordingState = 'welcome' | 'recording' | 'upload' | 'thankyou'

// Configuration for audio recording
export interface AudioConfig {
  maxDuration: number // in seconds
  mimeType: string
  fileFormat: string
}

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  maxDuration: 15 * 60, // 15 minutes
  mimeType: 'audio/wav',
  fileFormat: 'wav'
}

export interface ViewProps {
  onNext: () => void
  onBack: () => void
  guestInfo: GuestInfo
}

export interface RecordingData {
  duration: number
  timestamp: string
  guestName: string
}

export interface RecordingStateStatus {
  status: 'idle' | 'recording' | 'paused' | 'completed' | 'error'
  error?: Error
  duration: number
  volume: number
}

export interface UploadState {
  status: 'idle' | 'uploading' | 'completed' | 'error'
  progress: number
  error?: Error
  retryAttempt?: number
}

export interface UploadConfig {
  apiUrl: string;
  uploadToken: string;
}

export const DEFAULT_UPLOAD_CONFIG: UploadConfig = {
  apiUrl: '/upload', // This will be overridden by env vars when available
  uploadToken: 'dev-token' // This will be overridden by env vars when available
}

export interface BrowserCompatibility {
  hasAudioSupport: boolean
  hasMicrophonePermission: boolean
  hasWaveSurferSupport: boolean
}

// Zod schemas for validation
export const guestInfoSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters')
})

export const recordingSchema = z.object({
  duration: z.number().min(1, 'Recording must be at least 1 second').max(900, 'Recording cannot exceed 15 minutes'),
  volume: z.number().min(0, 'Volume cannot be negative').max(1, 'Volume cannot exceed 1')
})

export type GuestInfoSchema = z.infer<typeof guestInfoSchema>
export type RecordingSchema = z.infer<typeof recordingSchema>
