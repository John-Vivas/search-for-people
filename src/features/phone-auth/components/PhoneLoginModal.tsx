import React, { useEffect, useRef, useState } from 'react';
import { phoneAuthService } from '@/src/features/phone-auth/services/phoneAuth.service';
import { usePhoneSession } from '@/src/features/phone-auth/hooks/usePhoneSession';
import { OtpCodeInput } from '@/src/features/phone-auth/components/OtpCodeInput';

interface PhoneLoginModalProps {
  open: boolean;
  onClose: () => void;
  /** Fires once the phone is verified and the session cookie is set. */
  onSuccess?: () => void;
}

type Step = 'phone' | 'code';

const CODE_LENGTH = 6;
const CODE_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;

/** "3001234567" → "300 ••• ••67" — keeps enough to recognize it's yours, hides the rest. */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 5) return phone;
  const head = digits.slice(0, 3);
  const tail = digits.slice(-2);
  const maskedLength = digits.length - head.length - tail.length;
  return `${head} ${'•'.repeat(maskedLength)} ${tail}`;
}

export const PhoneLoginModal: React.FC<PhoneLoginModalProps> = ({ open, onClose, onSuccess }) => {
  const { setPhone } = usePhoneSession();
  const [step, setStep] = useState<Step>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, []);

  if (!open) return null;

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1 && cooldownTimer.current) {
          clearInterval(cooldownTimer.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const reset = () => {
    setStep('phone');
    setPhoneInput('');
    setCode('');
    setError(null);
    setHelpOpen(false);
    setCooldown(0);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const sendCode = async () => {
    setError(null);
    setSubmitting(true);
    const res = await phoneAuthService.requestCode(phoneInput.trim());
    setSubmitting(false);
    if (res.error) {
      setError(res.error.message || 'No se pudo enviar el código');
      return false;
    }
    startCooldown();
    return true;
  };

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await sendCode()) setStep('code');
  };

  const handleResend = async () => {
    if (cooldown > 0 || submitting) return;
    setCode('');
    await sendCode();
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await phoneAuthService.login(phoneInput.trim(), code.trim());
    setSubmitting(false);
    if (res.error) {
      setError(res.error.message || 'Código incorrecto');
      return;
    }
    setPhone(phoneInput.trim());
    reset();
    onClose();
    onSuccess?.();
  };

  const inputCls =
    'w-full h-11 px-3 rounded-xl border border-[#bcc9c6] bg-[#f8f9fa] text-sm text-[#191c1d] focus:border-[#00685d] outline-none';
  const labelCls = 'block text-xs font-bold text-[#191c1d] mb-1';

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Iniciar sesión con tu teléfono"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-sm sm:rounded-2xl rounded-t-2xl shadow-2xl p-5"
      >
        {step === 'phone' ? (
          <form onSubmit={requestCode}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-[#191c1d]">Inicia sesión con tu teléfono</h3>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 -m-2 rounded-full text-[#436370] hover:bg-[#e7e8e9] cursor-pointer"
                aria-label="Cerrar"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="text-sm text-[#6d7a77] mb-4">
              Necesario para publicar una solicitud, comprometerte a ayudar, y ver los números de contacto.
            </p>

            <label className={labelCls}>Número de teléfono</label>
            <input
              type="tel"
              required
              autoFocus
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Ej. 3001234567"
              className={inputCls}
            />

            {error && <p className="text-sm text-[#ba1a1a] font-medium mt-3">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 mt-4 rounded-full bg-[#00685d] text-white font-bold text-sm hover:bg-[#008376] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Enviando…' : 'Enviar código'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode}>
            <div className="flex items-center gap-1 mb-3">
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setCode('');
                  setError(null);
                }}
                className="p-2 -m-2 rounded-full text-[#436370] hover:bg-[#e7e8e9] cursor-pointer"
                aria-label="Volver"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <span className="text-xs font-bold tracking-wide text-[#6d7a77] uppercase">Estamos Buscando</span>
              <button
                type="button"
                onClick={handleClose}
                className="ml-auto p-2 -m-2 rounded-full text-[#436370] hover:bg-[#e7e8e9] cursor-pointer"
                aria-label="Cerrar"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <h3 className="text-xl font-extrabold text-[#191c1d] leading-snug">
              Ingresa el código que enviamos a tu teléfono
            </h3>

            <p className="text-sm text-[#3d4947] mt-2">
              {maskPhone(phoneInput)}{' '}
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setCode('');
                  setError(null);
                }}
                className="font-bold text-[#00685d] hover:underline cursor-pointer"
              >
                Cambiar
              </button>
            </p>

            <div className="mt-4">
              <OtpCodeInput length={CODE_LENGTH} value={code} onChange={setCode} autoFocus disabled={submitting} />
            </div>

            <p className="text-xs text-[#6d7a77] mt-3">
              Este código vence en {CODE_TTL_MINUTES} minutos.
            </p>
            <p className="text-xs text-[#6d7a77]">
              ¿No te llegó?{' '}
              {cooldown > 0 ? (
                <span className="text-[#9ba5a2]">Reenviar código ({cooldown}s)</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={submitting}
                  className="font-bold text-[#00685d] hover:underline cursor-pointer disabled:opacity-50"
                >
                  Reenviar código
                </button>
              )}
            </p>

            {error && <p className="text-sm text-[#ba1a1a] font-medium mt-3">{error}</p>}

            <button
              type="submit"
              disabled={submitting || code.length < CODE_LENGTH}
              className="w-full h-12 mt-4 rounded-full bg-[#00685d] text-white font-bold text-sm hover:bg-[#008376] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Verificando…' : 'Confirmar código'}
            </button>

            <div className="mt-4 border-t border-[#e1e3e4] pt-3">
              <button
                type="button"
                onClick={() => setHelpOpen((v) => !v)}
                className="w-full flex items-center justify-between text-sm font-bold text-[#191c1d] cursor-pointer"
              >
                Obtener ayuda
                <span className={`material-symbols-outlined text-[20px] transition-transform ${helpOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
              {helpOpen && (
                <ul className="mt-2 text-xs text-[#6d7a77] space-y-1.5 list-disc pl-4">
                  <li>Revisa que el número esté bien escrito.</li>
                  <li>A veces el SMS demora unos segundos en llegar.</li>
                  <li>Verifica que tengas señal o datos móviles activos.</li>
                  <li>Si sigue sin llegar, espera un momento y pide un código nuevo.</li>
                </ul>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
