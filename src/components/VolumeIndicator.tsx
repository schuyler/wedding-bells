/**
 * Props interface for the VolumeIndicator component.
 * 
 * Provides a simple, focused API for displaying audio volume visualization.
 * 
 * @property volume - Current audio volume level normalized between 0 and 1
 * @property size - Visual size variant for different UI contexts
 * @property className - Optional CSS class names for styling customization
 */
interface VolumeIndicatorProps {
  volume: number // 0 to 1
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/**
 * Audio volume level visualization component.
 * 
 * This component provides a visual representation of microphone input volume
 * using a multi-bar indicator with color gradients based on volume intensity.
 * It serves as real-time feedback during recording to help users ensure their
 * audio is being properly captured.
 * 
 * Design approach:
 * - Uses a series of vertical bars with increasing heights
 * - Provides visual feedback through color changes at different thresholds
 * - Implements smooth transitions for level changes
 * - Supports multiple size variants for different UI contexts
 * - Follows accessibility best practices with ARIA attributes
 * 
 * Color coding logic:
 * - Green bars for normal speaking levels
 * - Yellow bars for elevated volume (approaching too loud)
 * - Red bars for possible distortion/clipping
 * 
 * Opportunities for Improvement:
 * - Could add haptic feedback on mobile devices for accessibility
 * - Animation smoothing could be refined for more natural level changes
 * - Could implement peak hold indicator for maximum levels
 */
export function VolumeIndicator({
  volume,
  size = 'md',
  className = ''
}: VolumeIndicatorProps) {
  // Configure the visualization with 10 bars
  const bars = 10
  // Calculate how many bars should be active based on current volume
  const activeBarCount = Math.floor(volume * bars)
  
  // Map size prop to appropriate height classes
  const sizeClasses = {
    sm: 'h-12',
    md: 'h-16',
    lg: 'h-20'
  }

  /**
   * Determines the appropriate color for each volume bar.
   * 
   * Color logic:
   * - Inactive bars are gray
   * - First 7 bars (normal speech) are green
   * - Next 2 bars (louder speech) are yellow
   * - Final bar (potential clipping) is red
   * 
   * @param index - The bar index (0-9)
   * @returns CSS class name for bar color
   */
  const getBarColor = (index: number) => {
    const isActive = index < activeBarCount
    if (!isActive) return 'bg-gray-200'

    // Colors: green up to 7th bar, yellow for 8th and 9th, red for 10th
    if (index < bars - 3) return 'bg-green-500'
    if (index < bars - 1) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div
      className={`flex items-end justify-center space-x-1 ${sizeClasses[size]} ${className}`}
      role="meter"
      aria-valuenow={Math.round(volume * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Audio volume level"
    >
      {/* Generate the series of volume bars */}
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 transition-all duration-100 rounded-t ${getBarColor(i)}`}
          style={{
            // Each bar has progressively greater height, proportional to its position
            height: `${((i + 1) / bars * 100)}%`,
            // Active bars are fully opaque, inactive are semi-transparent
            opacity: i < activeBarCount ? '1' : '0.5'
          }}
        />
      ))}
    </div>
  )
}