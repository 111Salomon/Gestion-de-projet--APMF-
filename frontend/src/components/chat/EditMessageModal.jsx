import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { X } from 'lucide-react';

export const EditMessageModal = ({ isOpen, onClose, message, onSave }) => {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (isOpen && message) {
      setContent(message.content || '');
    }
  }, [isOpen, message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSave(message.id, content.trim());
      onClose();
    }
  };

  if (!message) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Éditer le message">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent min-h-[100px]"
            placeholder="Éditez votre message..."
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            {content.length}/500 caractères
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!content.trim() || content.trim() === message.content}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );
};