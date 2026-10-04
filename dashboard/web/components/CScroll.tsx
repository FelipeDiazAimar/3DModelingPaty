"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/** Contenedor con scroll vertical y barra propia (redondeada, se ensancha al pasar el mouse, arrastrable). */
export function CScroll({ children, className = "", innerClassName = "" }: { children: ReactNode; className?: string; innerClassName?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ top: 0, h: 0, show: false });
  const [drag, setDrag] = useState(false);

  const measure = useCallback(() => {
    const el = box.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const show = scrollHeight > clientHeight + 1;
    const track = clientHeight - 12;
    const h = Math.max(36, (clientHeight / scrollHeight) * track);
    const top = 6 + (scrollTop / Math.max(1, scrollHeight - clientHeight)) * (track - h);
    setThumb((p) => (p.top === top && p.h === h && p.show === show ? p : { top, h, show }));
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    const mo = new MutationObserver(measure);
    mo.observe(el, { childList: true, subtree: true });
    return () => { ro.disconnect(); mo.disconnect(); };
  }, [measure]);

  const onThumbDown = (e: React.PointerEvent) => {
    const el = box.current;
    if (!el) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const startY = e.clientY, startScroll = el.scrollTop;
    const track = el.clientHeight - 12 - thumb.h;
    const ratio = (el.scrollHeight - el.clientHeight) / Math.max(1, track);
    setDrag(true);
    const move = (ev: PointerEvent) => { el.scrollTop = startScroll + (ev.clientY - startY) * ratio; };
    const up = () => { setDrag(false); window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div className={`cscroll relative ${className}`}>
      <div ref={box} onScroll={measure} className={`cscroll-inner h-full overflow-y-auto overflow-x-hidden ${innerClassName}`}>{children}</div>
      {thumb.show && (
        <div className={`cscroll-track ${drag ? "cscroll-drag" : ""}`} aria-hidden>
          <div className="cscroll-thumb" style={{ top: thumb.top, height: thumb.h }} onPointerDown={onThumbDown} />
        </div>
      )}
    </div>
  );
}
