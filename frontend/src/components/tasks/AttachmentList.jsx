import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  File, 
  Download, 
  Trash2,
  FileType,
  FileSpreadsheet,
  FileVideo,
  FileArchive,
  Paperclip,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import { getTaskAttachments, deleteAttachment } from '../../api/attachments';
import { ConfirmModal } from '../common/ConfirmModal';
import toast from 'react-hot-toast';

const AttachmentList = ({ taskId, refresh }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ 
    isOpen: false, 
    attachment: null 
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [filterType, setFilterType] = useState('all'); // all, images, documents, others
  const [documentSubFilter, setDocumentSubFilter] = useState('all'); // all, pdf, word, excel, powerpoint, text
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const DISPLAY_LIMIT = 9;
  const filterRef = useRef(null);

  // Charger les attachments
  useEffect(() => {
    loadAttachments();
  }, [taskId, refresh]);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Réinitialiser le sous-filtre quand on change de catégorie principale
  useEffect(() => {
    if (filterType !== 'documents') {
      setDocumentSubFilter('all');
    }
  }, [filterType]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const data = await getTaskAttachments(taskId);
      
      if (Array.isArray(data)) {
        setAttachments(data);
      } else if (data && Array.isArray(data.results)) {
        setAttachments(data.results);
      } else if (data && data.data && Array.isArray(data.data)) {
        setAttachments(data.data);
      } else {
        console.warn('Format de données inattendu:', data);
        setAttachments([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des attachments:', error);
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAttachment(deleteModal.attachment.id);
      setAttachments(prev => prev.filter(a => a.id !== deleteModal.attachment.id));
      setDeleteModal({ isOpen: false, attachment: null });
      toast.success('Fichier supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Impossible de supprimer le fichier');
    }
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Calculer la taille totale
  const totalSize = useMemo(() => {
    return attachments.reduce((acc, att) => acc + (att.file_size || 0), 0);
  }, [attachments]);

  // Obtenir le type de fichier
  const getFileType = (fileName, isImage) => {
    if (isImage) return 'image';
    const ext = fileName.split('.').pop().toLowerCase();
    const documentExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    return documentExts.includes(ext) ? 'document' : 'other';
  };

  // Obtenir le type de document spécifique
  const getDocumentType = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    
    const types = {
      pdf: 'pdf',
      doc: 'word',
      docx: 'word',
      xls: 'excel',
      xlsx: 'excel',
      ppt: 'powerpoint',
      pptx: 'powerpoint',
      txt: 'text',
    };
    
    return types[ext] || 'other';
  };

  // Compter par type
  const counts = useMemo(() => {
    const images = attachments.filter(a => getFileType(a.file_name, a.is_image) === 'image').length;
    const documents = attachments.filter(a => getFileType(a.file_name, a.is_image) === 'document').length;
    const others = attachments.length - images - documents;
    return { images, documents, others };
  }, [attachments]);

  // Compter les types de documents
  const documentTypeCounts = useMemo(() => {
    const docs = attachments.filter(a => getFileType(a.file_name, a.is_image) === 'document');
    
    return {
      pdf: docs.filter(d => getDocumentType(d.file_name) === 'pdf').length,
      word: docs.filter(d => getDocumentType(d.file_name) === 'word').length,
      excel: docs.filter(d => getDocumentType(d.file_name) === 'excel').length,
      powerpoint: docs.filter(d => getDocumentType(d.file_name) === 'powerpoint').length,
      text: docs.filter(d => getDocumentType(d.file_name) === 'text').length,
    };
  }, [attachments]);

  // Filtrer les attachments avec sous-filtre documents
  const filteredAttachments = useMemo(() => {
    let filtered = attachments;
    
    // Premier niveau de filtre
    if (filterType !== 'all') {
      filtered = filtered.filter(att => {
        const type = getFileType(att.file_name, att.is_image);
        if (filterType === 'images') return type === 'image';
        if (filterType === 'documents') return type === 'document';
        if (filterType === 'others') return type === 'other';
        return true;
      });
    }
    
    // Second niveau : sous-filtre pour documents
    if (filterType === 'documents' && documentSubFilter !== 'all') {
      filtered = filtered.filter(att => {
        const docType = getDocumentType(att.file_name);
        return docType === documentSubFilter;
      });
    }
    
    return filtered;
  }, [attachments, filterType, documentSubFilter]);

  // Attachments à afficher
  const displayedAttachments = showAll 
    ? filteredAttachments 
    : filteredAttachments.slice(0, DISPLAY_LIMIT);

  // Navigation galerie d'images
  const imageAttachments = attachments.filter(a => a.is_image);
  const currentImageIndex = imagePreview ? imageAttachments.findIndex(a => a.id === imagePreview.id) : -1;

  const goToPreviousImage = () => {
    if (currentImageIndex > 0) {
      setImagePreview(imageAttachments[currentImageIndex - 1]);
    }
  };

  const goToNextImage = () => {
    if (currentImageIndex < imageAttachments.length - 1) {
      setImagePreview(imageAttachments[currentImageIndex + 1]);
    }
  };

  // Support clavier pour la galerie
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!imagePreview) return;
      if (e.key === 'ArrowLeft') goToPreviousImage();
      if (e.key === 'ArrowRight') goToNextImage();
      if (e.key === 'Escape') setImagePreview(null);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [imagePreview, currentImageIndex]);

  // Obtenir l'icône et la couleur selon le type de fichier
  const getFileConfig = (fileName, isImage) => {
    if (isImage) {
      return {
        icon: ImageIcon,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        hoverBorder: 'hover:border-blue-300',
      };
    }

    const ext = fileName.split('.').pop().toLowerCase();
    
    const configs = {
      pdf: {
        icon: FileText,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        hoverBorder: 'hover:border-red-300',
      },
      doc: {
        icon: FileType,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        hoverBorder: 'hover:border-blue-300',
      },
      docx: {
        icon: FileType,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        hoverBorder: 'hover:border-blue-300',
      },
      xls: {
        icon: FileSpreadsheet,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        hoverBorder: 'hover:border-green-300',
      },
      xlsx: {
        icon: FileSpreadsheet,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        hoverBorder: 'hover:border-green-300',
      },
      ppt: {
        icon: FileArchive,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        hoverBorder: 'hover:border-orange-300',
      },
      pptx: {
        icon: FileArchive,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        hoverBorder: 'hover:border-orange-300',
      },
      mp4: {
        icon: FileVideo,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        hoverBorder: 'hover:border-purple-300',
      },
      zip: {
        icon: FileArchive,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        hoverBorder: 'hover:border-amber-300',
      },
      rar: {
        icon: FileArchive,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        hoverBorder: 'hover:border-amber-300',
      },
    };

    return configs[ext] || {
      icon: File,
      color: 'text-neutral-600',
      bgColor: 'bg-neutral-50',
      borderColor: 'border-neutral-200',
      hoverBorder: 'hover:border-neutral-300',
    };
  };

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-neutral-500 text-sm font-medium">Chargement des fichiers...</p>
      </div>
    );
  }

  // État vide
  if (attachments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Paperclip className="w-8 h-8 text-neutral-400" />
        </div>
        <p className="text-neutral-600 font-medium mb-1">Aucune pièce jointe</p>
        <p className="text-neutral-400 text-sm">Les fichiers apparaîtront ici une fois ajoutés</p>
      </div>
    );
  }

  const hasMore = filteredAttachments.length > DISPLAY_LIMIT;
  const remainingCount = filteredAttachments.length - DISPLAY_LIMIT;

  return (
    <>
      {/* Header avec stats et filtre dropdown */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        {/* Gauche : Stats */}
        <div className="flex items-center gap-2 text-sm">
          <div className="px-3 py-1.5 bg-neutral-100 rounded-lg">
            <span className="font-semibold text-neutral-900">{attachments.length}</span>
            <span className="text-neutral-600 ml-1">fichier{attachments.length > 1 ? 's' : ''}</span>
          </div>
          <div className="px-3 py-1.5 bg-neutral-100 rounded-lg">
            <span className="font-semibold text-neutral-900">{formatFileSize(totalSize)}</span>
            <span className="text-neutral-600 ml-1">total</span>
          </div>
        </div>

        {/* Droite : Dropdown de filtrage */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-3 py-2 
                     bg-white border border-neutral-200 rounded-lg
                     hover:border-neutral-300 hover:bg-neutral-50
                     transition-all duration-200 text-sm font-medium
                     text-neutral-700"
          >
            <Filter className="w-4 h-4 text-neutral-400" strokeWidth={2} />
            <span>
              {filterType === 'all' && 'Tous les fichiers'}
              {filterType === 'images' && `Images (${counts.images})`}
              {filterType === 'documents' && `Documents (${counts.documents})`}
              {filterType === 'others' && `Autres (${counts.others})`}
            </span>
            <ChevronDown 
              className={`w-4 h-4 text-neutral-400 transition-transform duration-200 
                        ${isFilterOpen ? 'rotate-180' : ''}`}
              strokeWidth={2} 
            />
          </button>

          {/* Dropdown menu */}
          {isFilterOpen && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setIsFilterOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 
                            bg-white rounded-xl border border-neutral-200
                            shadow-lg shadow-black/5
                            z-50 overflow-hidden py-1
                            animate-in fade-in slide-in-from-top-2 duration-150">
                
                {/* En-tête */}
                <div className="px-3 py-2 border-b border-neutral-100">
                  <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Filtrer par type
                  </span>
                </div>

                {/* Option : Tous */}
                <button
                  onClick={() => {
                    setFilterType('all');
                    setIsFilterOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5
                           transition-all duration-150 text-left
                           ${filterType === 'all' 
                             ? 'bg-orange-50 text-orange-900' 
                             : 'text-neutral-700 hover:bg-neutral-50'
                           }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full transition-colors
                                 ${filterType === 'all' ? 'bg-orange-500' : 'bg-neutral-300'}`} />
                    <span className="text-sm font-medium">Tous les fichiers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                   ${filterType === 'all' 
                                     ? 'bg-orange-100 text-orange-700' 
                                     : 'bg-neutral-100 text-neutral-600'
                                   }`}>
                      {attachments.length}
                    </span>
                    {filterType === 'all' && (
                      <Check className="w-4 h-4 text-orange-600" strokeWidth={2.5} />
                    )}
                  </div>
                </button>

                {/* Option : Images */}
                {counts.images > 0 && (
                  <button
                    onClick={() => {
                      setFilterType('images');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5
                             transition-all duration-150 text-left
                             ${filterType === 'images' 
                               ? 'bg-blue-50 text-blue-900' 
                               : 'text-neutral-700 hover:bg-neutral-50'
                             }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <ImageIcon className={`w-4 h-4 transition-colors
                                          ${filterType === 'images' ? 'text-blue-600' : 'text-neutral-400'}`} 
                                 strokeWidth={2} />
                      <span className="text-sm font-medium">Images</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                     ${filterType === 'images' 
                                       ? 'bg-blue-100 text-blue-700' 
                                       : 'bg-neutral-100 text-neutral-600'
                                     }`}>
                        {counts.images}
                      </span>
                      {filterType === 'images' && (
                        <Check className="w-4 h-4 text-blue-600" strokeWidth={2.5} />
                      )}
                    </div>
                  </button>
                )}

                {/* Option : Documents */}
                {counts.documents > 0 && (
                  <button
                    onClick={() => {
                      setFilterType('documents');
                      setDocumentSubFilter('all');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5
                             transition-all duration-150 text-left
                             ${filterType === 'documents' 
                               ? 'bg-green-50 text-green-900' 
                               : 'text-neutral-700 hover:bg-neutral-50'
                             }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className={`w-4 h-4 transition-colors
                                         ${filterType === 'documents' ? 'text-green-600' : 'text-neutral-400'}`} 
                                strokeWidth={2} />
                      <span className="text-sm font-medium">Documents</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                     ${filterType === 'documents' 
                                       ? 'bg-green-100 text-green-700' 
                                       : 'bg-neutral-100 text-neutral-600'
                                     }`}>
                        {counts.documents}
                      </span>
                      {filterType === 'documents' && (
                        <Check className="w-4 h-4 text-green-600" strokeWidth={2.5} />
                      )}
                    </div>
                  </button>
                )}

                {/* Option : Autres */}
                {counts.others > 0 && (
                  <button
                    onClick={() => {
                      setFilterType('others');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5
                             transition-all duration-150 text-left
                             ${filterType === 'others' 
                               ? 'bg-purple-50 text-purple-900' 
                               : 'text-neutral-700 hover:bg-neutral-50'
                             }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <File className={`w-4 h-4 transition-colors
                                     ${filterType === 'others' ? 'text-purple-600' : 'text-neutral-400'}`} 
                            strokeWidth={2} />
                      <span className="text-sm font-medium">Autres</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                                     ${filterType === 'others' 
                                       ? 'bg-purple-100 text-purple-700' 
                                       : 'bg-neutral-100 text-neutral-600'
                                     }`}>
                        {counts.others}
                      </span>
                      {filterType === 'others' && (
                        <Check className="w-4 h-4 text-purple-600" strokeWidth={2.5} />
                      )}
                    </div>
                  </button>
                )}

                {/* Footer : Reset si filtre actif */}
                {filterType !== 'all' && (
                  <>
                    <div className="h-px bg-neutral-100 my-1" />
                    <button
                      onClick={() => {
                        setFilterType('all');
                        setIsFilterOpen(false);
                      }}
                      className="w-full px-3 py-2 text-xs font-medium text-neutral-500
                               hover:text-neutral-900 hover:bg-neutral-50
                               transition-all duration-150 text-center"
                    >
                      Réinitialiser le filtre
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pills de sous-filtrage pour Documents */}
      {filterType === 'documents' && counts.documents > 0 && (
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-neutral-100 flex-wrap">
          <span className="text-xs font-medium text-neutral-500 mr-2">Type de document :</span>
          
          <button
            onClick={() => setDocumentSubFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              documentSubFilter === 'all'
                ? 'bg-green-500 text-white shadow-sm'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            Tous ({counts.documents})
          </button>

          {documentTypeCounts.pdf > 0 && (
            <button
              onClick={() => setDocumentSubFilter('pdf')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                documentSubFilter === 'pdf'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              PDF ({documentTypeCounts.pdf})
            </button>
          )}

          {documentTypeCounts.word > 0 && (
            <button
              onClick={() => setDocumentSubFilter('word')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                documentSubFilter === 'word'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Word ({documentTypeCounts.word})
            </button>
          )}

          {documentTypeCounts.excel > 0 && (
            <button
              onClick={() => setDocumentSubFilter('excel')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                documentSubFilter === 'excel'
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Excel ({documentTypeCounts.excel})
            </button>
          )}

          {documentTypeCounts.powerpoint > 0 && (
            <button
              onClick={() => setDocumentSubFilter('powerpoint')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                documentSubFilter === 'powerpoint'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              PowerPoint ({documentTypeCounts.powerpoint})
            </button>
          )}

          {documentTypeCounts.text > 0 && (
            <button
              onClick={() => setDocumentSubFilter('text')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                documentSubFilter === 'text'
                  ? 'bg-neutral-600 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Texte ({documentTypeCounts.text})
            </button>
          )}
        </div>
      )}

      {/* Grid des fichiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedAttachments.map((attachment, index) => {
          const config = getFileConfig(attachment.file_name, attachment.is_image);
          const Icon = config.icon;

          return (
            <div
              key={attachment.id}
              className={`group relative bg-white rounded-xl border ${config.borderColor} 
                        ${config.hoverBorder} hover:shadow-md
                        transition-all duration-300 overflow-hidden`}
              style={{
                animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both`
              }}
            >
              {/* Preview pour les images */}
              {attachment.is_image ? (
                <div 
                  className="relative h-32 bg-neutral-100 cursor-pointer overflow-hidden"
                  onClick={() => setImagePreview(attachment)}
                >
                  <img
                    src={attachment.file}
                    alt={attachment.file_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ) : (
                <div className={`h-32 ${config.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-12 h-12 ${config.color} group-hover:scale-110 transition-transform duration-300`} strokeWidth={1.5} />
                </div>
              )}

              {/* Informations */}
              <div className="p-4">
                <a
                  href={attachment.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm font-semibold text-neutral-900 hover:text-orange-600 
                           transition-colors truncate mb-1 group-hover:text-orange-600"
                  title={attachment.file_name}
                >
                  {attachment.file_name}
                </a>
                <p className="text-xs text-neutral-500 font-medium">
                  {formatFileSize(attachment.file_size)}
                </p>
              </div>

              {/* Actions */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={attachment.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg border border-neutral-200
                          hover:bg-green-50 hover:border-green-300 hover:text-green-600
                          transition-all duration-200 shadow-sm"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <Download className="w-4 h-4" strokeWidth={2} />
                </a>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteModal({ isOpen: true, attachment });
                  }}
                  className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg border border-neutral-200
                          hover:bg-red-50 hover:border-red-300 hover:text-red-600
                          transition-all duration-200 shadow-sm"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bouton "Voir plus/moins" */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-6 py-3 px-4 
                   border-2 border-neutral-200 text-neutral-700 
                   font-medium text-sm rounded-xl
                   hover:border-neutral-300 hover:bg-neutral-50
                   transition-all duration-200
                   flex items-center justify-center gap-2"
        >
          {showAll ? (
            <>
              <ChevronDown className="w-4 h-4 rotate-180 transition-transform" strokeWidth={2.5} />
              <span>Voir moins</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 transition-transform" strokeWidth={2.5} />
              <span>Voir {remainingCount} autre{remainingCount > 1 ? 's' : ''} fichier{remainingCount > 1 ? 's' : ''}</span>
            </>
          )}
        </button>
      )}

      {/* Modal Preview Image avec navigation */}
      {imagePreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setImagePreview(null)}
        >
          {/* Bouton Close */}
          <button
            onClick={() => setImagePreview(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full
                     text-white transition-all duration-200 z-10"
          >
            <X className="w-6 h-6" strokeWidth={2} />
          </button>

          {/* Navigation Précédent */}
          {currentImageIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPreviousImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 
                       bg-white/10 hover:bg-white/20 rounded-full
                       text-white transition-all duration-200 z-10"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
            </button>
          )}

          {/* Navigation Suivant */}
          {currentImageIndex < imageAttachments.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 
                       bg-white/10 hover:bg-white/20 rounded-full
                       text-white transition-all duration-200 z-10"
            >
              <ChevronRight className="w-6 h-6" strokeWidth={2.5} />
            </button>
          )}
          
          {/* Image */}
          <img
            src={imagePreview.file}
            alt={imagePreview.file_name}
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Info footer */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 
                        bg-white/10 backdrop-blur-md px-4 py-2 rounded-full 
                        text-white text-sm font-medium flex items-center gap-3">
            <span>{imagePreview.file_name}</span>
            {imageAttachments.length > 1 && (
              <>
                <span className="text-white/50">•</span>
                <span className="text-white/80">
                  {currentImageIndex + 1} / {imageAttachments.length}
                </span>
              </>
            )}
          </div>

          {/* Hint navigation clavier */}
          {imageAttachments.length > 1 && (
            <div className="absolute top-4 left-4 
                          bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-lg
                          text-white/60 text-xs">
              Utilisez ← → pour naviguer
            </div>
          )}
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, attachment: null })}
        onConfirm={handleDelete}
        title="Supprimer la pièce jointe"
        message={`Êtes-vous sûr de vouloir supprimer "${deleteModal.attachment?.file_name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        variant="danger"
      />

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default AttachmentList;
