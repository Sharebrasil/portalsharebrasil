import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Bell, User } from 'lucide-react';

interface MobileNavigationProps {
  currentPath?: string;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ currentPath }) => {
  const location = useLocation();
  const path = currentPath || location.pathname;

  const items = [
    { to: '/app', label: 'Início', icon: <Home size={18} /> },
    { to: '/app/relatorios', label: 'Relatórios', icon: <FileText size={18} /> },
    { to: '/app/notificacoes', label: 'Notificações', icon: <Bell size={18} /> },
    { to: '/app/perfil', label: 'Perfil', icon: <User size={18} /> },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[94%] max-w-3xl bg-white/95 shadow-lg rounded-xl border border-gray-100 z-50 md:hidden">
      <ul className="flex justify-between items-center p-2">
        {items.map((it) => {
          const active = path && path.startsWith(it.to);
          return (
            <li key={it.to} className="flex-1">
              <Link
                to={it.to}
                className={`flex flex-col items-center justify-center py-2 px-2 text-xs ${active ? 'text-blue-600' : 'text-gray-600'}`}
              >
                <div className={`p-2 rounded-lg ${active ? 'bg-blue-50' : 'bg-transparent'}`}>
                  {it.icon}
                </div>
                <span className="mt-1">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileNavigation;
