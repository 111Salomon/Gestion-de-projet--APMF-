import { MessageSquare, Users, Plus, Search, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Avatar } from '../common/Avatar';
import { ConfirmModal } from '../common/ConfirmModal';



export const ChatSidebar = ({ rooms, onSelectRoom, currentRoom, onCreateRoom, onDeleteRoom }) => {
  const [openMenuRoomId, setOpenMenuRoomId] = useState(null);
  const [confirmRoomId, setConfirmRoomId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openMenuUp, setOpenMenuUp] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const listRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!openMenuRoomId) return;
    const handleOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuRoomId(null);
        setMenuPos(null);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [openMenuRoomId]);

  const handleConfirmDelete = async () => {
    if (!onDeleteRoom || !confirmRoomId) return;
    setIsDeleting(true);
    try {
      await onDeleteRoom(confirmRoomId);
      setConfirmRoomId(null);
      setOpenMenuRoomId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (

    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full min-w-0 overflow-x-hidden">

      <div className="p-4 border-b border-gray-200">

        <div className="flex items-center justify-between mb-4">

          <h2 className="font-semibold text-gray-900 flex items-center gap-2">

            <MessageSquare className="w-5 h-5 text-orange-500" />

            Conversations

          </h2>

          <button

            onClick={onCreateRoom}

            className="p-1 text-gray-500 hover:text-orange-500 transition-colors"

            title="Nouvelle conversation"

          >

            <Plus className="w-5 h-5" />

          </button>

        </div>



        <div className="relative">

          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />

          <input

            type="text"

            placeholder="Rechercher..."

            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"

          />

        </div>

      </div>



      <div ref={listRef} className="flex-1 overflow-y-auto overflow-x-hidden">

        {rooms.length === 0 ? (

          <div className="p-6 text-center text-gray-500">

            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />

            <p>Aucune conversation</p>

            <button

              onClick={onCreateRoom}

              className="mt-2 text-sm text-orange-500 hover:text-orange-600"

            >

              Commencer une conversation

            </button>

          </div>

        ) : (

          <div className="divide-y divide-gray-100 overflow-x-hidden">

            {rooms.map((room) => (

              <button

                key={room.id}

                onClick={() => onSelectRoom(room)}

                className={`group relative w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${

                  currentRoom?.id === room.id ? 'bg-orange-50' : ''

                }`}

              >

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3 min-w-0">

                    <div className="flex-shrink-0">
                      {room.other_user ? (
                        <Avatar
                          avatarUrl={room.other_user.avatar_url}
                          name={room.other_user.full_name || room.other_user.username}
                          size="md"
                          showBorder={false}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold">
                            {room.name?.charAt(0) || room.type.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">

                      <div className="font-semibold text-gray-900 truncate">
                        {room.other_user ? (room.other_user.full_name || room.other_user.username) : (room.name || room.type)}
                      </div>

                      {room.last_message_preview && (

                        <div className="text-xs text-gray-500 truncate">

                          {room.last_message_preview.sender}: {room.last_message_preview.content}

                        </div>

                      )}

                    </div>

                  </div>



                  <div className="flex items-center gap-2">
                    {room.unread_count > 0 && (
                      <div className="flex-shrink-0">
                        <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                          {room.unread_count}
                        </span>
                      </div>
                    )}

                    {/* Trois points visible au hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const shouldOpen = openMenuRoomId === room.id ? null : room.id;
                        try {
                          const btnRect = e.currentTarget.getBoundingClientRect();
                          const menuHeight = 88; // estimate
                          const spaceBelow = window.innerHeight - btnRect.bottom;
                          const openUpNow = spaceBelow < menuHeight;

                          // compute horizontal position: align menu right to button right
                          const menuWidth = 200;
                          const left = Math.max(8, btnRect.right - menuWidth);
                          const top = openUpNow ? btnRect.top - menuHeight : btnRect.bottom;

                          setOpenMenuUp(openUpNow);
                          setMenuPos({ top, left, width: menuWidth });
                        } catch (err) {
                          setOpenMenuUp(false);
                          setMenuPos(null);
                        }
                        setOpenMenuRoomId(shouldOpen);
                      }}
                      className="invisible group-hover:visible p-1 text-gray-500 hover:text-gray-700 transition-colors rounded"
                      title="Plus d'options"
                    >
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>

                </div>

                {openMenuRoomId === room.id && menuPos && createPortal(
                  <div
                    ref={menuRef}
                    style={{
                      position: 'fixed',
                      top: menuPos.top,
                      left: menuPos.left,
                      width: menuPos.width,
                    }}
                  >
                    <div className="bg-white border border-gray-200 rounded shadow-sm">
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmRoomId(room.id); setOpenMenuRoomId(null); setMenuPos(null); }}
                        className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded whitespace-nowrap"
                        title="Supprimer la conversation"
                      >
                        Supprimer la conversation
                      </button>
                    </div>
                  </div>,
                  document.body
                )}

              </button>

            ))}

            {/* Modal global de confirmation */}
            <ConfirmModal
              isOpen={confirmRoomId !== null}
              onClose={() => setConfirmRoomId(null)}
              onConfirm={handleConfirmDelete}
              title="Supprimer la conversation"
              message="Cette action supprimera la conversation pour tous les participants. Confirmez-vous ?"
              confirmText="Supprimer"
              cancelText="Annuler"
              isLoading={isDeleting}
            />

          </div>

        )}

      </div>

    </div>

  );

};