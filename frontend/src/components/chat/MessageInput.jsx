import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Send, Paperclip, X } from 'lucide-react';

export const MessageInput = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const filePreviewUrl = useMemo(() => {
    if (!file) return null;
    if (!file.type?.startsWith?.('image/')) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    const k = 1024;
    if (bytes < k) return `${bytes} B`;
    if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
    return `${(bytes / (k * k)).toFixed(1)} MB`;
  };

  const isAllowedFile = (candidate) => {
    if (!candidate) return false;
    const maxSize = 10 * 1024 * 1024;
    if (candidate.size > maxSize) {
      toast.error('Le fichier ne doit pas dépasser 10 MB');
      return false;
    }

    const name = candidate.name || '';
    const ext = name.split('.').pop()?.toLowerCase?.() ?? '';
    const allowedExt = new Set([
      'jpg', 'jpeg', 'png', 'gif', 'webp',
      'pdf',
      'doc', 'docx',
      'xls', 'xlsx',
    ]);

    if (!allowedExt.has(ext)) {
      toast.error('Type de fichier non supporté (images, PDF, Word, Excel)');
      return false;
    }
    return true;
  };

  const acceptFile = (candidate) => {
    if (!isAllowedFile(candidate)) return;
    setFile(candidate);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() && !file) return;

    onSend(message, file);
    setMessage('');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      acceptFile(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(false);
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) {
      acceptFile(dropped);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 p-4"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && !disabled && (
        <div className="mb-3 rounded-lg border-2 border-dashed border-orange-400 bg-orange-50 px-4 py-3 text-sm text-orange-700">
          Déposez votre fichier ici pour l'ajouter
        </div>
      )}

      {file && (
        <div className="mb-2 flex items-center justify-between bg-gray-100 p-2 rounded gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {filePreviewUrl ? (
              <img
                src={filePreviewUrl}
                alt={file.name}
                className="w-10 h-10 rounded object-cover flex-shrink-0"
              />
            ) : (
              <span className="flex-shrink-0">📄</span>
            )}
            <div className="min-w-0">
              <div className="text-sm text-gray-700 truncate">
                {file.name}
              </div>
              <div className="text-xs text-gray-500">
                {formatFileSize(file.size)}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="text-gray-500 hover:text-red-500 flex-shrink-0"
            title="Retirer le fichier"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-gray-500 hover:text-orange-500 transition-colors"
          title="Joindre un fichier"
          disabled={disabled}
        >
          <Paperclip className="w-5 h-5" />
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            disabled={disabled}
          />
        </button>

        <input
          type="text"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setIsTyping(e.target.value.length > 0);
          }}
          placeholder="Tapez un message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          disabled={disabled}
        />

        <button
          type="submit"
          disabled={disabled || (!message.trim() && !file)}
          className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Envoyer"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};