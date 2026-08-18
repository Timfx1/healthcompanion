interface SecondaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function SecondaryButton({ children, onClick, className = '' }: SecondaryButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full border-2 border-gray-300 text-gray-700 py-4 rounded-xl transition-all active:scale-98 ${className}`}
    >
      {children}
    </button>
  );
}
