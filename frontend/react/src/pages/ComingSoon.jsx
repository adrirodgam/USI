import TopBar from '../components/TopBar';
import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';

export default function ComingSoon() {
  const { pathname } = useLocation();
  const pageName = pathname.replace('/', '').replace(/^\w/, (c) => c.toUpperCase());

  return (
    <div>
      <TopBar title={pageName} breadcrumb="Panel principal" />
      <div className="p-7 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#F1F5F9' }}>
            <Construction size={28} style={{ color: '#94A3B8' }} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '20px', color: '#0F172A', marginBottom: '8px' }}>
            Próximamente
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: '#94A3B8' }}>
            Este módulo está en desarrollo.
          </p>
        </div>
      </div>
    </div>
  );
}
