import PanelPage from "../bodega/[bodegaId]/(panel)/panel/page";

export default function BodegaRootPage() {
  // Renderizar el panel de gestión de la bodega principal directamente
  // Simulamos el parámetro params como lo espera PanelPage
  return <PanelPage params={Promise.resolve({ bodegaId: "BOD_001" })} />;
}
