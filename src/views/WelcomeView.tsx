import React from 'react';
import { WelcomeForm } from '../components/WelcomeForm';

/**
 * Props for the WelcomeView component
 * @interface WelcomeViewProps
 * @property {(guestInfo: { name: string }) => void} onSubmit - Callback fired when guest info is submitted
 */
interface WelcomeViewProps {
  onSubmit: (guestInfo: { name: string }) => void;
}

/**
 * Welcome view component for collecting initial guest information.
 * 
 * This component serves as the entry point of the wedding message recording workflow,
 * collecting guest information before proceeding to recording. It's a pure refactor
 * from App.tsx welcome state.
 * 
 * Component Flow:
 * 1. Displays welcome form interface
 * 2. Collects guest name
 * 3. Triggers submission callback
 * 
 * @component
 * @param {WelcomeViewProps} props - Component props
 * @returns {React.ReactElement} Welcome interface
 * 
 * Technical Architecture:
 * - Implements view layer of welcome state
 * - Uses WelcomeForm component for data collection
 * - Pure presentational component (logic handled by parent)
 */
export function WelcomeView({ onSubmit }: WelcomeViewProps): React.ReactElement {
  return <WelcomeForm onSubmit={onSubmit} />;
}
