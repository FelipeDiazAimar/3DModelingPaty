"use client";
import dynamic from "next/dynamic";
import { BatchTrack, BottomTable, SidePanel } from "@/components/Console";
import { useLatest, useStore } from "@/lib/store";

const Scene3D = dynamic(() => import("@/components/Scene3D"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm font-semibold text-muted">Cargando la planta…</div>,
});

export default function Home() {
  const last = useLatest();
  const setDemo = useStore((s) => s.setDemo);
  return (
    <div className="absolute inset-0">
      <Scene3D />
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute bottom-4 left-4 hidden md:block">
          <BatchTrack />
        </div>
        <div className="absolute inset-x-2 bottom-[118px] flex flex-col gap-2 md:hidden">
          <SidePanel />
        </div>
        <div className="absolute bottom-[84px] right-4 top-[84px] hidden w-[380px] max-w-[92vw] flex-col justify-end gap-3 md:flex">
          <SidePanel />
          <BottomTable />
        </div>
      </div>
      {!last && (
        <div className="glass pointer-events-auto absolute left-1/2 top-1/2 z-10 w-[min(460px,90vw)] -translate-x-1/2 -translate-y-1/2 p-6 text-center">
          <h2 className="text-[20px] font-extrabold tracking-tight">Esperando la simulación</h2>
          <p className="mt-2 text-[14px] text-muted">
            Abrí PLANTASJ.fsm en FlexSim y dale Run: los datos aparecen acá solos. Mientras tanto podés recorrer la planta o ver datos de ejemplo.
          </p>
          <button onClick={() => setDemo(true)} className="mt-4 rounded-full bg-ink px-5 py-2 text-[13px] font-bold text-white hover:opacity-90">
            Ver con datos de ejemplo
          </button>
        </div>
      )}
    </div>
  );
}
