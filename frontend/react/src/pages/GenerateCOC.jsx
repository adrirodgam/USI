import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { generateCOC } from '../api/certificates';
import { getInspectors } from '../api/users';
import TopBar from '../components/TopBar';
import { useApp } from '../context/AppContext';
import { Download, ArrowLeft, FileCheck } from 'lucide-react';

export default function GenerarCOC() {
  const { partNumber } = useParams();
  const location       = useLocation();
  const navigate       = useNavigate();
  const { token }      = useApp();

  // Piece comes as route state from Piezas.jsx
  const piece = location.state?.piece || {
    part_number: partNumber,
    drawing_no: '',
    revision: '',
    customers: { name: '' },
  };

  const [po, setPo]               = useState('');
  const [so, setSo]               = useState('');
  const [wo, setWo]               = useState('');
  const [quantity, setQuantity]   = useState('');
  const [sn, setSn]               = useState('');
  const [comments, setComments]   = useState(piece.default_comments || '');
  const [inspector, setInspector] = useState('');
  const [inspectors, setInspectors] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess]       = useState(false);

  useEffect(() => {
    getInspectors(token).then((data) => setInspectors(data || []));
  }, [token]);

  const handleGenerate = async () => {
    setGenerating(true);
    setSuccess(false);

    const payload = {
      customer_name:  piece.customers?.name || '',
      part_number:    piece.part_number,
      drawing_no:     piece.drawing_no,
      revision:       piece.revision,
      packing_slip:   'N/A',
      date_code:      'N/A',
      serial_numbers: sn       || 'N/A',
      purchase_order: po,
      sales_order:    so,
      work_order:     wo,
      quantity:       quantity,
      comments:       comments || 'N/A',
      inspector:      inspector,
      date:           new Date().toLocaleDateString('es-MX'),
    };

    try {
      const blob = await generateCOC(payload, token);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href    = url;
        a.download = `COC_${piece.part_number}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setSuccess(true);
      }
    } catch (err) {
      console.error('Error generating certificate:', err);
    } finally {
      setGenerating(false);
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
    <div>
      <TopBar
        title="Generar Certificado de Conformidad"
        breadcrumb={`Piezas → ${piece.part_number} → Generar COC`}
      >
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg border transition-all hover:bg-gray-50"
          style={{ borderColor: '#E2E8F0', color: '#64748B', fontFamily: 'var(--font-body)', fontSize: '13px', background: 'transparent', cursor: 'pointer' }}>
          <ArrowLeft size={14} /> Volver
        </button>
      </TopBar>

      <div className="p-7">
        <div className="flex gap-6" style={{ maxWidth: '900px' }}>

          {/* Left: piece info */}
          <div className="w-72 flex-shrink-0">
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)', borderTop: '3px solid #06B6D4' }}>
              <div className="p-5">
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                  DATOS DE LA PIEZA
                </div>
                {[
                  { label: 'Cliente',     value: piece.customers?.name || '—' },
                  { label: 'Part Number', value: piece.part_number,   mono: true },
                  { label: 'Drawing No.', value: piece.drawing_no,    mono: true },
                  { label: 'Revisión',    value: piece.revision,      mono: true },
                  { label: 'Fecha',       value: new Date().toLocaleDateString('es-MX'), mono: true },
                ].map((item) => (
                  <div key={item.label} className="pb-3 mb-3 border-b last:border-0 last:mb-0 last:pb-0" style={{ borderColor: '#F1F5F9' }}>
                    <div style={labelStyle}>{item.label}</div>
                    <div style={{ fontFamily: item.mono ? 'var(--font-mono)' : 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                      {item.value || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {success && (
              <div className="mt-4 p-4 rounded-2xl flex items-center gap-3" style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <FileCheck size={18} style={{ color: '#10B981' }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, color: '#059669' }}>
                  COC generado exitosamente
                </span>
              </div>
            )}
          </div>

          {/* Right: form */}
          <div className="flex-1">
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '10px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>
                DATOS DEL CERTIFICADO
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { label: 'P.O.', value: po, set: setPo, placeholder: 'Purchase Order' },
                  { label: 'S.O.', value: so, set: setSo, placeholder: 'Sales Order' },
                  { label: 'W.O.', value: wo, set: setWo, placeholder: 'Work Order' },
                  { label: 'Cantidad', value: quantity, set: setQuantity, placeholder: '0' },
                ].map((field) => (
                  <div key={field.label}>
                    <label style={labelStyle}>{field.label}</label>
                    <input type="text" value={field.value} onChange={(e) => field.set(e.target.value)} placeholder={field.placeholder} style={inputStyle} />
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <label style={labelStyle}>Números de Serie (S/N)</label>
                <input type="text" value={sn} onChange={(e) => setSn(e.target.value)} placeholder="N/A" style={inputStyle} />
              </div>

              <div className="mb-4">
                <label style={labelStyle}>Comentarios</label>
                <textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="N/A" rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-body)' }} />
              </div>

              <div className="mb-6">
                <label style={labelStyle}>Inspector Responsable</label>
                <select value={inspector} onChange={(e) => setInspector(e.target.value)} style={inputStyle}>
                  <option value="">Seleccionar inspector...</option>
                  {inspectors.map((i) => (
                    <option key={i.employee_id} value={i.name}>{i.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !inspector}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
                style={{
                  background: (generating || !inspector) ? '#E2E8F0' : 'linear-gradient(135deg, #06B6D4, #0891B2)',
                  color: (generating || !inspector) ? '#94A3B8' : 'white',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px',
                  boxShadow: (generating || !inspector) ? 'none' : '0 4px 16px rgba(6,182,212,0.3)',
                  cursor: (generating || !inspector) ? 'not-allowed' : 'pointer',
                  border: 'none',
                }}
              >
                <Download size={18} />
                {generating ? 'Generando...' : 'Descargar COC (.docx)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
