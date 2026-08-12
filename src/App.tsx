import React, { useState } from 'react';
import { PersonItem } from './types';
import type { AdminReportItem } from './features/reports/types/report';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar } from './components/BottomNavBar';
import { SightingModal } from './components/SightingModal';
import { usePersons } from './features/persons/hooks/usePersons';
import { useAdminReports } from './features/admin/hooks/useAdminReports';
import type { ReportSubmissionResult } from './features/reports/services/reportService';
import {
  ListErrorState,
  ListLoadingState,
} from './components/common/AsyncListState';

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

const PERSON_TABS = new Set([
  'home',
  'buscar',
  'encontrados',
  'desaparecidos',
  'nn',
  'detail',
]);

const ADMIN_TABS = new Set(['admin', 'admin_detail']);

export function App() {
  const { items, loading, error, refetch, getPersonById, addPersonItem } = usePersons();
  const {
    adminReports,
    loading: adminLoading,
    error: adminError,
    refetch: refetchAdmin,
    addAdminReport,
    approveReport,
    rejectReport,
    updateReportStatus,
  } = useAdminReports();

  const [currentTab, setCurrentTab] = useState<string>('home');
  const [searchInitialFilter, setSearchInitialFilter] = useState<string>('todos');
  const [selectedPerson, setSelectedPerson] = useState<PersonItem | null>(null);
  const [selectedAdminReport, setSelectedAdminReport] = useState<AdminReportItem | null>(null);
  const [isSightingModalOpen, setIsSightingModalOpen] = useState(false);

  const handleNavigate = async (tab: string, filter?: string, itemId?: string) => {
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

      const fetched = await getPersonById(itemId);
      if (fetched) {
        setSelectedPerson(fetched);
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

  const handleReportSubmitted = (result: ReportSubmissionResult) => {
    addAdminReport(result.adminReport);
    if (result.publishToPublicCatalog && result.publicPreview) {
      addPersonItem(result.publicPreview);
    }
  };

  const showPersonLoading = loading && PERSON_TABS.has(currentTab);
  const showPersonError = !loading && error && PERSON_TABS.has(currentTab);
  const showAdminLoading = adminLoading && ADMIN_TABS.has(currentTab);
  const showAdminError = !adminLoading && adminError && ADMIN_TABS.has(currentTab);

  const renderPersonContent = (content: React.ReactNode) => {
    if (showPersonLoading) {
      return <ListLoadingState message="Cargando personas..." />;
    }
    if (showPersonError) {
      return <ListErrorState message={error} onRetry={refetch} />;
    }
    return content;
  };

  const renderAdminContent = (content: React.ReactNode) => {
    if (showAdminLoading) {
      return <ListLoadingState message="Cargando reportes..." />;
    }
    if (showAdminError) {
      return <ListErrorState message={adminError} onRetry={refetchAdmin} />;
    }
    return content;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] flex flex-col font-sans selection:bg-[#008376] selection:text-white">
      <TopAppBar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        showBack={currentTab === 'detail' || currentTab === 'admin_detail'}
        onBack={() => {
          if (currentTab === 'detail') setCurrentTab('buscar');
          if (currentTab === 'admin_detail') setCurrentTab('admin');
        }}
      />

      <main className="flex-1 mt-[64px] md:mt-[72px]">
        {currentTab === 'home' &&
          renderPersonContent(
            <HomeView
              items={items}
              onNavigate={handleNavigate}
              onSelectPerson={handleSelectPerson}
            />
          )}

        {currentTab === 'buscar' &&
          renderPersonContent(
            <SearchView
              items={items}
              initialFilter={searchInitialFilter}
              onSelectPerson={handleSelectPerson}
            />
          )}

        {currentTab === 'encontrados' &&
          renderPersonContent(
            <EncontradosView items={items} onSelectPerson={handleSelectPerson} />
          )}

        {currentTab === 'desaparecidos' &&
          renderPersonContent(
            <DesaparecidosView
              items={items}
              onSelectPerson={handleSelectPerson}
              onNavigateReport={() => handleNavigate('reportar')}
            />
          )}

        {currentTab === 'nn' &&
          renderPersonContent(
            <NNView items={items} onIdentifyPerson={handleIdentifyNN} />
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
            onReportSubmitted={handleReportSubmitted}
            onNavigateHome={() => handleNavigate('home')}
            onNavigateSearch={() => handleNavigate('buscar')}
          />
        )}

        {currentTab === 'detail' &&
          renderPersonContent(
            selectedPerson ? (
              <PersonDetailView
                item={selectedPerson}
                onOpenSightingModal={() => setIsSightingModalOpen(true)}
                onBack={() => setCurrentTab('buscar')}
              />
            ) : (
              <ListErrorState
                message="No se encontró la ficha de esta persona."
                onRetry={() => handleNavigate('buscar')}
              />
            )
          )}

        {currentTab === 'admin' &&
          renderAdminContent(
            <AdminOverviewView
              adminReports={adminReports}
              onSelectAdminReport={(report) => {
                setSelectedAdminReport(report);
                setCurrentTab('admin_detail');
              }}
              onApproveReport={approveReport}
              onRejectReport={rejectReport}
            />
          )}

        {currentTab === 'admin_detail' &&
          renderAdminContent(
            selectedAdminReport ? (
              <AdminReportDetailView
                report={selectedAdminReport}
                onBack={() => setCurrentTab('admin')}
                onUpdateStatus={updateReportStatus}
              />
            ) : (
              <ListErrorState
                message="No se encontró el reporte seleccionado."
                onRetry={() => setCurrentTab('admin')}
              />
            )
          )}
      </main>

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

      <SightingModal
        item={selectedPerson}
        isOpen={isSightingModalOpen}
        onClose={() => setIsSightingModalOpen(false)}
        onSubmitSighting={(sighting) => {
          console.log('Avistamiento registrado:', sighting);
        }}
      />

      <BottomNavBar currentTab={currentTab} onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
