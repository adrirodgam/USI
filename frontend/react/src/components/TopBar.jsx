import { Search, Bell } from "lucide-react";

export default function TopBar({ title, breadcrumb, children }) {
  const today    = new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const initials = localStorage.getItem('initial') || '??';

  return (
    <div
      className="h-16 flex items-center justify-between px-7 border-b"
      style={{ backgroundColor: 'white', borderColor: 'rgba(0,0,0,0.06)', boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}
    >
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', color: '#0F172A' }}>
          {title}
        </h1>
        {breadcrumb && (
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
            {breadcrumb}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {children}

        <div className="relative">
          <input
            type="text"
            placeholder="Buscar..."
            className="w-[220px] h-9 rounded-full px-4 pl-10 focus:outline-none"
            style={{ backgroundColor: '#F1F5F9', fontFamily: 'var(--font-body)', fontSize: '13px', color: '#0F172A' }}
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
        </div>

        <div className="flex items-center gap-2 h-9 px-3 rounded-full" style={{ backgroundColor: '#F1F5F9' }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: '12px', fontWeight: 500, color: '#64748B' }}>
            {today}
          </span>
        </div>

        <button className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
          <Bell size={18} style={{ color: '#64748B' }} />
          <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: '#EF4444' }} />
        </button>

        <div
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#2D5F7E', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '12px', color: 'white' }}
        >
          {initials}
        </div>
      </div>
    </div>
  );
}
