import { Users, X } from 'lucide-react';

export const ChatHeader = ({ room, onClose }) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
          <span className="text-white font-semibold text-lg">
            {room.name?.charAt(0) || room.type.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">
            {room.name || room.get_type_display}
          </h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Users className="w-3 h-3" />
            <span>{room.participant_count} participants</span>
          </div>
        </div>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};