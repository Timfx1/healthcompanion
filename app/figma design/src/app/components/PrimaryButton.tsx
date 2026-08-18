/**
 * PRIMARY BUTTON COMPONENT
 *
 * PURPOSE:
 * - Reusable primary action button used throughout the app
 * - Consistent styling for main CTAs
 *
 * PROPS:
 * - children: Button text or content (ReactNode)
 * - onClick: Function to call when button is clicked
 * - className: Optional additional CSS classes
 * - disabled: Boolean to disable button (grays out, prevents clicks)
 *
 * USAGE:
 * <PrimaryButton onClick={() => navigate('/next')}>
 *   Continue
 * </PrimaryButton>
 *
 * STYLING:
 * - Full width (w-full)
 * - Blue background (#2563eb)
 * - White text
 * - Large padding (py-4)
 * - Rounded corners (rounded-xl)
 * - Slight scale-down on press (active:scale-98)
 * - 50% opacity when disabled
 * - Cursor not-allowed when disabled
 */

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function PrimaryButton({ children, onClick, className = '', disabled = false }: PrimaryButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full bg-blue-600 text-white py-4 rounded-xl transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
