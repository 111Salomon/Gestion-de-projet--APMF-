import { useState } from 'react';
import { Send, Paperclip, X } from 'lucide-react';

export const MessageInput = ({ onSend, disabled }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [file, setFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() && !file) return;

    onSend(message, file);
    setMessage('');
    setFile(null);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
      {file && (
        <div className="mb-2 flex items-center justify-between bg-gray-100 p-2 rounded">
          <span className="text-sm text-gray-700">📄 {file.name}</span>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="text-gray-500 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => document.getElementById('file-input').click()}
          className="p-2 text-gray-500 hover:text-orange-500 transition-colors"
          title="Joindre un fichier"
        >
          <Paperclip className="w-5 h-5" />
          <input
            id="file-input"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
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