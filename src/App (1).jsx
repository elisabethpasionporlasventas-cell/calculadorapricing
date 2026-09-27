import { useState, useEffect, useCallback } from "react";
import { Ruler, Stamp, Save, Trash2, Sparkles, Loader2, ChevronDown, Plus, Info, Calculator, AlertTriangle, CheckCircle2, TriangleAlert, Package, Briefcase } from "lucide-react";

const fmt = (n) =>
  (isFinite(n) ? n : 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const IVA_OPTIONS = [
  { v: 21, label: "21% — General" },
  { v: 10, label: "10% — Reducido" },
  { v: 4, label: "4% — Superreducido" },
  { v: 0, label: "0% — Exento" },
];

const UNIDADES = ["ud", "kg", "g", "l", "ml", "m", "cm", "h", "min"];
const STORAGE_KEY = "escandallos-lista";
const OTRO = "Otro / no listado";

const SECTORES_PRODUCTO = [
  "Alimentación y bebidas",
  "Cosmética y cuidado personal",
  "Moda, textil y complementos",
  "Cerámica, decoración y hogar",
  "Joyería y bisutería",
  "Papelería, arte e ilustración",
  "Velas, jabones y aromas",
  "Juguetería e infantil",
  "Mascotas y accesorios",
  OTRO,
];

const SECTORES_SERVICIO = [
  "Consultoría y asesoría de negocio",
  "Marketing, comunicación y diseño",
  "Formación, coaching y educación",
  "Salud, bienestar y terapias",
  "Tecnología, desarrollo e IT",
  "Reformas, mantenimiento y oficios",
  "Eventos y organización",
  "Servicios legales y administrativos",
  "Fotografía y producción audiovisual",
  OTRO,
];

let uidCounter = 1;
const uid = () => `it-${Date.now()}-${uidCounter++}`;

const C = {
  bg: "#F5F0E6",
  panel: "#FFFDF8",
  border: "#DCD1BC",
  text: "#2B2620",
  muted: "#8C8270",
  tierra: "#AE5B2B",
  tierraSoft: "rgba(174,91,43,0.10)",
  oliva: "#6C7A45",
  olivaSoft: "rgba(108,122,69,0.10)",
  alerta: "#9C3B2B",
  alertaSoft: "rgba(156,59,43,0.10)",
};

function Panel({ children, className = "", title, tag, hint }) {
  return (
    <div className={`relative border ${className}`} style={{ borderColor: C.border, background: C.panel }}>
      <div className="absolute -top-3 left-4 px-2 text-[10px] tracking-[0.2em] uppercase font-['JetBrains_Mono'] flex items-center gap-1.5" style={{ background: C.bg, color: C.muted }}>
        {tag && <span style={{ color: C.tierra }}>{tag}</span>}
        {title}
      </div>
      {hint && <p className="text-[10px] leading-relaxed px-4 pt-5 -mb-2" style={{ color: C.muted }}>{hint}</p>}
      {children}
    </div>
  );
}

function DimLine({ label, value, accent = C.oliva }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px relative" style={{ background: C.border }}>
        <span className="absolute -left-1 -top-[3px] w-[7px] h-[7px] border-l border-t rotate-[-45deg]" style={{ borderColor: C.border }} />
        <span className="absolute -right-1 -top-[3px] w-[7px] h-[7px] border-r border-t rotate-45" style={{ borderColor: C.border }} />
      </div>
      <span className="text-[10px] uppercase tracking-wider font-['JetBrains_Mono'] whitespace-nowrap" style={{ color: C.muted }}>{label}</span>
      <span className="text-xs font-['JetBrains_Mono'] font-semibold whitespace-nowrap" style={{ color: accent }}>{value}</span>
    </div>
  );
}

function SectorSelect({ value, onChange, options }) {
  const isOtro = value && !options.includes(value) ? true : value === OTRO;
  return (
    <div className="space-y-1.5">
      <select
        value={options.includes(value) ? value : OTRO}
        onChange={(e) => onChange(e.target.value === OTRO ? "" : e.target.value)}
        className="w-full border px-3 py-2 text-sm outline-none"
        style={{ background: C.bg, borderColor: C.border, color: C.text }}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {isOtro && (
        <input
          value={value === OTRO ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Especifica tu sector"
          className="w-full border px-3 py-2 text-sm outline-none"
          style={{ background: C.bg, borderColor: C.border, color: C.text }}
        />
      )}
    </div>
  );
}

const lineTotal = (it) => {
  const base = (it.cantidad || 0) * (it.precio || 0);
  const merma = Math.min(it.merma || 0, 95);
  return merma > 0 ? base / (1 - merma / 100) : base;
};
const sumItems = (items) => items.reduce((s, it) => s + lineTotal(it), 0);

function ItemList({ items, setItems, placeholder, showMerma = true, showCalc = false, calcType = "compra" }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => setItems(items.filter((it) => it.id !== id));
  const add = () => setItems([...items, { id: uid(), nombre: "", cantidad: 1, unidad: "ud", precio: 0, merma: 0 }]);
  const total = sumItems(items);
  const cols = showMerma ? "grid-cols-[1fr_46px_50px_58px_46px_58px_auto]" : "grid-cols-[1fr_52px_54px_64px_60px_auto]";

  const toggleCalc = (id) => update(id, { _calcOpen: !items.find((it) => it.id === id)?._calcOpen });
  const aplicarCalc = (it) => {
    const a = parseFloat(it._calcA) || 0;
    const b = parseFloat(it._calcB) || 0;
    if (b > 0) {
      if (calcType === "lote") update(it.id, { cantidad: Math.round((a / b) * 1000) / 1000, _calcOpen: false });
      else update(it.id, { precio: Math.round((a / b) * 1000) / 1000, _calcOpen: false });
    }
  };

  const inputStyle = { background: C.bg, borderColor: C.border, color: C.text };

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className={`grid ${cols} gap-1.5 text-[9px] uppercase tracking-wide px-0.5`} style={{ color: C.muted }}>
          <span>Nombre</span><span>Cant.</span><span>Ud.</span><span>€/ud</span>
          {showMerma && <span title="% que se pierde/desecha">Merma</span>}
          <span className="text-right">Subtotal</span><span />
        </div>
      )}
      {items.length === 0 && <p className="text-[11px] italic" style={{ color: C.muted }}>{placeholder}</p>}
      {items.map((it) => (
        <div key={it.id}>
          <div className={`grid ${cols} gap-1.5 items-center`}>
            <input value={it.nombre} onChange={(e) => update(it.id, { nombre: e.target.value })} placeholder="Nombre"
              className="border px-2 py-1.5 text-xs outline-none" style={inputStyle} />
            <input type="number" step="0.01" value={it.cantidad} onChange={(e) => update(it.id, { cantidad: parseFloat(e.target.value) || 0 })}
              className="border px-1.5 py-1.5 text-xs font-['JetBrains_Mono'] outline-none" style={inputStyle} />
            <select value={it.unidad} onChange={(e) => update(it.id, { unidad: e.target.value })}
              className="border px-1 py-1.5 text-xs outline-none" style={inputStyle}>
              {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <input type="number" step="0.01" value={it.precio} onChange={(e) => update(it.id, { precio: parseFloat(e.target.value) || 0 })}
              title="Precio por unidad (€)" className="border px-1.5 py-1.5 text-xs font-['JetBrains_Mono'] outline-none" style={inputStyle} />
            {showMerma && (
              <input type="number" step="1" value={it.merma || 0} onChange={(e) => update(it.id, { merma: parseFloat(e.target.value) || 0 })}
                title="% de merma" className="border px-1.5 py-1.5 text-xs font-['JetBrains_Mono'] outline-none" style={inputStyle} />
            )}
            <span className="text-[11px] font-['JetBrains_Mono'] text-right pr-1" style={{ color: C.muted }}>{fmt(lineTotal(it))}€</span>
            <button onClick={() => remove(it.id)} className="p-1" style={{ color: C.alerta }}><Trash2 size={13} /></button>
          </div>
          {showCalc && (
            <div className="pl-0.5 mt-1">
              <button onClick={() => toggleCalc(it.id)} className="flex items-center gap-1 text-[10px]" style={{ color: C.oliva }}>
                <Calculator size={11} />
                {it._calcOpen ? "Cerrar calculadora" : calcType === "lote" ? "¿Trabajas por lotes? Calcula horas/ud" : "¿Compras en bloque? Calcula el precio/ud"}
              </button>
              {it._calcOpen && (
                <div className="mt-1.5 flex flex-wrap items-end gap-2 border p-2" style={{ background: C.bg, borderColor: C.border }}>
                  <label className="text-[10px]" style={{ color: C.muted }}>
                    {calcType === "lote" ? "Tiempo total del lote (h)" : "Coste total compra"}
                    <input type="number" step="0.01" value={it._calcA || ""} onChange={(e) => update(it.id, { _calcA: e.target.value })}
                      placeholder={calcType === "lote" ? "ej. 3" : "ej. 10"} className="block w-24 mt-0.5 border px-2 py-1 text-xs font-['JetBrains_Mono'] outline-none"
                      style={{ background: C.panel, borderColor: C.border, color: C.text }} />
                  </label>
                  <label className="text-[10px]" style={{ color: C.muted }}>
                    {calcType === "lote" ? "Unidades que salen del lote" : "Uds/kg/etc. compradas"}
                    <input type="number" step="0.01" value={it._calcB || ""} onChange={(e) => update(it.id, { _calcB: e.target.value })}
                      placeholder="ej. 5" className="block w-24 mt-0.5 border px-2 py-1 text-xs font-['JetBrains_Mono'] outline-none"
                      style={{ background: C.panel, borderColor: C.border, color: C.text }} />
                  </label>
                  <button onClick={() => aplicarCalc(it)} className="text-[10px] font-semibold px-3 py-1.5 uppercase tracking-wide" style={{ background: C.tierra, color: "#fff" }}>
                    {calcType === "lote" ? "Usar estas h/ud" : "Usar este €/ud"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1 text-[11px] uppercase tracking-wide mt-1" style={{ color: C.oliva }}>
        <Plus size={13} /> Añadir
      </button>
      <div className="flex justify-between items-center border-t pt-2 mt-2" style={{ borderColor: C.border }}>
        <span className="text-[11px] uppercase tracking-wide" style={{ color: C.muted }}>Subtotal</span>
        <span className="font-['JetBrains_Mono'] text-sm font-semibold" style={{ color: C.text }}>{fmt(total)} €</span>
      </div>
    </div>
  );
}

function IndirectList({ items, setItems, unitLabel = "€/mes" }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => setItems(items.filter((it) => it.id !== id));
  const add = () => setItems([...items, { id: uid(), nombre: "", importe: 0 }]);
  const total = items.reduce((s, it) => s + (it.importe || 0), 0);

  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="text-[11px] italic" style={{ color: C.muted }}>Alquiler, luz, seguros, herramientas, software…</p>}
      {items.map((it) => (
        <div key={it.id} className="grid grid-cols-[1fr_90px_auto] gap-1.5 items-center">
          <input value={it.nombre} onChange={(e) => update(it.id, { nombre: e.target.value })} placeholder="Concepto"
            className="border px-2 py-1.5 text-xs outline-none" style={{ background: C.bg, borderColor: C.border, color: C.text }} />
          <div className="flex items-center border" style={{ background: C.bg, borderColor: C.border }}>
            <input type="number" step="0.01" value={it.importe} onChange={(e) => update(it.id, { importe: parseFloat(e.target.value) || 0 })}
              className="w-full bg-transparent px-2 py-1.5 text-xs font-['JetBrains_Mono'] outline-none" style={{ color: C.text }} />
            <span className="pr-2 text-[10px]" style={{ color: C.oliva }}>{unitLabel}</span>
          </div>
          <button onClick={() => remove(it.id)} className="p-1" style={{ color: C.alerta }}><Trash2 size={13} /></button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1 text-[11px] uppercase tracking-wide mt-1" style={{ color: C.oliva }}>
        <Plus size={13} /> Añadir
      </button>
      <div className="flex justify-between items-center border-t pt-2 mt-2" style={{ borderColor: C.border }}>
        <span className="text-[11px] uppercase tracking-wide" style={{ color: C.muted }}>Total fijo / mes</span>
        <span className="font-['JetBrains_Mono'] text-sm font-semibold" style={{ color: C.text }}>{fmt(total)} €</span>
      </div>
    </div>
  );
}

function CanalList({ canales, setCanales, pvpSinIva, beneficioBruto, marketingImporte, irpfEfectivo }) {
  const update = (id, patch) => setCanales(canales.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const remove = (id) => setCanales(canales.filter((c) => c.id !== id));
  const add = () => setCanales([...canales, { id: uid(), nombre: "", tipo: "porcentaje", valor: 0 }]);

  const calc = (c) => {
    const comision = c.tipo === "porcentaje" ? pvpSinIva * ((c.valor || 0) / 100) : c.valor || 0;
    const antesImp = beneficioBruto - marketingImporte - comision;
    const provision = Math.max(antesImp, 0) * (irpfEfectivo / 100);
    return { neto: antesImp - provision };
  };

  return (
    <div className="space-y-2">
      {canales.map((c) => {
        const { neto } = calc(c);
        return (
          <div key={c.id} className="grid grid-cols-[1fr_70px_60px_70px_auto] gap-1.5 items-center">
            <input value={c.nombre} onChange={(e) => update(c.id, { nombre: e.target.value })} placeholder="ej. Etsy, feria, referidos…"
              className="border px-2 py-1.5 text-xs outline-none" style={{ background: C.bg, borderColor: C.border, color: C.text }} />
            <select value={c.tipo} onChange={(e) => update(c.id, { tipo: e.target.value })}
              className="border px-1 py-1.5 text-xs outline-none" style={{ background: C.bg, borderColor: C.border, color: C.text }}>
              <option value="porcentaje">%</option>
              <option value="fijo">€ fijo</option>
            </select>
            <input type="number" step="0.01" value={c.valor} onChange={(e) => update(c.id, { valor: parseFloat(e.target.value) || 0 })}
              className="border px-1.5 py-1.5 text-xs font-['JetBrains_Mono'] outline-none" style={{ background: C.bg, borderColor: C.border, color: C.text }} />
            <span className="text-[11px] font-['JetBrains_Mono'] text-right pr-1 font-semibold" style={{ color: C.oliva }}>{fmt(neto)}€</span>
            <button onClick={() => remove(c.id)} className="p-1" style={{ color: C.alerta }}><Trash2 size={13} /></button>
          </div>
        );
      })}
      <button onClick={add} className="flex items-center gap-1 text-[11px] uppercase tracking-wide mt-1" style={{ color: C.oliva }}>
        <Plus size={13} /> Añadir canal
      </button>
      <p className="text-[10px] pt-1" style={{ color: C.muted }}>La columna de la derecha es lo que te quedaría por venta en ese canal.</p>
    </div>
  );
}

export default function App() {
  const [modo, setModo] = useState("producto"); // producto | servicio

  const [nombre, setNombre] = useState("Mi producto");
  const [sector, setSector] = useState(SECTORES_PRODUCTO[0]);
  const [sectorServicio, setSectorServicio] = useState(SECTORES_SERVICIO[0]);

  // ---- Producto ----
  const [materiales, setMateriales] = useState([{ id: uid(), nombre: "Materia prima", cantidad: 1, unidad: "kg", precio: 3.5, merma: 5 }]);
  const [packaging, setPackaging] = useState([
    { id: uid(), nombre: "Caja", cantidad: 1, unidad: "ud", precio: 0.5, merma: 0 },
    { id: uid(), nombre: "Etiqueta", cantidad: 1, unidad: "ud", precio: 0.15, merma: 0 },
  ]);
  const [manoObra, setManoObra] = useState([{ id: uid(), nombre: "Elaboración", cantidad: 0.25, unidad: "h", precio: 12, merma: 0 }]);
  const [otros, setOtros] = useState([]);
  const [indirectos, setIndirectos] = useState([]);
  const [unidadesMes, setUnidadesMes] = useState(100);

  // ---- Servicio ----
  const [horasPrep, setHorasPrep] = useState(1);
  const [horasEjec, setHorasEjec] = useState(3);
  const [horasSeguimiento, setHorasSeguimiento] = useState(0.5);
  const [tarifaHoraCoste, setTarifaHoraCoste] = useState(0);
  const [capacidadFacturableMes, setCapacidadFacturableMes] = useState(60);
  const [indirectosServicio, setIndirectosServicio] = useState([]);
  const [otrosServicio, setOtrosServicio] = useState([]);
  const [tipoCliente, setTipoCliente] = useState("empresa"); // empresa | particular
  const [nuevoAutonomo, setNuevoAutonomo] = useState(false);

  // ---- Compartido ----
  const [modoMargen, setModoMargen] = useState("coste");
  const [margen, setMargen] = useState(45);
  const [iva, setIva] = useState(21);
  const [irpf, setIrpf] = useState(20);
  const [irpfOpen, setIrpfOpen] = useState(false);

  const [marketingPct, setMarketingPct] = useState(5);
  const [canales, setCanales] = useState([{ id: uid(), nombre: "Venta directa", tipo: "porcentaje", valor: 0 }]);

  const [precioActualConIva, setPrecioActualConIva] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiSugerencia, setAiSugerencia] = useState(null);

  const [guardados, setGuardados] = useState([]);
  const [saveMsg, setSaveMsg] = useState("");

  // --- Cálculo producto ---
  const costeMateriales = sumItems(materiales);
  const costePackaging = sumItems(packaging);
  const costeManoObra = sumItems(manoObra);
  const costeOtros = sumItems(otros);
  const totalIndirectosMes = indirectos.reduce((s, it) => s + (it.importe || 0), 0);
  const costeIndirectoUnitario = unidadesMes > 0 ? totalIndirectosMes / unidadesMes : 0;
  const costeTotalProducto = costeMateriales + costePackaging + costeManoObra + costeOtros + costeIndirectoUnitario;

  // --- Cálculo servicio ---
  const horasTotalesServicio = (horasPrep || 0) + (horasEjec || 0) + (horasSeguimiento || 0);
  const costeManoObraServicio = horasTotalesServicio * (tarifaHoraCoste || 0);
  const totalIndirectosServicioMes = indirectosServicio.reduce((s, it) => s + (it.importe || 0), 0);
  const costeIndirectoPorHora = capacidadFacturableMes > 0 ? totalIndirectosServicioMes / capacidadFacturableMes : 0;
  const costeIndirectoServicio = costeIndirectoPorHora * horasTotalesServicio;
  const costeOtrosServicio = sumItems(otrosServicio);
  const costeTotalServicio = costeManoObraServicio + costeIndirectoServicio + costeOtrosServicio;

  // --- Coste activo según modo (todo lo de abajo es compartido) ---
  const costeTotal = modo === "producto" ? costeTotalProducto : costeTotalServicio;

  const pvpSinIva = modoMargen === "coste" ? costeTotal * (1 + margen / 100) : margen < 100 ? costeTotal / (1 - margen / 100) : costeTotal;
  const beneficioBruto = pvpSinIva - costeTotal;
  const ivaImporte = pvpSinIva * (iva / 100);
  const pvpFinal = pvpSinIva + ivaImporte;
  const margenReal = pvpSinIva > 0 ? (beneficioBruto / pvpSinIva) * 100 : 0;

  const marketingImporte = pvpSinIva * (marketingPct / 100);
  const canalPrincipal = canales[0] || { nombre: "", tipo: "porcentaje", valor: 0 };
  const comisionImporte = canalPrincipal.tipo === "porcentaje" ? pvpSinIva * ((canalPrincipal.valor || 0) / 100) : canalPrincipal.valor || 0;
  const margenTrasComerciales = beneficioBruto - marketingImporte - comisionImporte;

  // IRPF: retención real (servicio a empresa) vs provisión estimada (producto, o servicio a particular)
  const esRetencionReal = modo === "servicio" && tipoCliente === "empresa";
  const irpfEfectivo = esRetencionReal ? (nuevoAutonomo ? 7 : 15) : irpf;
  const provisionIrpf = Math.max(margenTrasComerciales, 0) * (irpfEfectivo / 100);
  const estimacionFinal = margenTrasComerciales - provisionIrpf;

  const precioActualNum = parseFloat(precioActualConIva) || 0;
  const tieneComparador = precioActualNum > 0;
  const precioActualSinIva = tieneComparador ? precioActualNum / (1 + iva / 100) : 0;
  const beneficioActualBruto = precioActualSinIva - costeTotal;
  const marketingActual = precioActualSinIva * (marketingPct / 100);
  const comisionActual = canalPrincipal.tipo === "porcentaje" ? precioActualSinIva * ((canalPrincipal.valor || 0) / 100) : canalPrincipal.valor || 0;
  const margenActualTrasComerciales = beneficioActualBruto - marketingActual - comisionActual;
  const provisionIrpfActual = Math.max(margenActualTrasComerciales, 0) * (irpfEfectivo / 100);
  const estimacionActual = margenActualTrasComerciales - provisionIrpfActual;
  const diffEstimacion = estimacionFinal - estimacionActual;

  const warnings = [];
  if (modo === "producto") {
    if (costeManoObra === 0) warnings.push("No has añadido coste de mano de obra: tu tiempo también cuesta.");
    if (indirectos.length === 0) warnings.push("No has añadido costes indirectos (alquiler, luz, seguros…) — si tienes, el coste real es mayor.");
    if (materiales.length === 0) warnings.push("No has añadido ningún material.");
  } else {
    if (horasTotalesServicio === 0) warnings.push("No has puesto ninguna hora para este servicio.");
    if (indirectosServicio.length === 0) warnings.push("No has añadido herramientas/gastos generales — si tienes, el coste real es mayor.");
    if (capacidadFacturableMes === 0) warnings.push("Pon tu capacidad facturable al mes para repartir bien los indirectos.");
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setGuardados(raw ? JSON.parse(raw) : []);
    } catch {
      setGuardados([]);
    }
  }, []);

  const guardar = useCallback(() => {
    const entry = { id: Date.now(), modo, nombre, costeTotal, margen, modoMargen, iva, irpfEfectivo, marketingPct, pvpFinal, estimacionFinal };
    const nueva = [entry, ...guardados].slice(0, 30);
    setGuardados(nueva);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nueva));
      setSaveMsg("Guardado");
      setTimeout(() => setSaveMsg(""), 1500);
    } catch {
      setSaveMsg("No se pudo guardar");
      setTimeout(() => setSaveMsg(""), 2000);
    }
  }, [modo, nombre, costeTotal, margen, modoMargen, iva, irpfEfectivo, marketingPct, pvpFinal, estimacionFinal, guardados]);

  const borrar = useCallback((id) => {
    const nueva = guardados.filter((g) => g.id !== id);
    setGuardados(nueva);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(nueva)); } catch {}
  }, [guardados]);

  const pedirSugerenciaIA = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    setAiSugerencia(null);
    try {
      const prompt = modo === "producto"
        ? `Eres un asesor comercial para autónomos y pequeños negocios de producto en España (cliente de "Elisabeth Tchana · Consultoría de negocio").
Datos del producto:
- Nombre: ${nombre || "producto sin nombre"}
- Sector: ${sector || "no especificado"}
- Coste materiales (con mermas): ${costeMateriales.toFixed(2)} €
- Coste packaging: ${costePackaging.toFixed(2)} €
- Coste mano de obra: ${costeManoObra.toFixed(2)} €
- Otros costes: ${costeOtros.toFixed(2)} €
- Coste indirecto por unidad: ${costeIndirectoUnitario.toFixed(2)} €
- Coste total unitario: ${costeTotal.toFixed(2)} €
- IVA aplicable: ${iva}%
- % marketing sobre cada venta: ${marketingPct}%

Sugiere un rango de margen comercial razonable (sobre el PVP sin IVA) para este producto y sector en España.
Responde ÚNICAMENTE con JSON válido: {"marginMin": numero, "marginMax": numero, "marginRecomendado": numero, "razonamiento": "texto breve en español, máximo 3 frases"}`
        : `Eres un asesor comercial para autónomos que prestan servicios en España (cliente de "Elisabeth Tchana · Consultoría de negocio").
Datos del servicio:
- Nombre: ${nombre || "servicio sin nombre"}
- Sector: ${sectorServicio || "no especificado"}
- Horas totales (preparación+ejecución+seguimiento): ${horasTotalesServicio.toFixed(2)} h
- Coste indirecto por hora: ${costeIndirectoPorHora.toFixed(2)} €
- Coste total del servicio: ${costeTotal.toFixed(2)} €
- IVA aplicable: ${iva}%
- Cliente: ${tipoCliente === "empresa" ? "empresas/autónomos (con retención IRPF en factura)" : "particulares"}

Sugiere un rango de margen comercial razonable (sobre el precio sin IVA) para este servicio y sector en España.
Responde ÚNICAMENTE con JSON válido: {"marginMin": numero, "marginMax": numero, "marginRecomendado": numero, "razonamiento": "texto breve en español, máximo 3 frases"}`;

      const response = await fetch("/api/margin-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const textBlock = (data.content || []).find((b) => b.type === "text");
      if (!textBlock) throw new Error("Sin respuesta de texto");
      const clean = textBlock.text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setAiSugerencia(parsed);
      if (parsed.marginRecomendado) {
        setModoMargen("pvp");
        setMargen(Math.round(parsed.marginRecomendado));
      }
    } catch (e) {
      setAiError(e.message || "No se pudo obtener la sugerencia.");
    } finally {
      setAiLoading(false);
    }
  }, [modo, nombre, sector, sectorServicio, costeMateriales, costePackaging, costeManoObra, costeOtros, costeIndirectoUnitario, costeIndirectoPorHora, horasTotalesServicio, costeTotal, iva, marketingPct, tipoCliente]);

  const breakdown = modo === "producto"
    ? [
        { label: "Materiales", value: costeMateriales },
        { label: "Packaging", value: costePackaging },
        { label: "Mano de obra", value: costeManoObra },
        { label: "Otros directos", value: costeOtros },
        { label: "Indirectos (prorrateo)", value: costeIndirectoUnitario },
      ]
    : [
        { label: "Mano de obra propia", value: costeManoObraServicio },
        { label: "Indirectos (por hora)", value: costeIndirectoServicio },
        { label: "Otros costes directos", value: costeOtrosServicio },
      ];

  const toggleBtn = (active) => ({
    borderColor: active ? C.tierra : C.border,
    color: active ? "#fff" : C.text,
    background: active ? C.tierra : C.panel,
  });

  return (
    <div className="min-h-screen w-full pb-16" style={{ background: C.bg, color: C.text }}>
      <style>{`
        .paper-grid { background-image: linear-gradient(${C.border}22 1px, transparent 1px), linear-gradient(90deg, ${C.border}22 1px, transparent 1px); background-size: 28px 28px; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.5; }
      `}</style>

      <div className="paper-grid">
        <header className="border-b px-6 py-6 md:px-10" style={{ borderColor: C.border }}>
          <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase font-['JetBrains_Mono'] mb-1" style={{ color: C.tierra }}>
                <Ruler size={13} /> Elisabeth Tchana · Consultoría de negocio
              </div>
              <h1 className="text-2xl md:text-3xl font-['Space_Grotesk'] font-semibold">Plano de Escandallo</h1>
              <p className="text-sm mt-1" style={{ color: C.muted }}>Diagnóstico qué está frenando tu negocio, defino contigo una estrategia y te ayudo a ponerla en marcha.</p>
            </div>
            <div className="relative border px-3 py-1.5 rotate-[-3deg] text-[10px] tracking-[0.15em] uppercase font-['JetBrains_Mono']" style={{ borderColor: C.tierra, color: C.tierra }}>Escala 1:1</div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 md:px-10 py-8">
          <div className="grid grid-cols-2 gap-3 mb-6 max-w-md">
            <button onClick={() => setModo("producto")} className="flex items-center justify-center gap-2 py-3 border text-sm font-semibold uppercase tracking-wide transition-colors" style={toggleBtn(modo === "producto")}>
              <Package size={16} /> Producto
            </button>
            <button onClick={() => setModo("servicio")} className="flex items-center justify-center gap-2 py-3 border text-sm font-semibold uppercase tracking-wide transition-colors" style={toggleBtn(modo === "servicio")}>
              <Briefcase size={16} /> Servicio
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-6">
              <Panel title="Identificación" tag="01">
                <div className="p-4 space-y-3">
                  <label className="block">
                    <span className="block text-[11px] uppercase tracking-wide mb-1" style={{ color: C.muted }}>{modo === "producto" ? "Nombre del producto" : "Nombre del servicio"}</span>
                    <input value={nombre} onChange={(e) => setNombre(e.target.value)}
                      className="w-full border px-3 py-2 text-sm outline-none" style={{ background: C.bg, borderColor: C.border, color: C.text }} />
                  </label>
                  <label className="block">
                    <span className="block text-[11px] uppercase tracking-wide mb-1" style={{ color: C.muted }}>Sector</span>
                    {modo === "producto"
                      ? <SectorSelect value={sector} onChange={setSector} options={SECTORES_PRODUCTO} />
                      : <SectorSelect value={sectorServicio} onChange={setSectorServicio} options={SECTORES_SERVICIO} />}
                  </label>
                  {modo === "servicio" && (
                    <div>
                      <span className="block text-[11px] uppercase tracking-wide mb-1" style={{ color: C.muted }}>¿A quién facturas normalmente este servicio?</span>
                      <div className="flex gap-2">
                        <button onClick={() => setTipoCliente("empresa")} className="flex-1 py-1.5 text-xs uppercase tracking-wide border" style={tipoCliente === "empresa" ? { borderColor: C.tierra, color: C.tierra, background: C.tierraSoft } : { borderColor: C.border, color: C.muted }}>Empresas / autónomos</button>
                        <button onClick={() => setTipoCliente("particular")} className="flex-1 py-1.5 text-xs uppercase tracking-wide border" style={tipoCliente === "particular" ? { borderColor: C.tierra, color: C.tierra, background: C.tierraSoft } : { borderColor: C.border, color: C.muted }}>Particulares</button>
                      </div>
                      {tipoCliente === "empresa" && (
                        <label className="flex items-center gap-2 mt-2 text-[11px]" style={{ color: C.muted }}>
                          <input type="checkbox" checked={nuevoAutonomo} onChange={(e) => setNuevoAutonomo(e.target.checked)} />
                          Soy nuevo autónomo (retención reducida 7% los 2 primeros años)
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </Panel>

              {modo === "producto" ? (
                <>
                  <Panel title="Materiales" tag="02" hint="El % de merma sube el coste real. ¿Compras en bloque? Usa la calculadora de cada fila.">
                    <div className="p-4 pt-2"><ItemList items={materiales} setItems={setMateriales} placeholder="Añade cada material: tela, harina, cera, hilo…" showCalc calcType="compra" /></div>
                  </Panel>
                  <Panel title="Packaging" tag="03">
                    <div className="p-4"><ItemList items={packaging} setItems={setPackaging} placeholder="Caja, bolsa, etiqueta, adorno, papel de relleno…" showCalc calcType="compra" /></div>
                  </Panel>
                  <Panel title="Mano de obra" tag="04" hint="¿Trabajas por lotes? Tiempo total del lote ÷ unidades que salen = horas por unidad.">
                    <div className="p-4 pt-2"><ItemList items={manoObra} setItems={setManoObra} placeholder="Tareas por horas: elaboración, montaje, envasado…" showCalc calcType="lote" /></div>
                  </Panel>
                  <Panel title="Otros costes directos" tag="05">
                    <div className="p-4"><ItemList items={otros} setItems={setOtros} placeholder="Cualquier otro coste directo del producto." /></div>
                  </Panel>
                  <Panel title="Costes indirectos (prorrateados)" tag="06" hint="Alquiler, luz, seguros… se reparten entre las unidades que estimas vender al mes.">
                    <div className="p-4 pt-2 space-y-3">
                      <IndirectList items={indirectos} setItems={setIndirectos} />
                      <label className="block">
                        <span className="block text-[11px] uppercase tracking-wide mb-1" style={{ color: C.muted }}>Unidades estimadas al mes</span>
                        <input type="number" step="1" value={unidadesMes} onChange={(e) => setUnidadesMes(parseFloat(e.target.value) || 0)}
                          className="w-full border px-3 py-2 text-sm font-['JetBrains_Mono'] outline-none" style={{ background: C.bg, borderColor: C.border, color: C.text }} />
                      </label>
                      <div className="flex justify-between items-center border-t pt-2" style={{ borderColor: C.border }}>
                        <span className="text-[11px] uppercase tracking-wide" style={{ color: C.muted }}>Coste indirecto / unidad</span>
                        <span className="font-['JetBrains_Mono'] text-sm font-semibold">{fmt(costeIndirectoUnitario)} €</span>
                      </div>
                    </div>
                  </Panel>
                </>
              ) : (
                <>
                  <Panel title="Horas del servicio" tag="02" hint="Cuenta todo el tiempo real: preparar, ejecutar y hacer seguimiento después.">
                    <div className="p-4 pt-2 grid grid-cols-3 gap-2">
                      <label className="block">
                        <span className="block text-[10px] uppercase mb-1" style={{ color: C.muted }}>Preparación (h)</span>
                        <input type="number" step="0.25" value={horasPrep} onChange={(e) => setHorasPrep(parseFloat(e.target.value) || 0)}
                          className="w-full border px-2 py-2 text-sm font-['JetBrains_Mono'] outline-none" style={{ background: C.bg, borderColor: C.border, color: C.text }} />
                      </label>
                      <label className="block">
                        <span className="block text-[10px] uppercase mb-1" style={{ color: C.muted }}>Ejecución (h)</span>
                        <input type="number" step="0.25" value={horasEjec} onChange={(e) => setHorasEjec(parseFloat(e.target.value) || 0)}
                          className="w-full border px-2 py-2 text-sm font-['JetBrains_Mono'] outline-none" style={{ background: C.bg, borderColor: C.border, color: C.text }} />
                      </label>
                      <label className="block">
                        <span className="block text-[10px] uppercase mb-1" style={{ color: C.muted }}>Seguimiento (h)</span>
                        <input type="number" step="0.25" value={horasSeguimiento} onChange={(e) => setHorasSeguimiento(parseFloat(e.target.value) || 0)}
                          className="w-full border px-2 py-2 text-sm font-['JetBrains_Mono'] outline-none" style={{ background: C.bg, borderColor: C.border, color: C.text }} />
                      </label>
                    </div>
                    <div className="px-4 pb-4 pt-1 flex justify-between items-center border-t mt-2" style={{ borderColor: C.border }}>
                      <span className="text-[11px] uppercase tracking-wide" style={{ color: C.muted }}>Horas totales</span>
                      <span className="font-['JetBrains_Mono'] text-sm font-semibold">{fmt(horasTotalesServicio)} h</span>
                    </div>
                    <div className="px-4 pb-4">
                      <label className="block">
                        <span className="block text-[11px] uppercase tracking-wide mb-1" style={{ color: C.muted }}>Coste de tu hora (déjalo en 0 si el margen ES tu sueldo; ponlo si subcontratas)</span>
                        <div className="flex items-center border" style={{ background: C.bg, borderColor: C.border }}>
                          <input type="number" step="0.5" value={tarifaHoraCoste} onChange={(e) => setTarifaHoraCoste(parseFloat(e.target.value) || 0)}
                            className="w-full bg-transparent px-3 py-2 text-sm font-['JetBrains_Mono'] outline-none" style={{ color: C.text }} />
                          <span className="pr-3 text-xs" style={{ color: C.oliva }}>€/h</span>
                        </div>
                      </label>
                    </div>
                  </Panel>

                  <Panel title="Capacidad e indirectos" tag="03" hint="Software, herramientas, seguros… se reparten entre las horas facturables que estimas tener al mes.">
                    <div className="p-4 pt-2 space-y-3">
                      <IndirectList items={indirectosServicio} setItems={setIndirectosServicio} />
                      <label className="block">
                        <span className="block text-[11px] uppercase tracking-wide mb-1" style={{ color: C.muted }}>Horas facturables al mes</span>
                        <input type="number" step="1" value={capacidadFacturableMes} onChange={(e) => setCapacidadFacturableMes(parseFloat(e.target.value) || 0)}
                          className="w-full border px-3 py-2 text-sm font-['JetBrains_Mono'] outline-none" style={{ background: C.bg, borderColor: C.border, color: C.text }} />
                      </label>
                      <div className="flex justify-between items-center border-t pt-2" style={{ borderColor: C.border }}>
                        <span className="text-[11px] uppercase tracking-wide" style={{ color: C.muted }}>Coste indirecto / hora</span>
                        <span className="font-['JetBrains_Mono'] text-sm font-semibold">{fmt(costeIndirectoPorHora)} €</span>
                      </div>
                    </div>
                  </Panel>

                  <Panel title="Otros costes directos" tag="04" hint="Desplazamientos, materiales puntuales que uses solo en este servicio…">
                    <div className="p-4"><ItemList items={otrosServicio} setItems={setOtrosServicio} placeholder="ej. Kilometraje, dietas, un material concreto…" showMerma={false} /></div>
                  </Panel>
                </>
              )}

              <Panel title="Margen comercial" tag={modo === "producto" ? "07" : "05"}>
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: C.border }}>
                    <span className="text-[11px] uppercase tracking-wide" style={{ color: C.muted }}>Coste total {modo === "producto" ? "unitario" : "del servicio"}</span>
                    <span className="font-['JetBrains_Mono'] text-lg font-semibold">{fmt(costeTotal)} €</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setModoMargen("coste")} className="flex-1 py-1.5 text-xs uppercase tracking-wide border" style={modoMargen === "coste" ? { borderColor: C.tierra, color: C.tierra, background: C.tierraSoft } : { borderColor: C.border, color: C.muted }}>% sobre coste</button>
                    <button onClick={() => setModoMargen("pvp")} className="flex-1 py-1.5 text-xs uppercase tracking-wide border" style={modoMargen === "pvp" ? { borderColor: C.tierra, color: C.tierra, background: C.tierraSoft } : { borderColor: C.border, color: C.muted }}>% sobre PVP</button>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] uppercase tracking-wide" style={{ color: C.muted }}>Margen</span>
                      <span className="font-['JetBrains_Mono'] text-sm font-semibold" style={{ color: C.tierra }}>{margen}%</span>
                    </div>
                    <input type="range" min="0" max={modoMargen === "pvp" ? 90 : 300} value={margen} onChange={(e) => setMargen(parseFloat(e.target.value))} className="w-full" style={{ accentColor: C.tierra }} />
                  </div>
                  <button onClick={pedirSugerenciaIA} disabled={aiLoading} className="w-full flex items-center justify-center gap-2 border py-2 text-xs uppercase tracking-wide disabled:opacity-50" style={{ borderColor: C.oliva, color: C.oliva }}>
                    {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {aiLoading ? "Calculando…" : "Sugerencia de margen con IA"}
                  </button>
                  {aiError && <p className="text-xs" style={{ color: C.alerta }}>{aiError}</p>}
                  {aiSugerencia && (
                    <div className="border p-3 text-xs space-y-1" style={{ borderColor: C.oliva, background: C.olivaSoft }}>
                      <p className="font-['JetBrains_Mono']" style={{ color: C.oliva }}>Rango sugerido: {aiSugerencia.marginMin}%–{aiSugerencia.marginMax}% (recomendado {aiSugerencia.marginRecomendado}%)</p>
                      <p>{aiSugerencia.razonamiento}</p>
                    </div>
                  )}
                </div>
              </Panel>

              <Panel title="Marketing y canales de venta" tag={modo === "producto" ? "08" : "06"}>
                <div className="p-4 space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] uppercase tracking-wide" style={{ color: C.muted }}>% destinado a ads / marketing</span>
                      <span className="font-['JetBrains_Mono'] text-sm font-semibold" style={{ color: C.tierra }}>{marketingPct}%</span>
                    </div>
                    <input type="range" min="0" max="30" value={marketingPct} onChange={(e) => setMarketingPct(parseFloat(e.target.value))} className="w-full" style={{ accentColor: C.tierra }} />
                  </div>
                  <div>
                    <span className="block text-[11px] uppercase tracking-wide mb-1" style={{ color: C.muted }}>Canales de venta y su comisión</span>
                    <CanalList canales={canales} setCanales={setCanales} pvpSinIva={pvpSinIva} beneficioBruto={beneficioBruto} marketingImporte={marketingImporte} irpfEfectivo={irpfEfectivo} />
                  </div>
                </div>
              </Panel>

              <Panel title="Impuestos" tag={modo === "producto" ? "09" : "07"}>
                <div className="p-4 space-y-3">
                  <label className="block">
                    <span className="block text-[11px] uppercase tracking-wide mb-1" style={{ color: C.muted }}>IVA aplicable</span>
                    <select value={iva} onChange={(e) => setIva(parseFloat(e.target.value))} className="w-full border px-3 py-2 text-sm outline-none" style={{ background: C.bg, borderColor: C.border, color: C.text }}>
                      {IVA_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                    </select>
                  </label>
                  {esRetencionReal ? (
                    <div className="border p-3" style={{ borderColor: C.tierra, background: C.tierraSoft }}>
                      <p className="text-xs font-semibold" style={{ color: C.tierra }}>Retención IRPF real en la factura: {irpfEfectivo}%</p>
                      <p className="text-[11px] mt-1 leading-relaxed" style={{ color: C.text }}>
                        Facturas a empresas/autónomos, así que Hacienda te retiene este {irpfEfectivo}% directamente en cada factura — ese dinero no llega a tu cuenta, ya está pagado.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <button onClick={() => setIrpfOpen(!irpfOpen)} className="flex items-center gap-1 text-[11px] uppercase tracking-wide mb-1" style={{ color: C.muted }}>
                        Provisión IRPF (estimada) <ChevronDown size={12} className={`transition-transform ${irpfOpen ? "rotate-180" : ""}`} />
                      </button>
                      {irpfOpen && (
                        <p className="text-[11px] mb-2 leading-relaxed" style={{ color: C.muted }}>
                          {modo === "servicio"
                            ? "Facturas a particulares, así que no hay retención en factura. El IRPF se paga trimestralmente (pago fraccionado). Este % es una reserva orientativa."
                            : "Como autónomo en estimación directa, el IRPF no se retiene venta a venta: se paga trimestralmente (pago fraccionado, normalmente 20% del beneficio). Este % es una reserva orientativa, no una cifra exacta."}
                        </p>
                      )}
                      <div className="flex items-center border" style={{ background: C.bg, borderColor: C.border }}>
                        <input type="number" step="1" value={irpf} onChange={(e) => setIrpf(parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent px-3 py-2 text-sm font-['JetBrains_Mono'] outline-none" style={{ color: C.text }} />
                        <span className="pr-3 text-xs" style={{ color: C.oliva }}>%</span>
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            </div>

            <div className="space-y-6 lg:sticky lg:top-6">
              <Panel title="Compara con tu precio actual" tag="10" hint="Si ya lo vendes, pon a qué precio (con IVA) y te decimos si te compensa de verdad.">
                <div className="p-4 pt-2 space-y-3">
                  <label className="block">
                    <span className="block text-[11px] uppercase tracking-wide mb-1" style={{ color: C.muted }}>¿A qué precio lo vendes ahora? (con IVA)</span>
                    <div className="flex items-center border" style={{ background: C.bg, borderColor: C.border }}>
                      <input type="number" step="0.01" value={precioActualConIva} onChange={(e) => setPrecioActualConIva(e.target.value)}
                        placeholder="ej. 6,50" className="w-full bg-transparent px-3 py-2 font-['JetBrains_Mono'] text-sm outline-none" style={{ color: C.text }} />
                      <span className="pr-3 text-xs" style={{ color: C.oliva }}>€</span>
                    </div>
                  </label>
                  {tieneComparador && (
                    <div className="border p-3 flex items-start gap-2.5" style={
                      estimacionActual < 0 ? { borderColor: C.alerta, background: C.alertaSoft }
                      : diffEstimacion > 0.01 ? { borderColor: C.tierra, background: C.tierraSoft }
                      : { borderColor: C.oliva, background: C.olivaSoft }
                    }>
                      {estimacionActual < 0 ? <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: C.alerta }} />
                        : diffEstimacion > 0.01 ? <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: C.tierra }} />
                        : <CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: C.oliva }} />}
                      <div className="text-xs leading-relaxed">
                        {estimacionActual < 0 ? (
                          <p className="font-semibold" style={{ color: C.alerta }}>Estás perdiendo {fmt(Math.abs(estimacionActual))} € cada vez, a este precio.</p>
                        ) : diffEstimacion > 0.01 ? (
                          <p style={{ color: C.tierra }}>Con tu precio actual te quedan <strong>{fmt(estimacionActual)} €</strong>. Con el margen fijado a la izquierda, podrías quedarte con <strong>{fmt(estimacionFinal)} €</strong> — {fmt(diffEstimacion)} € más.</p>
                        ) : (
                          <p style={{ color: C.oliva }}>Tu precio actual ya te deja <strong>{fmt(estimacionActual)} €</strong> — cubre bien (o mejor) el margen que has fijado.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Panel>

              <Panel title="Alzado del precio" tag="11" className="pb-6">
                <div className="p-5">
                  {warnings.length > 0 && (
                    <div className="border p-2.5 mb-4 space-y-1" style={{ borderColor: C.alerta, background: C.alertaSoft }}>
                      {warnings.map((w) => (
                        <div key={w} className="flex items-start gap-1.5 text-[10.5px]" style={{ color: C.alerta }}>
                          <TriangleAlert size={12} className="shrink-0 mt-0.5" /><span>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1" style={{ color: C.muted }}><Info size={11} /> Reparto del coste total</div>
                  <div className="space-y-1 text-xs font-['JetBrains_Mono'] mb-3">
                    {breakdown.map((b) => (
                      <div key={b.label} className="flex justify-between">
                        <span>{b.label}</span>
                        <span>{fmt(b.value)} € {costeTotal > 0 && <span style={{ color: C.muted }}>({fmt((b.value / costeTotal) * 100)}%)</span>}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col items-stretch">
                    <div className="border p-3 flex justify-between items-center" style={{ background: C.bg, borderColor: C.border }}>
                      <span className="text-[11px] uppercase tracking-wide" style={{ color: C.muted }}>Coste total</span>
                      <span className="font-['JetBrains_Mono'] text-sm">{fmt(costeTotal)} €</span>
                    </div>
                    <DimLine label="+ margen" value={`${fmt(beneficioBruto)} € (${fmt(margenReal)}%)`} accent={C.tierra} />
                    <div className="border p-3 flex justify-between items-center" style={{ borderColor: C.tierra, background: C.tierraSoft }}>
                      <span className="text-[11px] uppercase tracking-wide" style={{ color: C.tierra }}>Precio sin IVA</span>
                      <span className="font-['JetBrains_Mono'] text-sm font-semibold" style={{ color: C.tierra }}>{fmt(pvpSinIva)} €</span>
                    </div>
                    <DimLine label={`+ iva ${iva}%`} value={`${fmt(ivaImporte)} €`} />
                    <div className="border-2 p-3 flex justify-between items-center" style={{ borderColor: C.oliva, background: C.olivaSoft }}>
                      <span className="text-xs uppercase tracking-wide font-semibold" style={{ color: C.oliva }}>Precio final cliente</span>
                      <span className="font-['JetBrains_Mono'] text-xl font-bold" style={{ color: C.oliva }}>{fmt(pvpFinal)} €</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-dashed space-y-1.5" style={{ borderColor: C.border }}>
                    <div className="flex justify-between items-center text-sm"><span>Beneficio bruto</span><span className="font-['JetBrains_Mono']">{fmt(beneficioBruto)} €</span></div>
                    <div className="flex justify-between items-center text-sm"><span>− Marketing / ads ({marketingPct}%)</span><span className="font-['JetBrains_Mono']" style={{ color: C.alerta }}>−{fmt(marketingImporte)} €</span></div>
                    <div className="flex justify-between items-center text-sm"><span>− Comisión ({canalPrincipal.nombre || "canal principal"})</span><span className="font-['JetBrains_Mono']" style={{ color: C.alerta }}>−{fmt(comisionImporte)} €</span></div>
                    <div className="flex justify-between items-center text-sm font-medium pt-1 border-t" style={{ borderColor: C.border }}>
                      <span>= Margen tras costes comerciales</span><span className="font-['JetBrains_Mono']">{fmt(margenTrasComerciales)} €</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>− {esRetencionReal ? `Retención IRPF real (${irpfEfectivo}%)` : `Provisión fiscal estimada, IRPF (${irpfEfectivo}%)`}</span>
                      <span className="font-['JetBrains_Mono']" style={{ color: C.alerta }}>−{fmt(provisionIrpf)} €</span>
                    </div>
                    <div className="border p-3 flex justify-between items-center mt-2" style={{ borderColor: C.oliva, background: C.olivaSoft }}>
                      <span className="text-xs uppercase tracking-wide font-semibold flex items-center gap-1.5" style={{ color: C.oliva }}><Stamp size={14} /> Estimación de lo que te queda</span>
                      <span className="font-['JetBrains_Mono'] text-xl font-bold" style={{ color: C.oliva }}>{fmt(estimacionFinal)} €</span>
                    </div>
                    <p className="text-[10px] pt-1" style={{ color: C.muted }}>
                      {esRetencionReal ? "La retención ya está descontada en la factura real; el resto sigue siendo una estimación." : "Es una estimación: incluye una previsión de IRPF, no una cifra exacta de Hacienda."}
                    </p>
                  </div>
                  <button onClick={guardar} className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 text-xs uppercase tracking-wide font-semibold" style={{ background: C.tierra, color: "#fff" }}>
                    <Save size={14} /> {saveMsg || "Guardar este escandallo"}
                  </button>
                </div>
              </Panel>

              <Panel title="Archivo de planos guardados" tag="12">
                <div className="p-4">
                  {guardados.length === 0 ? (
                    <p className="text-xs" style={{ color: C.muted }}>Aún no has guardado ningún escandallo.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {guardados.map((g) => (
                        <div key={g.id} className="flex items-center justify-between border px-3 py-2 text-xs" style={{ borderColor: C.border }}>
                          <div>
                            <p className="font-medium flex items-center gap-1.5">
                              {g.modo === "servicio" ? <Briefcase size={11} /> : <Package size={11} />} {g.nombre}
                            </p>
                            <p className="font-['JetBrains_Mono']" style={{ color: C.muted }}>Precio {fmt(g.pvpFinal)} € · Estimación {fmt(g.estimacionFinal)} €</p>
                          </div>
                          <button onClick={() => borrar(g.id)} className="p-1" style={{ color: C.alerta }}><Trash2 size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Panel>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
