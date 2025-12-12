// CommentSection.jsx - Alignement parfait des avatars
import { useState, useEffect } from 'react';
import { Send, Edit2, Trash2, MoreVertical, MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI } from '../../api/tasks';
import toast from 'react-hot-toast';

export const CommentSection = ({ taskId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [displayedComments, setDisplayedComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  // Infinite scroll states
  const [commentsPerPage] = useState(10);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    loadComments();
  }, [taskId]);

  useEffect(() => {
    if (comments.length > 0) {
      setDisplayedComments(comments.slice(0, commentsPerPage));
      setHasMore(comments.length > commentsPerPage);
    }
  }, [comments, commentsPerPage]);

  const loadComments = async () => {
    try {
      const data = await tasksAPI.getComments(taskId);
      setComments(data || []);
    } catch (error) {
      console.error('Erreur chargement commentaires:', error);
      setComments([]);
    }
  };

  const loadMoreComments = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      const currentLength = displayedComments.length;
      const nextComments = comments.slice(0, currentLength + commentsPerPage);
      setDisplayedComments(nextComments);
      setHasMore(nextComments.length < comments.length);
      setIsLoadingMore(false);
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const data = await tasksAPI.addComment(taskId, { content: newComment });
      setComments([data, ...comments]);
      setNewComment('');
      toast.success('Commentaire ajouté ! 💬');
    } catch (error) {
      console.error('❌ Erreur:', error.response?.data);
      toast.error('Impossible d\'ajouter le commentaire');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (newComment.trim()) {
        handleSubmit(e);
      }
    }
  };

  const handleEdit = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      const data = await tasksAPI.updateComment(commentId, { content: editContent });
      setComments(comments.map(c => c.id === commentId ? data : c));
      setEditingId(null);
      setEditContent('');
      toast.success('Commentaire modifié ✏️');
    } catch (error) {
      console.error('❌ Erreur:', error.response?.data);
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Supprimer ce commentaire ?')) return;

    try {
      await tasksAPI.deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Commentaire supprimé 🗑️');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)} j`;
    
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  return (
    <div className="mt-8 border-t border-neutral-200 pt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <MessageCircle className="w-4 h-4 text-neutral-600" strokeWidth={2} />
        <h3 className="text-base font-semibold text-neutral-900">
          Commentaires
        </h3>
        <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-full">
          {comments?.length || 0}
        </span>
      </div>

      {/* Formulaire */}
      <div className="mb-6">
        <div className="flex gap-3 items-start">
          <div className="flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 
                           flex items-center justify-center text-white font-semibold text-xs
                           shadow-sm">
              {getInitials(user?.username)}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 relative">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Partagez votre avis..."
              rows={1}
              className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl 
                       focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                       resize-none placeholder-neutral-400 text-neutral-900 text-sm
                       transition-all duration-200"
              style={{
                minHeight: '44px',
                maxHeight: '120px',
                height: newComment ? 'auto' : '44px'
              }}
              onInput={(e) => {
                e.target.style.height = '44px';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />

            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className={`absolute right-2 bottom-2 p-2 rounded-full
                       transition-all duration-200 flex items-center justify-center
                       ${newComment.trim() 
                         ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm hover:shadow-md hover:scale-105' 
                         : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                       }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
              ) : (
                <Send className="w-4 h-4" strokeWidth={2.5} />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Liste des commentaires */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <MessageCircle className="w-6 h-6 text-neutral-400" strokeWidth={1.5} />
            </div>
            <p className="text-neutral-600 text-sm font-medium">
              Aucun commentaire pour le moment
            </p>
            <p className="text-neutral-500 text-xs mt-0.5">
              Soyez le premier à partager votre avis !
            </p>
          </div>
        ) : (
          <>
            {displayedComments.map((comment) => {
              const isOwnComment = comment.author?.id === user?.id;
              
              return (
                <div 
                  key={comment.id} 
                  className="relative flex gap-3 items-start  group animate-in fade-in duration-200"
                >
                  {/* Barre latérale pour vos commentaires */}
                  {isOwnComment && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-200 to-orange-400 
                      rounded-full" />
                  )}

                  {/* Avatar parfaitement aligné */}
                  <div className="flex-shrink-0 ml-5">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 
                                   flex items-center justify-center  text-white font-semibold text-xs
                                   ${isOwnComment ? 'ring-1 ring-orange-200' : ''}`}>
                      {getInitials(comment.author?.username)}
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className={`flex-1 min-w-0 ${isOwnComment ? 'pl-3' : ''}`}>
                    {editingId === comment.id ? (
                      /* Mode édition */
                      <div className="bg-white rounded-xl p-3 border border-orange-300">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full bg-transparent border-none focus:outline-none resize-none 
                                   text-neutral-900 text-sm"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleEdit(comment.id)}
                            className="px-3 py-1 text-xs bg-gradient-to-r from-orange-500 to-orange-600 
                                     text-white rounded-lg hover:shadow-md transition-all font-medium"
                          >
                            Enregistrer
                          </button>
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditContent('');
                            }}
                            className="px-3 py-1 text-xs bg-neutral-100 text-neutral-700 rounded-lg 
                                     hover:bg-neutral-200 transition-colors font-medium"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Mode affichage */
                      <div className={`rounded-xl px-3 py-2.5 relative transition-all duration-150
                                    ${isOwnComment 
                                      ? 'bg-orange-50/80 hover:bg-orange-50' 
                                      : 'bg-neutral-50 hover:bg-neutral-100/80'
                                    }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="font-semibold text-neutral-900 text-sm">
                                {comment.author?.username}
                              </span>
                              
                              {isOwnComment && (
                                <span className="px-1.5 py-0.5 bg-orange-400 text-white text-[10px] 
                                               font-bold rounded uppercase tracking-wide">
                                  Vous
                                </span>
                              )}
                              
                              <span className="text-[11px] text-neutral-500">
                                • {formatTimeAgo(comment.created_at)}
                                {comment.updated_at !== comment.created_at && ' (modifié)'}
                              </span>
                            </div>

                            {/* Contenu */}
                            <p className="text-neutral-800 text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {comment.content}
                            </p>
                          </div>

                          {/* Menu actions */}
                          {isOwnComment && (
                            <div className="relative flex-shrink-0">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === comment.id ? null : comment.id)}
                                className="p-1 rounded-md hover:bg-orange-100/60 opacity-0 group-hover:opacity-100 
                                         transition-all"
                              >
                                <MoreVertical className="w-3.5 h-3.5 text-neutral-600" strokeWidth={2} />
                              </button>

                              {openMenuId === comment.id && (
                                <>
                                  <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setOpenMenuId(null)}
                                  />
                                  
                                  <div className="absolute right-0 top-7 bg-white rounded-lg shadow-lg 
                                                border border-neutral-200 py-1 z-20 min-w-[120px]
                                                animate-in fade-in slide-in-from-top-1 duration-150">
                                    <button
                                      onClick={() => {
                                        setEditingId(comment.id);
                                        setEditContent(comment.content);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-neutral-800 
                                               hover:bg-orange-50 hover:text-orange-600 transition-colors
                                               flex items-center gap-2 font-medium"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" strokeWidth={2} />
                                      Modifier
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleDelete(comment.id);
                                        setOpenMenuId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs text-red-600 
                                               hover:bg-red-50 transition-colors flex items-center gap-2
                                               font-medium"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                                      Supprimer
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Bouton "Charger plus" */}
            {hasMore && (
              <div className="flex justify-center pt-3">
                <button
                  onClick={loadMoreComments}
                  disabled={isLoadingMore}
                  className="px-4 py-2 bg-white border border-neutral-200 hover:border-neutral-300 
                           text-neutral-700 font-medium text-xs rounded-lg transition-all duration-200
                           hover:shadow-sm flex items-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />
                      <span>Chargement...</span>
                    </>
                  ) : (
                    <>
                      <span>Afficher plus</span>
                      <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] font-bold rounded">
                        {comments.length - displayedComments.length}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
