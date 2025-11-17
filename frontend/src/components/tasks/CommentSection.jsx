import { useState, useEffect } from 'react';
import { Send, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { tasksAPI } from '../../api/tasks';
import toast from 'react-hot-toast';

/**
 * Section de commentaires style réseaux sociaux
 * Design inspiré de Facebook/LinkedIn
 */
export const CommentSection = ({ taskId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);

  // Charger les commentaires au montage
  useEffect(() => {
    loadComments();
  }, [taskId]);

const loadComments = async () => {
  try {
    const data = await tasksAPI.getComments(taskId);
    setComments(data || []);  // ✅ Simplifié
  } catch (error) {
    console.error('Erreur chargement commentaires:', error);
    setComments([]);
  }
};


  // Ajouter un commentaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await tasksAPI.addComment(taskId, { content: newComment });
      setComments([response.data, ...comments]);
      setNewComment('');
      toast.success('Commentaire ajouté');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Modifier un commentaire
  const handleEdit = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      const response = await tasksAPI.updateComment(commentId, { content: editContent });
      setComments(comments.map(c => c.id === commentId ? response.data : c));
      setEditingId(null);
      setEditContent('');
      toast.success('Commentaire modifié');
    } catch (error) {
      toast.error('Erreur lors de la modification');
    }
  };

  // Supprimer un commentaire
  const handleDelete = async (commentId) => {
    if (!confirm('Supprimer ce commentaire ?')) return;

    try {
      await tasksAPI.deleteComment(commentId);
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Commentaire supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  // Formater la date "Il y a X temps"
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

  // Générer les initiales pour l'avatar
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
      {/* Titre de la section */}
{/* ✅ BON - Vérifie que comments existe avant d'accéder à .length */}
<h3 className="text-lg font-semibold text-neutral-900 mb-4">
  Commentaires ({comments?.length || 0})
</h3>


      {/* Formulaire d'ajout de commentaire - Style réseaux sociaux */}
      <div className="flex gap-3 mb-6">
        {/* Avatar de l'utilisateur */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
            {getInitials(user?.username)}
          </div>
        </div>

        {/* Zone de texte */}
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="relative">
<textarea
  value={newComment}
  onChange={(e) => setNewComment(e.target.value)}
  placeholder="Ajoutez un commentaire..."
  rows={1}
  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl 
           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
           resize-none placeholder-neutral-400 text-neutral-900 transition-all
           scrollbar-hide overflow-y-auto"
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


            {/* Bouton d'envoi */}
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="absolute right-2 bottom-2 p-2 rounded-full
                       bg-primary-600 text-white disabled:bg-neutral-300 disabled:cursor-not-allowed
                       hover:bg-primary-700 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Liste des commentaires */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-neutral-500 py-8">
            Aucun commentaire pour le moment. Soyez le premier à commenter !
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-neutral-300 flex items-center justify-center text-neutral-700 font-medium text-sm">
                  {getInitials(comment.author?.username)}
                </div>
              </div>

              {/* Contenu du commentaire */}
              <div className="flex-1 min-w-0">
                {editingId === comment.id ? (
                  /* Mode édition */
                  <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-transparent border-none focus:outline-none resize-none text-neutral-900"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleEdit(comment.id)}
                        className="px-3 py-1 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditContent('');
                        }}
                        className="px-3 py-1 text-sm bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Mode affichage */
                  <div className="bg-neutral-50 rounded-2xl px-4 py-3 relative">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-neutral-900 text-sm">
                          {comment.author?.username}
                        </p>
                        <p className="text-neutral-700 mt-1 whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                      </div>

                      {/* Menu actions (visible au hover si c'est son commentaire) */}
                      {comment.author?.id === user?.id && (
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === comment.id ? null : comment.id)}
                            className="p-1 rounded-lg hover:bg-neutral-200 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4 text-neutral-600" />
                          </button>

                          {openMenuId === comment.id && (
                            <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10 min-w-[120px]">
                              <button
                                onClick={() => {
                                  setEditingId(comment.id);
                                  setEditContent(comment.content);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" />
                                Modifier
                              </button>
                              <button
                                onClick={() => {
                                  handleDelete(comment.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <p className="text-xs text-neutral-500 mt-2">
                      {formatTimeAgo(comment.created_at)}
                      {comment.updated_at !== comment.created_at && ' (modifié)'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
