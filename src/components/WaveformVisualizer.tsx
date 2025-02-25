interface WaveformVisualizerProps {
  audioBlob?: Blob
  isRecording?: boolean
  className?: string
}

export function WaveformVisualizer({
  audioBlob,
  isRecording,
  className = ''
}: WaveformVisualizerProps) {
  // Will implement Wavesurfer.js visualization in Phase 3
  return (
    <div 
      className={`
        h-24 sm:h-28 md:h-32
        bg-gray-50 
        rounded-lg 
        border-2 
        border-dashed 
        border-gray-200 
        flex 
        items-center 
        justify-center
        touch-none
        select-none
        ${className}
      `}
      role="img"
      aria-label={isRecording ? 'Audio waveform visualization' : 'Waveform placeholder'}
    >
      {/* Visual placeholder for waveform - will be replaced with Wavesurfer.js */}
      <div className="flex items-end justify-center space-x-0.5 w-full px-4 h-full">
        {Array.from({ length: 50 }).map((_, i) => {
          const height = isRecording
            ? Math.random() * 100
            : audioBlob
            ? 50 + Math.sin(i * 0.2) * 30
            : 20

          return (
            <div
              key={i}
              className={`
                w-0.5 rounded-t
                transition-all duration-75
                ${isRecording ? 'bg-red-500' : audioBlob ? 'bg-blue-500' : 'bg-gray-300'}
              `}
              style={{
                height: `${height}%`
              }}
            />
          )
        })}
      </div>

      {/* Status text for empty/loading states */}
      {!isRecording && !audioBlob && (
        <p className="absolute text-gray-500 text-sm sm:text-base">
          Ready to record
        </p>
      )}
    </div>
  )
}
