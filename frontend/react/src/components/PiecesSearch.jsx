import { useState, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { searchPieces, getPieceDetails } from '../api/dashboardRequest';

export default function PiecesSearch({ variant = 'default' }) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const sizes = {
    default: 'py-2.5 text-sm',
    large: 'py-4 text-base'
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (term.trim().length >= 2) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [term]);

  const performSearch = async () => {
    if (!term.trim()) return;
    
    setLoading(true);
    try {
      const data = await searchPieces(term);
      setResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPiece = async (piece) => {
    setLoading(true);
    try {
      const details = await getPieceDetails(piece.id);
      setSelectedPiece(details);
      setModalOpen(true);
      setShowResults(false);
      setTerm('');
    } catch (error) {
      console.error('Error getting details:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative w-full">
        <div className="relative">
          <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 ${variant === 'large' ? 'h-5 w-5' : 'h-4 w-4'}`} />
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder={variant === 'large' ? "Search by piece code or name..." : "Search pieces..."}
            className={`w-full pl-11 pr-10 ${sizes[variant]} rounded-xl border border-gray-200 focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20 transition-all outline-none bg-white/80 backdrop-blur-sm`}
          />
          {term && (
            <button
              onClick={() => setTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 size={16} className="animate-spin text-gray-400" />
            </div>
          )}
        </div>

        {/* Results dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
            {results.map((piece) => (
              <button
                key={piece.id}
                onClick={() => handleSelectPiece(piece)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm font-semibold text-[#1E3A5F]">
                      {piece.code}
                    </span>
                    <p className="text-sm text-gray-600 mt-0.5">{piece.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    piece.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {piece.status || 'Active'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {modalOpen && selectedPiece && (
        <PieceDetailsModal piece={selectedPiece} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}

// Piece Details Modal Component
function PieceDetailsModal({ piece, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{piece.name}</h2>
            <p className="text-sm text-gray-500 font-mono mt-1">{piece.code}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* General Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase mb-1">Client</p>
              <p className="font-semibold text-gray-900">{piece.client || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase mb-1">Creation Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(piece.created_at).toLocaleDateString('es-MX')}
              </p>
            </div>
          </div>

          {/* Certificates */}
          {piece.certificates && piece.certificates.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Certificates</h3>
              <div className="space-y-2">
                {piece.certificates.map((cert) => (
                  <div key={cert.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm font-medium text-gray-900">{cert.number}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(cert.issue_date).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      cert.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {cert.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inspections */}
          {piece.inspections && piece.inspections.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Inspections</h3>
              <div className="space-y-2">
                {piece.inspections.map((ins) => (
                  <div key={ins.id} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Inspection #{ins.id}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(ins.date).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      ins.compliant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {ins.compliant ? 'Compliant' : 'Non-Compliant'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}