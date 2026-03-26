
"use client";
import BodegasList from "../bodegas/BodegasList";
import { useEffect, useState } from "react";

export default function TenderoPage() {
  const [bodegas, setBodegas] = useState([]);
  useEffect(() => {
    fetch("/api/bodegas")
      .then((res) => res.json())
      .then((data) => setBodegas(data.bodegas || []));
  }, []);
  return (
    <main className="mx-auto w-full max-w-5xl px-2 py-4">
      <h1 className="text-2xl font-bold mb-6">Selecciona una bodega</h1>
      <BodegasList bodegas={bodegas} />
    </main>
  );
}
