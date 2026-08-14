import React, { useState, useEffect } from 'react';
import { ItemType } from '@/src/features/persons/types/person';
import { ReporterRole } from '@/src/features/reports/types/reporter';
import { useReports } from '@/src/features/reports/hooks/useReports';
import { reportService, type ReportSubmissionResult, type DuplicateMatch } from '@/src/features/reports/services/reportService';
import type { ReportForm } from '@/src/features/reports/types/report';
import { useImageUpload } from '@/src/hooks/useImageUpload';
import { ImageUploader } from '@/src/components/ui/ImageUploader';
import { zonesService } from '@/src/features/map/services/zones.service';

interface CityOption {
  id: string;
  label: string;
}

interface ReportFlowViewProps {
  onReportSubmitted: (result: ReportSubmissionResult) => void;
  onNavigateHome: () => void;
  onNavigateSearch: () => void;
}

export const ReportFlowView: React.FC<ReportFlowViewProps> = ({
  onReportSubmitted,
  onNavigateHome,
  onNavigateSearch,
}) => {
  const { submitting, submitError, submitReport } = useReports();
  const [step, setStep] = useState<number>(1);

  // Form State
  const [itemType, setItemType] = useState<ItemType>('desaparecido');
  const [reporterRole, setReporterRole] = useState<ReporterRole>('familiar');
  const [reporterName, setReporterName] = useState('');
  const [reporterDoc, setReporterDoc] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [reporterRel, setReporterRelationship] = useState('Madre');

  const [subjectName, setSubjectName] = useState('');
  const [subjectAge, setSubjectAge] = useState('');
  const [subjectGender, setSubjectGender] = useState('Masculino');
  const [subjectCityId, setSubjectCityId] = useState('');
  const [subjectNeighborhood, setSubjectNeighborhood] = useState('');
  const [subjectAddress, setSubjectAddress] = useState('');
  const [subjectDate, setSubjectDate] = useState('');
  const [subjectObs, setSubjectObservations] = useState('');
  const [subjectSpecies, setSubjectSpecies] = useState('Perro');
  const [subjectBreed, setSubjectBreed] = useState('');
  const [subjectColor, setSubjectColor] = useState('');

  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatch[]>([]);
  const [pendingForm, setPendingForm] = useState<ReportForm | null>(null);
  const [checkingDup, setCheckingDup] = useState(false);

  const isPet = itemType === 'mascota';

  const [cities, setCities] = useState<CityOption[]>([]);

  useEffect(() => {
    let active = true;
    zonesService.getEmergencyZones(true).then((res) => {
      if (!active) return;
      const options = (res.data ?? [])
        .map((z) => ({
          id: z.id,
          label: z.city?.trim() || z.name,
          department: z.department ?? '',
        }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es'));
      setCities(options.map(({ id, label }) => ({ id, label })));
    });
    return () => {
      active = false;
    };
  }, []);

  const selectedCity = cities.find((c) => c.id === subjectCityId);

  const folderCategory =
    itemType === 'mascota'
      ? 'pets'
      : itemType === 'nn'
      ? 'persons/unidentified'
      : itemType === 'encontrado'
      ? 'persons/found'
      : 'persons/missing';

  const {
    items: imageItems,
    isUploading: isUploadingImages,
    primaryUrl,
    globalError: imageGlobalError,
    addFiles: onAddFiles,
    removeImage: onRemoveImage,
    retryUpload: onRetryUpload,
    setPrimaryImage: onSetPrimaryImage,
  } = useImageUpload({
    maxImages: 3,
    folderCategory,
  });

  const doSubmit = async (form: ReportForm) => {
    try {
      const result = await submitReport(form);
      onReportSubmitted(result);
      setStep(5);
    } catch {
      // submitError set in hook
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Only persist a real uploaded Cloudinary URL. A local blob: preview
    // (upload not finished) or an empty value is stored as '' so the UI
    // shows the "Sin foto" fallback instead of a broken/placeholder image.
    const finalPhotoUrl =
      primaryUrl && primaryUrl.startsWith('http') ? primaryUrl : '';

    const form = reportService.buildReportFormFromFlow({
      itemType,
      reporterRole,
      reporterName,
      reporterDoc,
      reporterPhone,
      reporterRel,
      subjectName,
      subjectAge,
      subjectGender,
      subjectCity: selectedCity?.label,
      subjectCityZoneId: subjectCityId || null,
      subjectNeighborhood,
      subjectAddress,
      subjectSpecies,
      subjectBreed,
      subjectColor,
      subjectDate,
      subjectObs,
      photoPreview: finalPhotoUrl,
    });

    // Duplicate check (non-blocking): if similar records exist, ask first.
    setCheckingDup(true);
    const matches = await reportService.findSimilarRecords(form);
    setCheckingDup(false);
    if (matches.length > 0) {
      setDuplicateMatches(matches);
      setPendingForm(form);
      return;
    }

    await doSubmit(form);
  };

  const confirmNotDuplicate = () => {
    const form = pendingForm;
    setDuplicateMatches([]);
    setPendingForm(null);
    if (form) doSubmit(form);
  };

  const cancelDuplicate = () => {
    setDuplicateMatches([]);
    setPendingForm(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 md:pb-12 animate-fade-in">
      {/* Header bar step navigation */}
      {step < 5 && (
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#e1e3e4]">
          <button
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            disabled={step === 1}
            className="flex items-center gap-1 text-xs font-bold text-[#00685d] disabled:opacity-30 hover:underline cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Anterior
          </button>

          <span className="text-xs font-bold text-[#6d7a77] font-mono">
            Paso {step} de 4
          </span>

          <button
            onClick={onNavigateHome}
            className="text-xs font-bold text-[#6d7a77] hover:text-[#ba1a1a] cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* STEP 1: ¿Qué quieres reportar? */}
      {step === 1 && (
        <section className="animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1d] mb-2">
            ¿Qué quieres reportar?
          </h2>
          <p className="text-sm text-[#3d4947] mb-6">
            Selecciona el tipo de caso para habilitar el formulario adecuado.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setItemType('desaparecido');
                setSubjectGender('Masculino');
                setStep(2);
              }}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center group cursor-pointer ${
                itemType === 'desaparecido'
                  ? 'border-[#00685d] bg-[#f4fffb] shadow-xs'
                  : 'border-[#bcc9c6] bg-white hover:border-[#00685d]'
              }`}
            >
              <span className="material-symbols-outlined text-4xl text-[#00685d] mb-2 group-hover:scale-110 transition-transform">
                person_search
              </span>
              <span className="text-sm font-bold text-[#191c1d]">Desaparecido</span>
            </button>

            <button
              onClick={() => {
                setItemType('encontrado');
                setSubjectGender('Masculino');
                setStep(2);
              }}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center group cursor-pointer ${
                itemType === 'encontrado'
                  ? 'border-[#00685d] bg-[#f4fffb] shadow-xs'
                  : 'border-[#bcc9c6] bg-white hover:border-[#00685d]'
              }`}
            >
              <span className="material-symbols-outlined text-4xl text-[#00685d] mb-2 group-hover:scale-110 transition-transform" data-weight="fill">
                how_to_reg
              </span>
              <span className="text-sm font-bold text-[#191c1d]">Encontrado</span>
            </button>

            <button
              onClick={() => {
                setItemType('nn');
                setSubjectGender('Masculino');
                setStep(2);
              }}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center group cursor-pointer ${
                itemType === 'nn'
                  ? 'border-[#00685d] bg-[#f4fffb] shadow-xs'
                  : 'border-[#bcc9c6] bg-white hover:border-[#00685d]'
              }`}
            >
              <span className="material-symbols-outlined text-4xl text-[#00685d] mb-2 group-hover:scale-110 transition-transform">
                help_center
              </span>
              <span className="text-sm font-bold text-[#191c1d]">Persona N.N.</span>
            </button>

            <button
              onClick={() => {
                setItemType('mascota');
                setSubjectGender('Macho');
                setStep(2);
              }}
              className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center text-center group cursor-pointer ${
                itemType === 'mascota'
                  ? 'border-[#00685d] bg-[#f4fffb] shadow-xs'
                  : 'border-[#bcc9c6] bg-white hover:border-[#00685d]'
              }`}
            >
              <span className="material-symbols-outlined text-4xl text-[#00685d] mb-2 group-hover:scale-110 transition-transform">
                pets
              </span>
              <span className="text-sm font-bold text-[#191c1d]">Mascota</span>
            </button>
          </div>
        </section>
      )}

      {/* STEP 2: ¿Quién está realizando este reporte? */}
      {step === 2 && (
        <section className="animate-fade-in">
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1d] mb-2">
            ¿Quién está realizando este reporte?
          </h2>
          <p className="text-sm text-[#3d4947] mb-6">
            Selecciona la opción que mejor describa tu relación con la persona o la situación.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => {
                setReporterRole('familiar');
                setStep(3);
              }}
              className="p-5 bg-white border border-[#bcc9c6] rounded-2xl flex flex-col items-center text-center hover:border-[#00685d] hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-[#f3f4f5] flex items-center justify-center mb-2 group-hover:bg-[#008376] transition-colors">
                <span className="material-symbols-outlined text-[#436370] group-hover:text-white text-3xl" data-weight="fill">
                  family_home
                </span>
              </div>
              <span className="text-base font-bold text-[#191c1d]">Familiar</span>
            </button>

            <button
              onClick={() => {
                setReporterRole('testigo');
                setStep(3);
              }}
              className="p-5 bg-white border border-[#bcc9c6] rounded-2xl flex flex-col items-center text-center hover:border-[#00685d] hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-[#f3f4f5] flex items-center justify-center mb-2 group-hover:bg-[#008376] transition-colors">
                <span className="material-symbols-outlined text-[#436370] group-hover:text-white text-3xl" data-weight="fill">
                  visibility
                </span>
              </div>
              <span className="text-base font-bold text-[#191c1d]">Testigo</span>
            </button>

            <button
              onClick={() => {
                setReporterRole('voluntario');
                setStep(3);
              }}
              className="p-5 bg-white border border-[#bcc9c6] rounded-2xl flex flex-col items-center text-center hover:border-[#00685d] hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-[#f3f4f5] flex items-center justify-center mb-2 group-hover:bg-[#008376] transition-colors">
                <span className="material-symbols-outlined text-[#436370] group-hover:text-white text-3xl" data-weight="fill">
                  volunteer_activism
                </span>
              </div>
              <span className="text-base font-bold text-[#191c1d]">Voluntario / Personal de Salud</span>
            </button>

            <button
              onClick={() => {
                setReporterRole('otra_persona');
                setStep(3);
              }}
              className="p-5 bg-white border border-[#bcc9c6] rounded-2xl flex flex-col items-center text-center hover:border-[#00685d] hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-[#f3f4f5] flex items-center justify-center mb-2 group-hover:bg-[#008376] transition-colors">
                <span className="material-symbols-outlined text-[#436370] group-hover:text-white text-3xl" data-weight="fill">
                  person
                </span>
              </div>
              <span className="text-base font-bold text-[#191c1d]">Otra persona</span>
            </button>
          </div>

          <div className="bg-[#f3f4f5] p-4 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-[#436370] shrink-0 mt-0.5">
              shield
            </span>
            <p className="text-xs text-[#3d4947] leading-relaxed">
              <strong>Privacidad:</strong> Tus datos personales no serán públicos y solo se usarán para verificación administrativa por seguridad de la persona reportada.
            </p>
          </div>
        </section>
      )}

      {/* STEP 3: Datos del Reportante */}
      {step === 3 && (
        <section className="bg-white p-6 rounded-2xl border border-[#e1e3e4] shadow-xs animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#008376] text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">family_restroom</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#191c1d]">Datos del Reportante</h2>
              <p className="text-xs text-[#3d4947]">Por favor, ingresa tus datos como {reporterRole}.</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep(4);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1">
                Nombre completo *
              </label>
              <input
                type="text"
                required
                placeholder="Ingrese su nombre completo"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#191c1d] mb-1">
                  Número de identificación *
                </label>
                <input
                  type="text"
                  required
                  placeholder="C.C., T.I., o Pasaporte"
                  value={reporterDoc}
                  onChange={(e) => setReporterDoc(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1d] mb-1">
                  Teléfono de contacto *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-[#6d7a77] text-[20px]">
                    call
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="Número celular (+57...)"
                    value={reporterPhone}
                    onChange={(e) => setReporterPhone(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#191c1d] mb-1">
                Relación con la persona reportada
              </label>
              <select
                value={reporterRel}
                onChange={(e) => setReporterRelationship(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none cursor-pointer"
              >
                <option value="Madre">Madre</option>
                <option value="Padre">Padre</option>
                <option value="Hijo/a">Hijo/a</option>
                <option value="Hermano/a">Hermano/a</option>
                <option value="Pareja">Pareja</option>
                <option value="Amigo/a">Amigo/a</option>
                <option value="Personal Médico">Personal Médico / Albergue</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="pt-4 border-t border-[#e1e3e4] flex justify-end">
              <button
                type="submit"
                className="h-12 px-8 bg-[#00685d] hover:bg-[#008376] text-white font-bold text-xs rounded-full shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                Siguiente
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* STEP 4: Información Detallada del Reporte */}
      {step === 4 && (
        <section className="bg-white p-6 rounded-2xl border border-[#e1e3e4] shadow-xs animate-fade-in">
          <h2 className="text-2xl font-extrabold text-[#191c1d] mb-1">
            Detalles del Caso ({itemType.toUpperCase()})
          </h2>
          <p className="text-xs text-[#3d4947] mb-6">
            Proporciona la mayor cantidad de información posible para facilitar la búsqueda.
          </p>

          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <ImageUploader
              items={imageItems}
              isUploading={isUploadingImages}
              maxImages={3}
              globalError={imageGlobalError}
              onAddFiles={onAddFiles}
              onRemoveImage={onRemoveImage}
              onRetryUpload={onRetryUpload}
              onSetPrimaryImage={onSetPrimaryImage}
              label="Fotografías del caso"
              helperText="Adjunta hasta 3 fotos (JPG, PNG, WEBP). Se optimizan automáticamente antes de subir."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#191c1d] mb-1">
                  {isPet ? 'Nombre de la mascota *' : 'Nombre o Descripción *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isPet ? "Ej. Lucas" : "Ej. Juan Pérez o 'Hombre alto con chaqueta azul'"}
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none"
                />
              </div>

              {isPet && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#191c1d] mb-1">Especie *</label>
                    <select
                      required
                      value={subjectSpecies}
                      onChange={(e) => setSubjectSpecies(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none"
                    >
                      {['Perro', 'Gato', 'Ave', 'Conejo', 'Otro'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#191c1d] mb-1">Raza</label>
                    <input
                      type="text"
                      placeholder="Ej. Pomerania, Criollo…"
                      value={subjectBreed}
                      onChange={(e) => setSubjectBreed(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#191c1d] mb-1">Color</label>
                    <input
                      type="text"
                      placeholder="Ej. Café con blanco"
                      value={subjectColor}
                      onChange={(e) => setSubjectColor(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-[#191c1d] mb-1">
                  Ciudad *
                </label>
                <select
                  required
                  value={subjectCityId}
                  onChange={(e) => setSubjectCityId(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none"
                >
                  <option value="" disabled>
                    {cities.length ? 'Selecciona una ciudad' : 'Cargando ciudades…'}
                  </option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1d] mb-1">
                  Barrio
                </label>
                <input
                  type="text"
                  placeholder="Ej. Chapinero, San Fernando…"
                  value={subjectNeighborhood}
                  onChange={(e) => setSubjectNeighborhood(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1d] mb-1">
                  Dirección o punto de referencia
                </label>
                <input
                  type="text"
                  placeholder="Ej. Carrera 7 # 32-16, cerca al parque…"
                  value={subjectAddress}
                  onChange={(e) => setSubjectAddress(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1d] mb-1">
                  Edad aproximada
                </label>
                <input
                  type="number"
                  placeholder="Ej. 28"
                  value={subjectAge}
                  onChange={(e) => setSubjectAge(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1d] mb-1">
                  Fecha de avistamiento / suceso
                </label>
                <input
                  type="date"
                  value={subjectDate}
                  onChange={(e) => setSubjectDate(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#191c1d] mb-1">Sexo</label>
                <div className="flex gap-4 h-12 items-center">
                  {(isPet ? ['Macho', 'Hembra'] : ['Masculino', 'Femenino']).map((g) => (
                    <label key={g} className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={subjectGender === g}
                        onChange={() => setSubjectGender(g)}
                        className="text-[#00685d]"
                      />
                      {g}
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#191c1d] mb-1">
                  Observaciones adicionales
                </label>
                <textarea
                  rows={4}
                  placeholder={isPet
                    ? 'Señas particulares (collar, manchas, tamaño), comportamiento, condición de salud...'
                    : 'Señas particulares (tatuajes, cicatrices), ropa que vestía, estado de salud...'}
                  value={subjectObs}
                  onChange={(e) => setSubjectObservations(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none"
                />
              </div>
            </div>

            <div className="bg-[#f3f4f5] p-4 rounded-xl flex items-start gap-3">
              <span className="material-symbols-outlined text-[#00685d] shrink-0 mt-0.5">
                shield_lock
              </span>
              <p className="text-xs text-[#3d4947]">
                <strong>Tu privacidad está protegida.</strong> Solo la información del caso será visible públicamente tras revisión de los moderadores.
              </p>
            </div>

            {submitError && (
              <div className="bg-[#ffdad6] text-[#93000a] p-3 rounded-xl text-xs font-semibold">
                {submitError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || checkingDup}
              className="w-full h-14 bg-[#00685d] hover:bg-[#008376] disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-full shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                {submitting || checkingDup ? 'hourglass_empty' : 'send'}
              </span>
              {checkingDup ? 'Verificando duplicados...' : submitting ? 'Enviando reporte...' : 'Publicar Reporte'}
            </button>
          </form>
        </section>
      )}

      {/* STEP 5: Confirmation */}
      {step === 5 && (
        <section className="bg-white rounded-2xl p-8 md:p-12 text-center border border-[#e1e3e4] shadow-sm animate-fade-in">
          <div className="w-20 h-20 bg-[#f4fffb] text-[#00685d] rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-[56px]" data-weight="fill">
              check_circle
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-[#191c1d] mb-3">
            Reporte recibido
          </h2>
          <p className="text-sm text-[#3d4947] max-w-md mx-auto mb-8 leading-relaxed">
            Tu reporte será revisado por el equipo antes de aparecer públicamente para garantizar la seguridad de la información. Gracias por ayudar a la comunidad.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
            <button
              onClick={onNavigateHome}
              className="h-12 px-6 bg-[#00685d] text-white font-bold text-xs rounded-full hover:bg-[#008376] transition-colors shadow-xs cursor-pointer"
            >
              Volver al inicio
            </button>
            <button
              onClick={onNavigateSearch}
              className="h-12 px-6 bg-white border border-[#bcc9c6] text-[#436370] font-bold text-xs rounded-full hover:bg-[#f3f4f5] transition-colors cursor-pointer"
            >
              Ver todos los casos
            </button>
          </div>
        </section>
      )}

      {/* Duplicate warning modal */}
      {duplicateMatches.length > 0 && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Posibles duplicados"
          onClick={cancelDuplicate}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[#e1e3e4] flex items-start gap-2">
              <span className="material-symbols-outlined text-[#8e5a00] mt-0.5">warning</span>
              <div>
                <h3 className="text-base font-bold text-[#191c1d]">Posible duplicado</h3>
                <p className="text-xs text-[#6d7a77]">
                  Ya existen registros parecidos en esta ciudad. Revisa si es alguno de estos antes de crear uno nuevo.
                </p>
              </div>
            </div>

            <ul className="p-4 space-y-2">
              {duplicateMatches.map((m) => (
                <li key={m.id} className="border border-[#e1e3e4] rounded-xl px-3 py-2">
                  <p className="text-sm font-bold text-[#191c1d]">{m.title}</p>
                  <p className="text-xs text-[#6d7a77]">{m.subtitle}</p>
                </li>
              ))}
            </ul>

            <div className="px-5 py-4 border-t border-[#e1e3e4] flex flex-col sm:flex-row gap-2">
              <button
                onClick={cancelDuplicate}
                className="flex-1 h-11 rounded-full border border-[#bcc9c6] text-[#3d4947] font-bold text-sm hover:bg-[#e7e8e9] transition-colors cursor-pointer"
              >
                Revisar / Cancelar
              </button>
              <button
                onClick={confirmNotDuplicate}
                disabled={submitting}
                className="flex-1 h-11 rounded-full bg-[#00685d] text-white font-bold text-sm hover:bg-[#008376] transition-colors disabled:opacity-50 cursor-pointer"
              >
                Es nuevo, continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
