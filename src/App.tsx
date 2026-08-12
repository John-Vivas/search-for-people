import React, { useState, useEffect } from 'react';
import { PersonItem, AdminReportItem } from './types';
import { INITIAL_ITEMS, INITIAL_ADMIN_REPORTS } from './data/mockData';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { SightingModal } from './components/SightingModal';

import { HomeView } from './views/HomeView';
import { SearchView } from './views/SearchView';
import { EncontradosView } from './views/EncontradosView';
import { DesaparecidosView } from './views/DesaparecidosView';
import { NNView } from './views/NNView';
import { PersonDetailView } from './views/PersonDetailView';
import { MapView } from './views/MapView';
import type { MapLocation } from './features/map/types/map.types';
import { ReportFlowView } from './views/ReportFlowView';
import { AdminOverviewView } from './views/AdminOverviewView';
import { AdminReportDetailView } from './views/AdminReportDetailView';

export function App() {
  const [items, setItems] = useState<PersonItem[]>(() => {
    const saved = localStorage.getItem('estamos_buscando_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [adminReports, setAdminReports] = useState<AdminReportItem[]>(() => {
    const saved = localStorage.getItem('estamos_buscando_admin_reports');
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_REPORTS;
  });

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [searchInitialFilter, setSearchInitialFilter] = useState<string>('todos');
  const [selectedPerson, setSelectedPerson] = useState<PersonItem | null>(null);
  const [selectedAdminReport, setSelectedAdminReport] = useState<AdminReportItem | null>(null);
  const [isSightingModalOpen, setIsSightingModalOpen] = useState(false);

  // Sync state to localStorage for persistent changes
  useEffect(() => {
    localStorage.setItem('estamos_buscando_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('estamos_buscando_admin_reports', JSON.stringify(adminReports));
  }, [adminReports]);

  // Handle navigation
  const handleNavigate = (tab: string, filter?: string, itemId?: string) => {
    if (filter) {
      setSearchInitialFilter(filter);
    } else {
      setSearchInitialFilter('todos');
    }

    if (itemId) {
      const found = items.find((i) => i.id === itemId);
      if (found) {
        setSelectedPerson(found);
        setCurrentTab('detail');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPerson = (person: PersonItem) => {
    setSelectedPerson(person);
    setCurrentTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIdentifyNN = (item: PersonItem) => {
    setSelectedPerson(item);
    setIsSightingModalOpen(true);
  };

  const handleAddPersonItem = (newItem: PersonItem, newAdminItem: AdminReportItem) => {
    setItems((prev) => [newItem, ...prev]);
    setAdminReports((prev) => [newAdminItem, ...prev]);
  };

  const handleApproveReport = (id: string) => {
    setAdminReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r))
    );
  };

  const handleRejectReport = (id: string) => {
    setAdminReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r))
    );
  };

  const handleUpdateAdminReportStatus = (
    id: string,
    newStatus: 'pending' | 'approved' | 'rejected',
    notes: string
  ) => {
    setAdminReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus, notes } : r))
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] flex flex-col font-sans selection:bg-[#008376] selection:text-white">
      {/* Top Header */}
      <TopAppBar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        showBack={currentTab === 'detail' || currentTab === 'admin_detail'}
        onBack={() => {
          if (currentTab === 'detail') setCurrentTab('buscar');
          if (currentTab === 'admin_detail') setCurrentTab('admin');
        }}
      />

      {/* Main View Router */}
      <main className="flex-1 mt-[64px] md:mt-[72px]">
        {currentTab === 'home' && (
          <HomeView
            items={items}
            onNavigate={handleNavigate}
            onSelectPerson={handleSelectPerson}
          />
        )}

        {currentTab === 'buscar' && (
          <SearchView
            items={items}
            initialFilter={searchInitialFilter}
            onSelectPerson={handleSelectPerson}
          />
        )}

        {currentTab === 'encontrados' && (
          <EncontradosView
            items={items}
            onSelectPerson={handleSelectPerson}
          />
        )}

        {currentTab === 'desaparecidos' && (
          <DesaparecidosView
            items={items}
            onSelectPerson={handleSelectPerson}
            onNavigateReport={() => handleNavigate('reportar')}
          />
        )}

        {currentTab === 'nn' && (
          <NNView
            items={items}
            onIdentifyPerson={handleIdentifyNN}
          />
        )}

        {currentTab === 'mapa' && (
          <MapView
            onViewLocationDetail={(location: MapLocation) => {
              console.info('Ver detalle de registro del mapa:', location.id);
            }}
          />
        )}

        {currentTab === 'reportar' && (
          <ReportFlowView
            onAddPersonItem={handleAddPersonItem}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateSearch={() => handleNavigate('buscar')}
          />
        )}

        {currentTab === 'detail' && selectedPerson && (
          <PersonDetailView
            item={selectedPerson}
            onOpenSightingModal={() => setIsSightingModalOpen(true)}
            onBack={() => setCurrentTab('buscar')}
          />
        )}

        {currentTab === 'admin' && (
          <AdminOverviewView
            adminReports={adminReports}
            onSelectAdminReport={(report) => {
              setSelectedAdminReport(report);
              setCurrentTab('admin_detail');
            }}
            onApproveReport={handleApproveReport}
            onRejectReport={handleRejectReport}
          />
        )}

        {currentTab === 'admin_detail' && selectedAdminReport && (
          <AdminReportDetailView
            report={selectedAdminReport}
            onBack={() => setCurrentTab('admin')}
            onUpdateStatus={handleUpdateAdminReportStatus}
          />
        )}
      </main>

      {/* Footer */}
      {currentTab !== 'mapa' && (
        <footer className="bg-white border-t border-[#e1e3e4] py-8 px-4 text-center text-xs text-[#6d7a77] mb-16 md:mb-0">
          <div className="max-w-5xl mx-auto space-y-3">
            <div className="flex items-center justify-center gap-2 text-[#00685d] font-bold text-sm">
              <span className="material-symbols-outlined text-[20px]" data-weight="fill">
                volunteer_activism
              </span>
              <span>Estamos Buscando</span>
            </div>
            <p>
              Plataforma comunitaria e independiente de búsqueda de personas desaparecidas, encontradas, NN y mascotas.
            </p>
            <p className="text-[11px] text-[#8e711f]">
              En caso de emergencia con riesgo inminente, comunícate siempre con la línea oficial 123 (Policía Nacional) o la Fiscalía General de la Nación.
            </p>
            <div className="pt-2 text-[10px] text-[#bcc9c6]">
              © {new Date().getFullYear()} Estamos Buscando • Red Comunitarias de Apoyo
            </div>
          </div>
        </footer>
      )}

      {/* Sighting / Identification Modal */}
      <SightingModal
        item={selectedPerson}
        isOpen={isSightingModalOpen}
        onClose={() => setIsSightingModalOpen(false)}
        onSubmitSighting={(sighting) => {
          console.log('Avistamiento registrado:', sighting);
        }}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNavBar currentTab={currentTab} onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
