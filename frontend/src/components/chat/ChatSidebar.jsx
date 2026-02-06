import { MessageSquare, Users, Plus, Search } from 'lucide-react';
import { Avatar } from '../common/Avatar';



export const ChatSidebar = ({ rooms, onSelectRoom, currentRoom, onCreateRoom }) => {

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



      <div className="flex-1 overflow-y-auto overflow-x-hidden">

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

                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${

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



                  {room.unread_count > 0 && (

                    <div className="flex-shrink-0">

                      <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">

                        {room.unread_count}

                      </span>

                    </div>

                  )}

                </div>

              </button>

            ))}

          </div>

        )}

      </div>

    </div>

  );

};