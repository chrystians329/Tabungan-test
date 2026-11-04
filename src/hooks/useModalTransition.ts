import { useEffect, useRef, useState } from 'react';

/**
 * Menjaga overlay / panel tetap ter-mount selama animasi menutup,
 * supaya transisi close terlihat (bukan langsung hilang).
 *
 * @param isOpen     status buka dari komponen pemanggil
 * @param durationMs durasi animasi close (ms) sebelum benar-benar di-unmount
 * @returns [mounted, isClosing]
 *          - mounted   : apakah elemen harus dirender
 *          - isClosing : sedang memainkan animasi close (pakai class *-out)
 */
export const useModalTransition = (
  isOpen: boolean,
  durationMs = 200
): [boolean, boolean] => {
  const [mounted, setMounted] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const mountedRef = useRef(isOpen);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (isOpen) {
      mountedRef.current = true;
      setMounted(true);
      setIsClosing(false);
      return;
    }

    // Sudah tertutup penuh, tidak ada yang perlu dianimasikan
    if (!mountedRef.current) return;

    setIsClosing(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      mountedRef.current = false;
      setIsClosing(false);
      setMounted(false);
    }, durationMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isOpen, durationMs]);

  return [mounted, isClosing];
};

export default useModalTransition;
