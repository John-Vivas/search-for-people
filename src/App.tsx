import React, { useEffect, useState, lazy, Suspense } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { PersonItem } from '@/src/types';
import { TopAppBar } from '@/src/components/TopAppBar';
import { BottomNavBar } from '@/src/components/BottomNavBar';
import { SightingModal } from '@/src/components/SightingModal';
import { usePersons } from '@/src/features/persons/hooks/usePersons';
import { useAdminReports } from '@/src/features/admin/hooks/useAdminReports';
import type { ReportSubmissionResult } from '@/src/features/reports/services/reportService';
import {
  ListErrorState,
  ListLoadingState,
} from '@/src/components/common/AsyncListState';

// Eagerly loaded: the common, lightweight list views (no heavy deps).
import { HomeView } from '@/src/views/HomeView';
import { SearchView } from '@/src/views/SearchView';
import { EncontradosView } from '@/src/views/EncontradosView';
import { DesaparecidosView } from '@/src/views/DesaparecidosView';
import { NNView } from '@/src/views/NNView';

// Lazily loaded: heavier / less-frequent views. The detail + map views pull in
// Leaflet, so deferring them keeps the initial bundle small.
const PersonDetailView = lazy(() =>
  import('@/src/views/PersonDetailView').then((m) => ({ default: m.PersonDetailView }))
);
const MapView = lazy(() => import('@/src/views/MapView').then((m) => ({ default: m.MapView })));
const ReportFlowView = lazy(() =>
  import('@/src/views/ReportFlowView').then((m) => ({ default: m.ReportFlowView }))
);
const AidBoardView = lazy(() =>
  import('@/src/views/AidBoardView').then((m) => ({ default: m.AidBoardView }))
);
const AdminOverviewView = lazy(() =>
  import('@/src/views/AdminOverviewView').then((m) => ({ default: m.AdminOverviewView }))
);
const AdminReportDetailView = lazy(() =>
  import('@/src/views/AdminReportDetailView').then((m) => ({ default: m.AdminReportDetailView }))
);

/** Map the current URL to the tab id the nav bars use for their active state. */
function pathToTab(pathname: string): string {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/buscar')) return 'buscar';
  if (pathname.startsWith('/encontrados')) return 'encontrados';
  if (pathname.startsWith('/desaparecidos')) return 'desaparecidos';
  if (pathname.startsWith('/nn')) return 'nn';
  if (pathname.startsWith('/mapa')) return 'mapa';
  if (pathname.startsWith('/reportar')) return 'reportar';
  if (pathname.startsWith('/ayuda')) return 'ayuda';
  if (pathname.startsWith('/caso')) return 'detail';
  if (pathname.startsWith('/admin/')) return 'admin_detail';
  if (pathname.startsWith('/admin')) return 'admin';
  return 'home';
}

function tabToPath(tab: string): string {
  switch (tab) {
    case 'home': return '/';
    case 'buscar': return '/buscar';
    case 'encontrados': return '/encontrados';
    case 'desaparecidos': return '/desaparecidos';
    case 'nn': return '/nn';
    case 'mapa': return '/mapa';
    case 'reportar': return '/reportar';
    case 'ayuda': return '/ayuda';
    case 'admin': return '/admin';
    default: return '/';
  }
}

type PersonsData = ReturnType<typeof usePersons>;

/** Resolves a person/pet by URL id (from cache or the API) for the detail route. */
function CaseRoute({
  personsData,
  onOpenSighting,
}: {
  personsData: PersonsData;
  onOpenSighting: (item: PersonItem) => void;
}) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { items, getPersonById } = personsData;
  const cached = items.find((i) => i.id === id) ?? null;
  const [item, setItem] = useState<PersonItem | null>(cached);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let active = true;
    const found = items.find((i) => i.id === id) ?? null;
    if (found) {
      setItem(found);
      setLoading(false);
      return;
    }
    setLoading(true);
    getPersonById(id).then((res) => {
      if (!active) return;
      setItem(res);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id, items, getPersonById]);

  if (loading) return <ListLoadingState message="Cargando ficha…" />;
  if (!item) {
    return (
      <ListErrorState
        message="No se encontró la ficha de esta persona."
        onRetry={() => navigate('/buscar')}
      />
    );
  }
  return (
    <PersonDetailView
      item={item}
      onOpenSightingModal={() => onOpenSighting(item)}
      onBack={() => navigate(-1)}
    />
  );
}

/** Resolves an admin report by URL id for the moderation detail route. */
function AdminReportRoute({
  reports,
  onUpdateStatus,
}: {
  reports: ReturnType<typeof useAdminReports>['adminReports'];
  onUpdateStatus: ReturnType<typeof useAdminReports>['updateReportStatus'];
}) {
  const { reportId = '' } = useParams();
  const navigate = useNavigate();
  const report = reports.find((r) => r.id === reportId) ?? null;

  if (!report) {
    return (
      <ListErrorState
        message="No se encontró el reporte seleccionado."
        onRetry={() => navigate('/admin')}
      />
    );
  }
  return (
    <AdminReportDetailView
      report={report}
      onBack={() => navigate('/admin')}
      onUpdateStatus={onUpdateStatus}
    />
  );
}

export function App() {
  const personsData = usePersons();
  const { items, loading, error, refetch, addPersonItem } = personsData;
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

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentTab = pathToTab(location.pathname);

  const [sightingItem, setSightingItem] = useState<PersonItem | null>(null);
  const [isSightingModalOpen, setIsSightingModalOpen] = useState(false);

  // Scroll to top on every navigation (react-router doesn't do this by default).
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const handleNavigate = (tab: string, filter?: string, itemId?: string) => {
    if (itemId) {
      navigate(`/caso/${itemId}`);
      return;
    }
    if (tab === 'buscar' && filter && filter !== 'todos') {
      navigate(`/buscar?f=${encodeURIComponent(filter)}`);
      return;
    }
    navigate(tabToPath(tab));
  };

  const handleSelectPerson = (person: PersonItem) => navigate(`/caso/${person.id}`);

  const openSighting = (item: PersonItem) => {
    setSightingItem(item);
    setIsSightingModalOpen(true);
  };

  const handleReportSubmitted = (result: ReportSubmissionResult) => {
    addAdminReport(result.adminReport);
    if (result.publishToPublicCatalog && result.publicPreview) {
      // Mock mode: optimistically show it right away.
      addPersonItem(result.publicPreview);
    } else {
      // Supabase mode: reload the catalog so the new case appears without a
      // manual page refresh.
      refetch();
    }
  };

  const searchFilter = searchParams.get('f') ?? 'todos';
  const isMap = currentTab === 'mapa';

  const renderPersonContent = (content: React.ReactNode) => {
    if (loading) return <ListLoadingState message="Cargando personas..." />;
    if (error) return <ListErrorState message={error} onRetry={refetch} />;
    return content;
  };

  const renderAdminContent = (content: React.ReactNode) => {
    if (adminLoading) return <ListLoadingState message="Cargando reportes..." />;
    if (adminError) return <ListErrorState message={adminError} onRetry={refetchAdmin} />;
    return content;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] flex flex-col font-sans selection:bg-[#008376] selection:text-white">
      <TopAppBar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        showBack={currentTab === 'detail' || currentTab === 'admin_detail'}
        onBack={() => navigate(-1)}
      />

      <main className="flex-1 mt-[64px] md:mt-[72px]">
        <Suspense fallback={<ListLoadingState message="Cargando…" />}>
          <Routes>
            <Route
              path="/"
              element={renderPersonContent(
                <HomeView items={items} onNavigate={handleNavigate} onSelectPerson={handleSelectPerson} />
              )}
            />
            <Route
              path="/buscar"
              element={renderPersonContent(
                <SearchView
                  key={searchFilter}
                  items={items}
                  initialFilter={searchFilter}
                  onSelectPerson={handleSelectPerson}
                />
              )}
            />
            <Route
              path="/encontrados"
              element={renderPersonContent(
                <EncontradosView items={items} onSelectPerson={handleSelectPerson} />
              )}
            />
            <Route
              path="/desaparecidos"
              element={renderPersonContent(
                <DesaparecidosView
                  items={items}
                  onSelectPerson={handleSelectPerson}
                  onNavigateReport={() => navigate('/reportar')}
                />
              )}
            />
            <Route
              path="/nn"
              element={renderPersonContent(<NNView items={items} onIdentifyPerson={openSighting} />)}
            />
            <Route
              path="/caso/:id"
              element={renderPersonContent(
                <CaseRoute personsData={personsData} onOpenSighting={openSighting} />
              )}
            />
            <Route
              path="/mapa"
              element={<MapView onViewLocationDetail={() => { /* map detail navigation TBD */ }} />}
            />
            <Route
              path="/reportar"
              element={
                <ReportFlowView
                  onReportSubmitted={handleReportSubmitted}
                  onNavigateHome={() => navigate('/')}
                  onNavigateSearch={() => navigate('/buscar')}
                />
              }
            />
            <Route path="/ayuda" element={<AidBoardView />} />
            <Route
              path="/admin"
              element={renderAdminContent(
                <AdminOverviewView
                  adminReports={adminReports}
                  onSelectAdminReport={(report) => navigate(`/admin/${report.id}`)}
                  onApproveReport={approveReport}
                  onRejectReport={rejectReport}
                />
              )}
            />
            <Route
              path="/admin/:reportId"
              element={renderAdminContent(
                <AdminReportRoute reports={adminReports} onUpdateStatus={updateReportStatus} />
              )}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>

      {!isMap && (
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
            <div className="pt-2 text-[10px] text-[#bcc9c6] flex items-center justify-center gap-2">
              <span>© {new Date().getFullYear()} Estamos Buscando • Red Comunitarias de Apoyo</span>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => navigate('/admin')}
                className="text-[#bcc9c6] hover:text-[#436370] hover:underline transition-colors cursor-pointer"
              >
                Panel de moderación
              </button>
            </div>
          </div>
        </footer>
      )}

      <SightingModal
        item={sightingItem}
        isOpen={isSightingModalOpen}
        onClose={() => setIsSightingModalOpen(false)}
        onSubmitSighting={() => { /* sighting persistence TBD */ }}
      />

      <BottomNavBar currentTab={currentTab} onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
