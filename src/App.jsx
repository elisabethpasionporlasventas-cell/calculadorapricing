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
  bg: "#f8efe4",
  panel: "#fffdf9",
  border: "#dacdc1",
  text: "#33231c",
  muted: "#665950",
  tierra: "#a85730",
  tierraSoft: "rgba(168,87,48,0.10)",
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
  const isOtro = Boolean(value) && !options.includes(value) || value === OTRO;
  return (
    <div className="space-y-1.5">
      <select
        value={value === "" ? "" : options.includes(value) ? value : OTRO}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border px-3 py-2 text-sm outline-none"
        style={{ background: C.bg, borderColor: C.border, color: C.text }}
      >
        <option value="" disabled>Elige un sector</option>
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
  const [wizardStep, setWizardStep] = useState(0);
  const [formError, setFormError] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [leadPending, setLeadPending] = useState(false);
  const [leadError, setLeadError] = useState("");
  const [modo, setModo] = useState("producto"); // producto | servicio

  const [nombre, setNombre] = useState("");
  const [sector, setSector] = useState("");
  const [sectorServicio, setSectorServicio] = useState("");

  // ---- Producto ----
  const [materiales, setMateriales] = useState([{ id: uid(), nombre: "", cantidad: 1, unidad: "ud", precio: 0, merma: 0 }]);
  const [packaging, setPackaging] = useState([]);
  const [manoObra, setManoObra] = useState([{ id: uid(), nombre: "", cantidad: 0, unidad: "h", precio: 0, merma: 0 }]);
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
  const margenSobreVenta = modoMargen === "coste" ? (100 * margen / (100 + Number(margen || 0))) : Number(margen || 0);
  const margenSobreCoste = modoMargen === "pvp" && margen < 100 ? (100 * margen / (100 - Number(margen || 0))) : Number(margen || 0);
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
  const channelRate = canalPrincipal.tipo === "porcentaje" ? (canalPrincipal.valor || 0) / 100 : 0;
  const flatCommission = canalPrincipal.tipo !== "porcentaje" ? (canalPrincipal.valor || 0) : 0;
  const priceFloorExVat = 1 - marketingPct / 100 - channelRate > 0
    ? (costeTotal + flatCommission) / (1 - marketingPct / 100 - channelRate) : null;
  const priceFloor = priceFloorExVat === null ? null : priceFloorExVat * (1 + iva / 100);

  async function unlockResult(event) {
    event.preventDefault();
    if (!privacyAccepted || costeTotal <= 0 || !nombre.trim() || !(modo === "producto" ? sector : sectorServicio).trim() || (modo === "producto" ? sector : sectorServicio) === OTRO) {
      setLeadError("Completa el coste, el nombre y el sector, y acepta la información de privacidad.");
      return;
    }
    setLeadPending(true);
    setLeadError("");
    try {
      const res = await fetch("/api/pricing-leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: leadName.trim(), email: leadEmail.trim(), kind: modo,
          item: nombre.trim(), sector: (modo === "producto" ? sector : sectorServicio).trim(),
          privacyAccepted, marketingAccepted, website: companyWebsite,
          summary: { cost: costeTotal, currentPrice: precioActualNum || null, margin: margenReal,
            minimumPrice: priceFloor, targetPrice: pvpFinal } }),
      });
      if (!res.ok) throw new Error("No se ha podido guardar tu solicitud. Vuelve a intentarlo.");
      setUnlocked(true);
      setWizardStep(7);
      window.setTimeout(() => document.getElementById("calculadora")?.scrollIntoView({ behavior: "smooth" }), 40);
    } catch (error) { setLeadError(error.message); }
    finally { setLeadPending(false); }
  }

  const warnings = [];
  if (modo === "producto") {
    if (costeManoObra === 0) warnings.push("No has añadido coste de mano de obra: tu tiempo también cuesta.");
    if (indirectos.length === 0) warnings.push("No has añadido costes indirectos (alquiler, luz, seguros…) — si tienes, el coste real es mayor.");
    if (costeMateriales === 0) warnings.push("No has añadido el coste de los materiales.");
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

  const totalSteps = modo === "producto" ? 6 : 5;
  const activeNumber = wizardStep === 0 ? 0 : wizardStep <= 2 ? wizardStep : modo === "producto" ? Math.min(wizardStep, 6) : Math.min(wizardStep - 1, 5);
  const progress = wizardStep === 0 ? 0 : wizardStep >= 6 ? 100 : Math.round((activeNumber / totalSteps) * 100);
  function nextStep() {
    if (wizardStep === 1 && (!nombre.trim() || !(modo === "producto" ? sector : sectorServicio).trim() || (modo === "producto" ? sector : sectorServicio) === OTRO)) {
      setFormError("Escribe el nombre y el sector antes de seguir."); return;
    }
    if (wizardStep === 4 && costeTotal <= 0) {
      setFormError("Añade al menos un coste para que el cálculo tenga sentido."); return;
    }
    setFormError("");
    setWizardStep(wizardStep === 2 && modo === "servicio" ? 4 : wizardStep + 1);
  }
  function previousStep() {
    setFormError("");
    setWizardStep(wizardStep === 4 && modo === "servicio" ? 2 : wizardStep - 1);
  }
  const revenueMargin = tieneComparador && precioActualSinIva > 0 ? ((precioActualSinIva - costeTotal - marketingActual - comisionActual) / precioActualSinIva) * 100 : null;

  return (
    <div className="pricing-workspace">
      <div className="pricing-wizard" aria-live="polite">
        <div className="wizard-top"><span>ELISABETH TCHANA <span className="top-divider">/</span> PRECIO RENTABLE</span><span>GRATIS · LANZAMIENTO</span></div>
        <div className="wizard-card">
          {wizardStep > 0 && wizardStep < 7 && <div className="wizard-progress"><div className="wizard-step">Paso {activeNumber} de {totalSteps}</div><div className="wizard-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}><span style={{width:`${progress}%`}}/></div></div>}
          {wizardStep === 0 && <>
            <p className="wizard-kicker">COMENCEMOS</p><h2>Vamos a poner números a tu precio.</h2>
            <p className="wizard-lead">Te haré unas preguntas sobre tu producto o servicio. Al final verás qué te cuesta, qué margen te deja y a partir de qué precio puedes vender sin perder dinero.</p>
            <div className="wizard-chips"><span>Producto o servicio</span><span>Un precio cada vez</span><span>Resultado claro</span></div>
            <div className="wizard-actions end"><button type="button" className="wizard-primary" onClick={nextStep}>Empezar gratis <span aria-hidden="true">→</span></button></div>
          </>}
          {wizardStep === 1 && <>
            <p className="wizard-kicker">01 · TU NEGOCIO</p><h2>¿Qué vas a poner a prueba?</h2>
            <p className="wizard-lead">Elige una opción y ponle nombre. Calcularemos el precio de un producto o servicio concreto.</p>
            <div className="wizard-choices"><button type="button" className={`wizard-choice ${modo==='producto'?'chosen':''}`} onClick={()=>{setModo('producto');setNombre('')}} aria-pressed={modo==='producto'}><span>Producto</span><small>Algo que fabricas, compras o distribuyes.</small></button><button type="button" className={`wizard-choice ${modo==='servicio'?'chosen':''}`} onClick={()=>{setModo('servicio');setNombre('')}} aria-pressed={modo==='servicio'}><span>Servicio</span><small>Un trabajo o proyecto que realizas para un cliente.</small></button></div>
            <div className="wizard-fields"><label><span>Nombre {modo==='producto'?'del producto':'del servicio'}</span><input value={nombre} maxLength="150" placeholder={modo==='producto'?'Ej. Vela aromática':'Ej. Sesión de asesoría'} onChange={e=>setNombre(e.target.value)} /></label><label><span>Sector o actividad</span><SectorSelect value={modo==='producto'?sector:sectorServicio} onChange={modo==='producto'?setSector:setSectorServicio} options={modo==='producto'?SECTORES_PRODUCTO:SECTORES_SERVICIO}/></label></div>
            <WizardActions back={previousStep} next={nextStep} error={formError}/>
          </>}
          {wizardStep === 2 && modo === 'producto' && <>
            <p className="wizard-kicker">02 · COSTES DIRECTOS</p><h2>¿Qué lleva cada unidad?</h2><p className="wizard-lead">Añade materiales y envase con su cantidad y precio por unidad. Si hay desperdicio, incluye la merma.</p>
            <CostRows title="Materiales" items={materiales} setItems={setMateriales} hint="Ingredientes, piezas o materia prima" showWaste/>
            <CostRows title="Envase y presentación" items={packaging} setItems={setPackaging} hint="Caja, etiqueta, bolsa…" showWaste/>
            <WizardActions back={previousStep} next={nextStep} error={formError}/>
          </>}
          {wizardStep === 2 && modo === 'servicio' && <>
            <p className="wizard-kicker">02 · TU TIEMPO</p><h2>¿Cuánto tiempo te lleva?</h2><p className="wizard-lead">Cuenta también la preparación y el seguimiento. Pon aquí el coste de tu hora de trabajo, no el precio que cobras al cliente.</p>
            <div className="wizard-fields cols"><NumberField label="Preparación" value={horasPrep} onChange={setHorasPrep} unit="horas"/><NumberField label="Ejecución" value={horasEjec} onChange={setHorasEjec} unit="horas"/><NumberField label="Seguimiento" value={horasSeguimiento} onChange={setHorasSeguimiento} unit="horas"/><NumberField label="Coste de tu hora" value={tarifaHoraCoste} onChange={setTarifaHoraCoste} unit="€ / hora"/></div>
            <p className="wizard-note">Puedes estimar ese coste dividiendo lo que necesitas para remunerar tu trabajo y cotizar entre tus horas realmente facturables.</p>
            <WizardActions back={previousStep} next={nextStep} error={formError}/>
          </>}
          {wizardStep === 3 && <>
            <p className="wizard-kicker">03 · TU TRABAJO</p><h2>¿Qué más cuesta sacar cada unidad?</h2><p className="wizard-lead">Tu tiempo y cualquier otro gasto directo que aparece solo cuando vendes este producto.</p>
            <CostRows title="Mano de obra" items={manoObra} setItems={setManoObra} hint="Ej. elaboración: 0,5 horas a 15 €/hora" showWaste={false}/>
            <CostRows title="Otros costes directos" items={otros} setItems={setOtros} hint="Ej. comisión fija, desplazamiento o material adicional" showWaste={false}/>
            <WizardActions back={previousStep} next={nextStep} error={formError}/>
          </>}
          {wizardStep === 4 && <>
            <p className="wizard-kicker">{modo==='producto'?'04':'03'} · COSTES DEL NEGOCIO</p><h2>¿Y los gastos que pagas aunque no vendas?</h2><p className="wizard-lead">{modo==='producto'?'Repartimos alquiler, software, suministros y otros gastos entre las unidades que esperas vender cada mes.':'Repartimos alquiler, software, suministros y otros gastos entre las horas que puedes facturar cada mes.'}</p>
            <FixedRows items={modo==='producto'?indirectos:indirectosServicio} setItems={modo==='producto'?setIndirectos:setIndirectosServicio}/>
            {modo==='servicio' && <CostRows title="Otros costes de este servicio" items={otrosServicio} setItems={setOtrosServicio} hint="Desplazamientos, materiales o colaboradores puntuales" showWaste={false}/ >}
            <div className="wizard-fields"><NumberField label={modo==='producto'?'Unidades que esperas vender al mes':'Horas que puedes facturar al mes'} value={modo==='producto'?unidadesMes:capacidadFacturableMes} onChange={modo==='producto'?setUnidadesMes:setCapacidadFacturableMes} unit={modo==='producto'?'unidades':'horas'} /></div>
            <p className="wizard-note">Si no conoces esta cifra, haz una estimación realista. Cambiará cuánto coste fijo corresponde a cada venta.</p>
            <WizardActions back={previousStep} next={nextStep} error={formError}/>
          </>}
          {wizardStep === 5 && <>
            <p className="wizard-kicker">{modo==='producto'?'05':'04'} · TU PRECIO</p><h2>¿A cuánto vendes ahora?</h2><p className="wizard-lead">Nos ayudará a comparar. Si todavía no vendes este {modo}, deja el campo vacío.</p>
            <div className="wizard-fields cols"><label><span>Precio actual con IVA</span><div className="wizard-input-unit"><input type="number" min="0" step="0.01" inputMode="decimal" value={precioActualConIva} placeholder="Opcional" onChange={e=>setPrecioActualConIva(e.target.value)}/><b>€</b></div></label><label><span>IVA aplicable</span><select value={iva} onChange={e=>setIva(Number(e.target.value))}>{IVA_OPTIONS.map(o=><option key={o.v} value={o.v}>{o.label}</option>)}</select></label></div>
            <div className="wizard-divider"/>
            <h3>¿Qué margen quieres añadir?</h3><p className="wizard-note">Elige cómo expresarlo. Un 40 % sobre coste y un 40 % sobre el precio de venta dan resultados distintos.</p>
            <div className="wizard-toggle"><button type="button" className={modoMargen==='coste'?'chosen':''} onClick={()=>setModoMargen('coste')}>% sobre coste</button><button type="button" className={modoMargen==='pvp'?'chosen':''} onClick={()=>{setModoMargen('pvp');setMargen(Math.min(margen,90))}}>% sobre venta</button></div>
            <div className="wizard-fields cols"><NumberField label="Margen objetivo" value={margen} onChange={setMargen} unit="%" max={modoMargen==='pvp'?90:300}/><NumberField label="Publicidad por venta" value={marketingPct} onChange={setMarketingPct} unit="%" max={90}/></div>
            <aside className="wizard-sector-note" aria-live="polite"><span className="wizard-sector-note-title">Una referencia para {modo==='producto'?sector:sectorServicio}</span><p>Tu objetivo de <strong>{fmt(margenSobreCoste)} % sobre coste</strong> equivale a <strong>{fmt(margenSobreVenta)} % sobre el precio de venta</strong>, antes de publicidad, comisiones e impuestos.</p><p>No hay una media fiable única para todos los {modo==='producto'?'productos':'servicios'} de este sector. Para comparar negocios completos por actividad y tamaño, consulta las <a href="https://www.bde.es/wbe/es/areas-actuacion/central-balances/bases-de-datos-y-aplicaciones/bbdd-datos-publicas-informacion-sectores/" target="_blank" rel="noopener noreferrer">ratios sectoriales del Banco de España ↗</a>. Esas ratios no fijan el margen adecuado de esta venta.</p></aside>
            <div className="wizard-fields cols"><label><span>Canal principal</span><input value={canalPrincipal.nombre} placeholder="Ej. Venta directa" onChange={e=>setCanales([{...canalPrincipal,nombre:e.target.value},...canales.slice(1)])}/></label><label><span>Comisión por venta</span><div className="wizard-input-unit"><input type="number" min="0" step="0.01" inputMode="decimal" value={canalPrincipal.valor} onChange={e=>setCanales([{...canalPrincipal,valor:Number(e.target.value)||0},...canales.slice(1)])}/><select aria-label="Tipo de comisión" value={canalPrincipal.tipo} onChange={e=>setCanales([{...canalPrincipal,tipo:e.target.value},...canales.slice(1)])}><option value="porcentaje">%</option><option value="fijo">€</option></select></div></label></div>
            <details className="wizard-details"><summary>Más ajustes fiscales</summary><p className="wizard-note">El IVA sirve para comparar precios con impuestos. La provisión de IRPF es solo orientativa.</p>{modo==='servicio'&&<div className="wizard-toggle"><button type="button" className={tipoCliente==='empresa'?'chosen':''} onClick={()=>setTipoCliente('empresa')}>Facturo a empresas</button><button type="button" className={tipoCliente==='particular'?'chosen':''} onClick={()=>setTipoCliente('particular')}>Facturo a particulares</button></div>}{modo==='servicio'&&tipoCliente==='empresa'?<label className="wizard-check"><input type="checkbox" checked={nuevoAutonomo} onChange={e=>setNuevoAutonomo(e.target.checked)}/> Retención reducida de nuevo autónomo</label>:<NumberField label="Provisión IRPF estimada" value={irpf} onChange={setIrpf} unit="%" max={90}/>}</details>
            <WizardActions back={previousStep} next={nextStep} error={formError}/>
          </>}
          {wizardStep === 6 && <>
            <p className="wizard-kicker">TU RESULTADO ESTÁ LISTO</p><h2>Ahora sí: veamos tus números.</h2><p className="wizard-lead">Déjame estos datos básicos para mostrarte el resultado completo. No te pediré teléfono ni facturación.</p>
            <form onSubmit={unlockResult} className="wizard-form">
              <div className="wizard-fields cols"><label><span>Tu nombre</span><input required autoComplete="name" maxLength="100" value={leadName} placeholder="Nombre" onChange={e=>setLeadName(e.target.value)}/></label><label><span>Tu email</span><input required type="email" autoComplete="email" maxLength="254" value={leadEmail} placeholder="tu@email.com" onChange={e=>setLeadEmail(e.target.value)}/></label></div>
              <p className="wizard-note">{modo==='producto'?'Producto':'Servicio'}: <strong>{nombre}</strong> · Sector: <strong>{modo==='producto'?sector:sectorServicio}</strong>. Puedes volver para cambiarlos.</p>
              <label className="wizard-honeypot" aria-hidden="true">Web<input tabIndex={-1} autoComplete="off" value={companyWebsite} onChange={e=>setCompanyWebsite(e.target.value)}/></label>
              <label className="wizard-check"><input type="checkbox" required checked={privacyAccepted} onChange={e=>setPrivacyAccepted(e.target.checked)}/> <span>He leído la <a href="https://elisabethtchana.com/privacidad" target="_blank" rel="noreferrer">información de privacidad</a> y solicito mi resultado.</span></label>
              <label className="wizard-check"><input type="checkbox" checked={marketingAccepted} onChange={e=>setMarketingAccepted(e.target.checked)}/> <span>Quiero recibir novedades y consejos comerciales por email. Opcional.</span></label>
              <div className="wizard-actions"><button type="button" className="wizard-secondary" onClick={previousStep}>Atrás</button><button type="submit" className="wizard-primary" disabled={leadPending}>{leadPending?'Guardando…':'Ver mi resultado gratis →'}</button></div>
              {leadError && <p className="wizard-error" role="alert">{leadError}</p>}
            </form>
          </>}
          {wizardStep === 7 && unlocked && <>
            <p className="wizard-kicker">TU PRECIO, CON CRITERIO</p>
            <div className="wizard-result-hero"><p>Con el margen que has elegido, tu precio sería</p><div className="wizard-money">{fmt(pvpFinal)} €</div><span>con IVA · {fmt(pvpSinIva)} € sin IVA</span></div>
            <div className="wizard-metrics"><article><span>Coste real {modo==='producto'?'por unidad':'del servicio'}</span><strong>{fmt(costeTotal)} €</strong></article><article><span>Precio actual</span><strong>{tieneComparador?`${fmt(precioActualNum)} €`:'Sin indicar'}</strong></article><article><span>Margen bruto de este precio</span><strong>{fmt(margenReal)} %</strong></article><article><span>Precio mínimo para cubrir costes comerciales</span><strong>{priceFloor===null?'Revisar gastos':`${fmt(priceFloor)} €`}</strong></article></div>
            {tieneComparador && <div className={`wizard-alert ${revenueMargin < 0 ? 'bad':'good'}`}><strong>{revenueMargin < 0?'Tu precio actual no cubre todos los costes incluidos.':'Así queda tu precio actual.'}</strong><p>A {fmt(precioActualNum)} € te queda un margen de {fmt(revenueMargin)} % después de costes y gastos comerciales, antes de impuestos personales.</p></div>}
            {warnings.length>0 && <div className="wizard-alert"><strong>Antes de decidir, revisa esto</strong><ul>{warnings.map(w=><li key={w}>{w}</li>)}</ul></div>}
            <details className="wizard-details"><summary>Ver de dónde salen los números</summary><div className="wizard-breakdown">{(modo==='producto'?[['Materiales',costeMateriales],['Envase',costePackaging],['Mano de obra',costeManoObra],['Otros directos',costeOtros],['Indirectos',costeIndirectoUnitario]]:[['Tu tiempo',costeManoObraServicio],['Indirectos',costeIndirectoServicio],['Otros directos',costeOtrosServicio]]).map(([label,n])=><div key={label}><span>{label}</span><strong>{fmt(n)} €</strong></div>)}<div><span>Publicidad y comisión al precio calculado</span><strong>{fmt(marketingImporte+comisionImporte)} €</strong></div></div></details>
            <p className="wizard-note">El precio mínimo cubre costes, publicidad y comisión; no incluye beneficio. El precio recomendado se calcula con el margen que has elegido: comprueba también qué acepta tu mercado. Estas cifras dependen de tus datos y no sustituyen asesoramiento fiscal.</p>
            <div className="wizard-actions"><button type="button" className="wizard-secondary" onClick={()=>setWizardStep(5)}>Ajustar mis datos</button><button type="button" className="wizard-secondary" onClick={guardar}>{saveMsg||'Guardar en este navegador'}</button></div>
            <div className="wizard-next"><h3>Ya sabes cuánto deberías cobrar.</h3><p>Ahora, ¿tu negocio está preparado para venderlo a ese precio? Precio, cliente, canales y proceso comercial van de la mano.</p><a className="wizard-primary" href="https://elisabethtchana.com/#contacto">Quiero revisar mi negocio →</a></div>
          </>}
        </div>
      </div>
    </div>
  );
}

function WizardActions({back,next,error}){return <><div className="wizard-actions"><button type="button" className="wizard-secondary" onClick={back}>Atrás</button><button type="button" className="wizard-primary" onClick={next}>Continuar →</button></div>{error&&<p className="wizard-error" role="alert">{error}</p>}</>}
function NumberField({label,value,onChange,unit,max}){return <label><span>{label}</span><div className="wizard-input-unit"><input type="number" min="0" max={max} step="0.01" inputMode="decimal" value={value} onChange={e=>onChange(Math.max(0,Math.min(max??Infinity,Number(e.target.value)||0)))}/><b>{unit}</b></div></label>}
function CostRows({title,items,setItems,hint,showWaste}){
  const update=(id,patch)=>setItems(items.map(it=>it.id===id?{...it,...patch}:it));
  return <div className="wizard-cost-section"><div className="wizard-section-title"><div><h3>{title}</h3><p>{hint}</p></div><strong>{fmt(sumItems(items))} €</strong></div>{items.map((it,i)=><div className="wizard-cost-row" key={it.id}><div className="row-head"><span>{title} {i+1}</span><button type="button" onClick={()=>setItems(items.filter(x=>x.id!==it.id))} aria-label={`Eliminar ${it.nombre||title}`}>Eliminar</button></div><div className="wizard-fields cols"><label><span>Concepto</span><input value={it.nombre} placeholder="Nombre" onChange={e=>update(it.id,{nombre:e.target.value})}/></label><label><span>Cantidad por venta</span><div className="wizard-input-unit"><input type="number" min="0" step="0.01" inputMode="decimal" value={it.cantidad} onChange={e=>update(it.id,{cantidad:Number(e.target.value)||0})}/><select aria-label="Unidad" value={it.unidad} onChange={e=>update(it.id,{unidad:e.target.value})}>{UNIDADES.map(u=><option key={u}>{u}</option>)}</select></div></label><NumberField label={`Coste por ${it.unidad}`} value={it.precio} onChange={v=>update(it.id,{precio:v})} unit="€"/>{showWaste&&<NumberField label="Merma" value={it.merma} onChange={v=>update(it.id,{merma:v})} unit="%" max={95}/>}</div></div>)}<button type="button" className="wizard-add" onClick={()=>setItems([...items,{id:uid(),nombre:'',cantidad:1,unidad:title==='Mano de obra'?'h':'ud',precio:0,merma:0}])}>+ Añadir {title.toLowerCase()}</button></div>
}
function FixedRows({items,setItems}){const update=(id,patch)=>setItems(items.map(it=>it.id===id?{...it,...patch}:it));return <div className="wizard-cost-section"><div className="wizard-section-title"><div><h3>Gastos fijos al mes</h3><p>Añade solo los que correspondan a tu negocio.</p></div></div>{items.map(it=><div className="wizard-fixed-row" key={it.id}><label><span>Concepto</span><input value={it.nombre} placeholder="Ej. alquiler o software" onChange={e=>update(it.id,{nombre:e.target.value})}/></label><NumberField label="Importe al mes" value={it.importe} onChange={v=>update(it.id,{importe:v})} unit="€"/><button type="button" onClick={()=>setItems(items.filter(x=>x.id!==it.id))} aria-label={`Eliminar ${it.nombre||'gasto'}`}>Eliminar</button></div>)}<button type="button" className="wizard-add" onClick={()=>setItems([...items,{id:uid(),nombre:'',importe:0}])}>+ Añadir gasto mensual</button></div>}
