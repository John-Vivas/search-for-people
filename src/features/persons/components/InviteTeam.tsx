import React, { useState } from 'react';

/**
 * CTA para que la gente sume a su equipo/familia/comunidad a reportar.
 * Entre más personas reporten y compartan, más rápido se encuentran los casos.
 * Comparte por WhatsApp (ideal para equipos), share nativo o copiar link.
 */
export const InviteTeam: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined' ? window.location.origin : 'https://www.alertavivo.co';
  const message = `🔎 Ayúdanos a encontrar personas y mascotas en emergencias. Reporta o comparte información en *Estamos Buscando*: ${url}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const nativeShare = () => {
    if (navigator.share) {
      navigator
        .share({ title: 'Estamos Buscando', text: message, url })
        .catch(() => {});
    } else {
      copyLink();
    }
  };

  return (
    <section className="mb-10 max-w-5xl mx-auto px-4">
      <div className="rounded-2xl border border-[#e1e3e4] bg-white p-5 md:p-6 shadow-xs flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <span className="w-12 h-12 rounded-xl bg-[#f4fffb] border border-[#00685d]/25 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#00685d] text-[26px]">group_add</span>
          </span>
          <div>
            <h3 className="text-base md:text-lg font-bold text-[#191c1d]">Invita a tu equipo a reportar</h3>
            <p className="text-sm text-[#3d4947] leading-relaxed">
              Entre más personas reporten y compartan, más rápido se encuentran. Suma a tu equipo, familia o comunidad.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-4 rounded-xl bg-[#25D366] text-white font-bold text-sm flex items-center justify-center gap-2 hover:brightness-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
            WhatsApp
          </a>
          <button
            onClick={nativeShare}
            className="h-11 px-4 rounded-xl border border-[#00685d] text-[#00685d] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#f4fffb] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
            Compartir
          </button>
          <button
            onClick={copyLink}
            className="h-11 px-4 rounded-xl border border-[#bcc9c6] text-[#3d4947] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#f3f4f5] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              {copied ? 'check' : 'link'}
            </span>
            {copied ? '¡Copiado!' : 'Copiar link'}
          </button>
        </div>
      </div>
    </section>
  );
};
