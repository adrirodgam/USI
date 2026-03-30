import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPieces, createPiece } from '../api/pieces';
import TopBar from '../components/TopBar';
import { useApp } from '../context/AppContext';
import { FileCheck, ClipboardList, ArrowLeft, Plus, CheckCircle2, X } from 'lucide-react';

// ─── Add Piece Modal ──────────────────────────────────────────────────────────
function AddPieceModal({ isOpen, onClose, onSave, customerId, token }) {
  const [form, setForm] = useState({ part_number: '', drawing_no: '', revision: '', default_comments: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.part_number || !form.drawing_no || !form.revision) {
      setError('Part Number, Drawing No. y Revisión son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await createPiece({ ...form, customer_id: customerId }, token);
      onSave(created);
      setForm({ part_number: '', drawing_no: '', revision: '', default_comments: '' });
      onClose();
    } catch {
      setError('Error al crear la pieza. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1.5px solid #E2E8F0', backgroundColor: '#F8FAFC',
    fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#0F172A',
    boxSizing: 'border-box', outline: 'none',
  };
  const labelStyle = {
    display: 'block', fontFamily: 'var(--font-body)', fontWeight: 700,
    fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase',
    letterSpacing: '0.5px', marginBottom: '6px',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0" style={{ backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className="relative z-50 w-full" style={{ maxWidth: '440px', backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>

        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#F1F5F9', borderTop: '3px solid #06B6D4' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '16px', color: '#0F172A', margin: 0 }}>
            Agregar Nueva Pieza
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <X size={16} style={{ color: '#94A3B8' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl" style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: '#EF4444', margin: 0 }}>{error}</p>
            </div>
          )}
          <div>
            <label style={labelStyle}>Part Number *</label>
            <input name="part_number" value={form.part_number} onChange={handleChange} placeholder="Ej: AMT-4892-X" style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Drawing No. *</label>
            <input name="drawing_no" value={form.drawing_no} onChange={handleChange} placeholder="Ej: DWG-7741-A" style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Revisión *</label>
            <input name="revision" value={form.revision} onChange={handleChange} placeholder="Ej: REV C" style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Comentario Predeterminado (Opcional)</label>
            <textarea name="default_comments" value={form.default_comments} onChange={handleChange} placeholder="Aparecerá por defecto en el campo Comments del COC..." rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-body)' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border transition-all hover:bg-gray-50"
              style={{ borderColor: '#E2E8F0', color: '#64748B', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', background: 'transparent', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl transition-all hover:brightness-110"
              style={{ background: saving ? '#E2E8F0' : 'linear-gradient(135deg, #06B6D4, #0891B2)', color: saving ? '#94A3B8' : 'white', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 4px 12px rgba(6,182,212,0.3)' }}>
              {saving ? 'Guardando...' : 'Guardar Pieza'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── COC Confirm Modal ────────────────────────────────────────────────────────
function CocConfirmModal({ piece, onConfirm, onDismiss }) {
  if (!piece) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }} onClick={onDismiss} />
      <div className="relative z-[61] w-full text-center" style={{ maxWidth: '360px', backgroundColor: 'white', borderRadius: '24px', padding: '36px 32px', boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#ECFDF5', border: '4px solid white', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
          <CheckCircle2 size={32} style={{ color: '#10B981' }} />
        </div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', color: '#0F172A', marginBottom: '10px' }}>
          ¡Pieza creada!
        </h3>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: '#64748B', lineHeight: 1.6, marginBottom: '24px' }}>
          La pieza{' '}
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0F172A' }}>{piece.part_number}</span>{' '}
          se guardó exitosamente. ¿Deseas generar el Certificado de Conformidad ahora?
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} className="w-full py-3 rounded-xl transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #1E3A5F, #2D5F7E)', color: 'white', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}>
            Sí, generar COC ahora
          </button>
          <button onClick={onDismiss} className="w-full py-3 rounded-xl border transition-all hover:bg-gray-50"
            style={{ borderColor: '#E2E8F0', color: '#64748B', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', background: 'transparent', cursor: 'pointer' }}>
            Quizás más tarde
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Piezas() {
  const { clientId } = useParams();
  const { token }    = useApp();
  const navigate     = useNavigate();

  const [pieces, setPieces]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [cocPiece, setCocPiece] = useState(null);

  const role             = localStorage.getItem('role');
  const isInspectorOrAdmin = ['inspector', 'Inspector', 'Admin', 'admin', 'developer'].includes(role);
  const isOperador         = ['operador', 'Operador'].includes(role);

  useEffect(() => {
    getPieces(clientId, token).then((data) => {
      setPieces(data || []);
      setLoading(false);
    });
  }, [clientId]);

  // Called by AddPieceModal after successful save
  const handlePieceSaved = (newPiece) => {
    setPieces((prev) => [...prev, newPiece]);
    setCocPiece(newPiece);
  };

  // Navigate to GenerarCOC passing piece as route state
  const goToGenerarCOC = (piece) => {
    navigate(`/generar-coc/${piece.part_number}`, { state: { piece } });
  };

  return (
    <div>
      <TopBar
        title={<span>Piezas <span style={{ color: '#06B6D4' }}>— Cliente #{clientId}</span></span>}
        breadcrumb={`Clientes → #${clientId} → Piezas`}
      >
        <button onClick={() => navigate('/clientes')}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg border transition-all hover:bg-gray-50"
          style={{ borderColor: '#E2E8F0', color: '#64748B', fontFamily: 'var(--font-body)', fontSize: '13px', background: 'transparent', cursor: 'pointer' }}>
          <ArrowLeft size={14} /> Clientes
        </button>

        {isInspectorOrAdmin && (
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 h-9 px-4 rounded-lg transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ backgroundColor: '#06B6D4', color: 'white', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '13px', boxShadow: '0 2px 8px rgba(6,182,212,0.25)', border: 'none', cursor: 'pointer' }}>
            <Plus size={16} /> Agregar Pieza
          </button>
        )}
      </TopBar>

      <div className="p-7">
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)' }}>

          <div className="flex items-center px-6 py-4 border-b" style={{ borderColor: '#F8FAFC' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: '#0F172A', margin: 0 }}>
              Catálogo de piezas
            </h3>
            <div className="ml-3 px-2 py-1 rounded-full" style={{ backgroundColor: '#F1F5F9', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
              {pieces.length}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16" style={{ fontFamily: 'var(--font-body)', color: '#94A3B8' }}>
              Cargando piezas...
            </div>
          ) : pieces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ fontFamily: 'var(--font-body)', color: '#94A3B8' }}>
              <p>No hay piezas para este cliente.</p>
              {isInspectorOrAdmin && (
                <button onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2 h-9 px-4 rounded-lg transition-all hover:brightness-110"
                  style={{ backgroundColor: '#06B6D4', color: 'white', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '13px', border: 'none', cursor: 'pointer' }}>
                  <Plus size={16} /> Agregar la primera pieza
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: '#FAFAFA' }}>
                    {['#', 'Part Number', 'Drawing No.', 'Revisión', 'Acciones'].map((col) => (
                      <th key={col} className="text-left px-6 py-3" style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pieces.map((piece, index) => (
                    <tr key={piece.id} className="border-b transition-colors hover:bg-[#F8FAFF]" style={{ borderColor: '#F8FAFC' }}>
                      <td className="px-6 py-4" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#94A3B8' }}>
                        {String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-block px-2 py-1 rounded" style={{ backgroundColor: '#EFF6FF', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: '#1D4ED8' }}>
                          {piece.part_number}
                        </div>
                      </td>
                      <td className="px-6 py-4" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#64748B' }}>
                        {piece.drawing_no}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full" style={{ backgroundColor: '#FFFBEB', fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600, color: '#D97706' }}>
                          {piece.revision}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isInspectorOrAdmin && (
                            <button onClick={() => goToGenerarCOC(piece)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:brightness-110"
                              style={{ backgroundColor: '#06B6D4', color: 'white', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                              <FileCheck size={13} /> Generar COC
                            </button>
                          )}
                          {isOperador && (
                            <button onClick={() => navigate(`/checklists/${clientId}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all hover:bg-purple-50"
                              style={{ borderColor: '#8B5CF6', color: '#8B5CF6', fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 600, background: 'transparent', cursor: 'pointer' }}>
                              <ClipboardList size={13} /> Ver Checklists
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <AddPieceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handlePieceSaved}
        customerId={clientId}
        token={token}
      />

      <CocConfirmModal
        piece={cocPiece}
        onConfirm={() => { goToGenerarCOC(cocPiece); setCocPiece(null); }}
        onDismiss={() => setCocPiece(null)}
      />
    </div>
  );
}