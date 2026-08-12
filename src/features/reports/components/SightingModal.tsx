import React, { useState } from 'react';
import { PersonItem } from '../../persons/types/person';

interface SightingModalProps {
  item: PersonItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitSighting: (sighting: {
    location: string;
    date: string;
    details: string;
    contactName: string;
    contactPhone: string;
  }) => void;
}

export const SightingModal: React.FC<SightingModalProps> = ({
  item,
  isOpen,
  onClose,
  onSubmitSighting
}) => {
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [details, setDetails] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitSighting({ location, date, details, contactName, contactPhone });
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
      setLocation('');
      setDate('');
      setDetails('');
      setContactName('');
      setContactPhone('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#e1e3e4] relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#6d7a77] hover:bg-[#f3f4f5] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {isSubmitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#f4fffb] text-[#00685d] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[40px]" data-weight="fill">
                check_circle
              </span>
            </div>
            <h3 className="text-2xl font-bold text-[#191c1d] mb-2">
              ¡Información enviada!
            </h3>
            <p className="text-sm text-[#3d4947]">
              Gracias por tu colaboración. Tu reporte será tratado con urgencia y confidencialidad por el equipo y la familia.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#e1e3e4]">
              <div className="w-12 h-12 rounded-lg bg-[#e7e8e9] overflow-hidden shrink-0">
                <img src={item.photo} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-xs uppercase font-bold text-[#ba1a1a] tracking-wider">
                  Aportar información sobre
                </span>
                <h3 className="text-lg font-bold text-[#191c1d]">{item.name}</h3>
                <p className="text-xs text-[#6d7a77] font-mono">{item.code}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#191c1d] mb-1">
                  ¿Dónde y cuándo lo/la viste? *
                </label>
                <div className="relative mb-2">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#6d7a77] text-[18px]">
                    location_on
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Estación Calle 72, Bogotá / Parque principal"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#f8f9fa] border border-[#bcc9c6] rounded-lg text-sm text-[#191c1d] focus:border-[#00685d] focus:ring-1 focus:ring-[#00685d] outline-none"
                  />
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#6d7a77] text-[18px]">
                    calendar_today
                  </span>
                  <input
                    type="datetime-local"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#f8f9fa] border border-[#bcc9c6] rounded-lg text-sm text-[#191c1d] focus:border-[#00685d] focus:ring-1 focus:ring-[#00685d] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191c1d] mb-1">
                  Detalles del avistamiento *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe la ropa, estado de salud, compañía o dirección hacia la que se desplazaba..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full p-3 bg-[#f8f9fa] border border-[#bcc9c6] rounded-lg text-sm text-[#191c1d] focus:border-[#00685d] focus:ring-1 focus:ring-[#00685d] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#191c1d] mb-1">
                    Tu nombre (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Tu nombre completo"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#bcc9c6] rounded-lg text-sm text-[#191c1d] focus:border-[#00685d] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#191c1d] mb-1">
                    Teléfono de contacto (Opcional)
                  </label>
                  <input
                    type="tel"
                    placeholder="Celular para verificación"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8f9fa] border border-[#bcc9c6] rounded-lg text-sm text-[#191c1d] focus:border-[#00685d] outline-none"
                  />
                </div>
              </div>

              <div className="bg-[#f3f4f5] p-3 rounded-lg flex items-start gap-2.5 text-xs text-[#3d4947]">
                <span className="material-symbols-outlined text-[#00685d] text-[18px] shrink-0 mt-0.5">
                  shield_lock
                </span>
                <span>
                  <strong>Tu datos están protegidos.</strong> Solo la persona autorizada o las autoridades coordinadoras recibirán este avistamiento.
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#00685d] hover:bg-[#008376] text-white font-bold rounded-full text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                Enviar Información
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
