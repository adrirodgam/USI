import { useState, useEffect } from "react";
import { getPieces, createPiece } from "../api/pieces";

/**
 * Pieces Component
 * Shows a grid of parts related to a specific customer.
 */
export default function Pieces({ customerId, token, onGenerateCOC, onVerChecklists, onBack }) {
  const [pieces, setPieces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newPiece, setNewPiece] = useState({
    part_number: "",
    drawing_no: "",
    revision: "",
    default_comments: ""
  });
  const [loading, setLoading] = useState(false);
  
  const role = localStorage.getItem('role');

  useEffect(() => {
    getPieces(customerId, token).then(data => setPieces(data));
  }, [customerId, token]);

  const handleAddPiece = async () => {
    if (!newPiece.part_number || !newPiece.drawing_no || !newPiece.revision) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const payload = { 
        part_number: newPiece.part_number,
        drawing_no: newPiece.drawing_no,
        revision: newPiece.revision,
        customer_id: customerId,
        default_comments: newPiece.default_comments || "" 
      };
      
      const createdPiece = await createPiece(payload, token);
      setPieces([...pieces, createdPiece]);
      
      // Cerrar modal
      setShowModal(false);
      
      // Preguntar si quiere generar COC ahora
      const generarCOC = window.confirm(
        `Pieza ${createdPiece.part_number} creada exitosamente.\n¿Deseas generar el COC ahora?`
      );
      
      if (generarCOC) {
        onGenerateCOC(createdPiece);
      }
      
      // Resetear formulario
      setNewPiece({
        part_number: "",
        drawing_no: "",
        revision: "",
        default_comments: ""
      });
      
    } catch (error) {
      console.error('Error creating piece:', error);
      alert('Error al crear la pieza.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewPiece({
      part_number: "",
      drawing_no: "",
      revision: "",
      default_comments: ""
    });
  };

  return (
    <div style={styles.page}>
      <button onClick={onBack} style={styles.backBtn}>← Regresar a Clientes</button>
      <h2 style={{ margin: '25px 0', color: '#202124' }}>Piezas del Cliente</h2>
      <button 
        onClick={() => { setShowModal(true); }} 
        style={{ ...styles.primaryBtn, marginBottom: '20px' }}
      >
        Agregar Nueva Pieza
      </button>

      <div style={styles.grid}>
        {pieces.map(piece => (
          <div key={piece.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.badge}>P/N</span>
              <h4 style={{ margin: '10px 0' }}>{piece.part_number}</h4>
            </div>
            <div style={styles.cardBody}>
              <p style={styles.infoText}><strong>Dibujo:</strong> {piece.drawing_no}</p>
              <p style={styles.infoText}><strong>Revisión:</strong> {piece.revision}</p>
            </div>
            <div style={styles.cardFooter}>
              {role === 'inspector' && (
                <button onClick={() => onGenerateCOC(piece)} style={styles.primaryBtn}>Generar COC</button>
              )}
              {role === 'operador' && (
                <button onClick={() => onVerChecklists(piece.customer_id)} style={styles.secondaryBtn}>Ver Checklists</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalCard}>
            <h3>Agregar Nueva Pieza</h3>
            <input
              type="text"
              placeholder="Número de Parte"
              value={newPiece.part_number}
              onChange={(e) => setNewPiece({ ...newPiece, part_number: e.target.value })}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Número de Dibujo"
              value={newPiece.drawing_no}
              onChange={(e) => setNewPiece({ ...newPiece, drawing_no: e.target.value })}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Revisión"
              value={newPiece.revision}
              onChange={(e) => setNewPiece({ ...newPiece, revision: e.target.value })}
              style={styles.input}
            />
            <textarea
              placeholder="Comentario Predeterminado (Opcional)"
              value={newPiece.default_comments}
              onChange={(e) => setNewPiece({ ...newPiece, default_comments: e.target.value })}
              style={styles.textarea}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleCloseModal} style={styles.secondaryBtn} disabled={loading}>
                Cancelar
              </button>
              <button onClick={handleAddPiece} style={styles.primaryBtn} disabled={loading}>
                {loading ? "Guardando..." : "Guardar Pieza"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { padding: '40px', backgroundColor: '#f8f9fa', minHeight: '100vh' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '25px' },
  card: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #e0e0e0' },
  cardHeader: { padding: '20px', backgroundColor: '#fdfdfd' },
  cardBody: { padding: '0 20px 20px 20px' },
  cardFooter: { padding: '15px', backgroundColor: '#fafafa', borderTop: '1px solid #f0f0f0', textAlign: 'center' },
  badge: { backgroundColor: '#e8f0fe', color: '#1a73e8', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  infoText: { fontSize: '14px', color: '#5f6368', margin: '4px 0' },
  primaryBtn: { backgroundColor: '#34a853', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  secondaryBtn: { backgroundColor: '#8e24aa', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' },
  backBtn: { border: 'none', background: 'none', color: '#1a73e8', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' },
  modal: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalCard: { backgroundColor: 'white', borderRadius: '12px', padding: '30px', width: '400px', display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #dadce0', fontSize: '14px' },
  textarea: { padding: '10px', borderRadius: '6px', border: '1px solid #dadce0', fontSize: '14px', minHeight: '80px', resize: 'vertical' }
};