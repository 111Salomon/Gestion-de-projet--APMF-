export const TypingIndicator = ({ users = [] }) => {
  if (!users.length) return null;

  const label =
    users.length === 1
      ? `${users[0]} écrit...`
      : `${users.slice(0, 2).join(', ')}${users.length > 2 ? '...' : ''} écrivent...`;

  return (
    <div className="text-sm text-gray-500 italic animate-pulse px-2">
      {label}
    </div>
  );
};
