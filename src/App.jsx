import { useState, useEffect, useCallback } from "react";
import { Ruler, Stamp, Save, Trash2, Sparkles, Loader2, ChevronDown, Plus, Info } from "lucide-react";

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

let uidCounter = 1;
const uid = () => `it-${Date.now()}-${uidCounter++}`;

function BlueprintPanel({ children, className = "", title, tag, hint }) {
  return (
    <div className={`relative border border-[#2E5C87] bg-[#0F2A47]/60 ${className}`}>
      <div className="absolute -top-3 left-4 bg-[#0A1F33] px-2 text-[10px] tracking-[0.2em] text-[#7FA8CC] font-['JetBrains_Mono'] uppercase flex items-center gap-1.5">
        {tag && <span className="text-[#E3A857]">{tag}</span>}
        {title}
      </div>
      {hint && <p className="text-[10px] text-[#5A7CA0] leading-relaxed px-4 pt-5 -mb-2">{hint}</p>}
      {children}
    </div>
  );
}

function DimLine({ label, value, accent = "#5FA8D3" }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-[#2E5C87] relative">
        <span className="absolute -left-1 -top-[3px] w-[7px] h-[7px] border-l border-t border-[#2E5C87] rotate-[-45deg]" />
        <span className="absolute -right-1 -top-[3px] w-[7px] h-[7px] border-r border-t border-[#2E5C87] rotate-45" />
      </div>
      <span className="text-[10px] uppercase tracking-wider text-[#7FA8CC] font-['JetBrains_Mono'] whitespace-nowrap">{label}</span>
      <span className="text-xs font-['JetBrains_Mono'] font-semibold whitespace-nowrap" style={{ color: accent }}>{value}</span>
    </div>
  );
}

const lineTotal = (it) => {
  const base = (it.cantidad || 0) * (it.precio || 0);
  const merma = Math.min(it.merma || 0, 95);
  return merma > 0 ? base / (1 - merma / 100) : base;
};
const sumItems = (items) => items.reduce((s, it) => s + lineTotal(it), 0);

function ItemList({ items, setItems, placeholder, showMerma = true }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => setItems(items.filter((it) => it.id !== id));
  const add = () => setItems([...items, { id: uid(), nombre: "", cantidad: 1, unidad: "ud", precio: 0, merma: 0 }]);
  const total = sumItems(items);
  const cols = showMerma ? "grid-cols-[1fr_46px_50px_58px_46px_58px_auto]" : "grid-cols-[1fr_52px_54px_64px_60px_auto]";

  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className={`grid ${cols} gap-1.5 text-[9px] uppercase tracking-wide text-[#5A7CA0] px-0.5`}>
          <span>Nombre</span><span>Cant.</span><span>Ud.</span><span>€/ud</span>
          {showMerma && <span title="% que se pierde/desecha">Merma</span>}
          <span className="text-right">Subtotal</span><span />
        </div>
      )}
      {items.length === 0 && <p className="text-[11px] text-[#5A7CA0] italic">{placeholder}</p>}
      {items.map((it) => (
        <div key={it.id} className={`grid ${cols} gap-1.5 items-center`}>
          <input value={it.nombre} onChange={(e) => update(it.id, { nombre: e.target.value })} placeholder="Nombre"
            className="bg-[#0A1F33] border border-[#2E5C87] px-2 py-1.5 text-xs outline-none focus:border-[#E3A857] placeholder:text-[#3D5A78]" />
          <input type="number" step="0.01" value={it.cantidad} onChange={(e) => update(it.id, { cantidad: parseFloat(e.target.value) || 0 })}
            className="bg-[#0A1F33] border border-[#2E5C87] px-1.5 py-1.5 text-xs font-['JetBrains_Mono'] outline-none focus:border-[#E3A857]" />
          <select value={it.unidad} onChange={(e) => update(it.id, { unidad: e.target.value })}
            className="bg-[#0A1F33] border border-[#2E5C87] px-1 py-1.5 text-xs outline-none focus:border-[#E3A857]">
            {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <input type="number" step="0.01" value={it.precio} onChange={(e) => update(it.id, { precio: parseFloat(e.target.value) || 0 })}
            title="Precio por unidad (€)" className="bg-[#0A1F33] border border-[#2E5C87] px-1.5 py-1.5 text-xs font-['JetBrains_Mono'] outline-none focus:border-[#E3A857]" />
          {showMerma && (
            <input type="number" step="1" value={it.merma || 0} onChange={(e) => update(it.id, { merma: parseFloat(e.target.value) || 0 })}
              title="% de merma" className="bg-[#0A1F33] border border-[#2E5C87] px-1.5 py-1.5 text-xs font-['JetBrains_Mono'] outline-none focus:border-[#E3A857]" />
          )}
          <span className="text-[11px] font-['JetBrains_Mono'] text-[#7FA8CC] text-right pr-1">{fmt(lineTotal(it))}€</span>
          <button onClick={() => remove(it.id)} className="text-[#E38E3D] hover:text-[#f0a35a] p-1"><Trash2 size={13} /></button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-[#5FA8D3] hover:text-[#8ECAE6] mt-1">
        <Plus size={13} /> Añadir
      </button>
      <div className="flex justify-between items-center border-t border-[#2E5C87] pt-2 mt-2">
        <span className="text-[11px] uppercase tracking-wide text-[#7FA8CC]">Subtotal</span>
        <span className="font-['JetBrains_Mono'] text-sm font-semibold text-[#EAF2FA]">{fmt(total)} €</span>
      </div>
    </div>
  );
}

function IndirectList({ items, setItems }) {
  const update = (id, patch) => setItems(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id) => setItems(items.filter((it) => it.id !== id));
  const add = () => setItems([...items, { id: uid(), nombre: "", importe: 0 }]);
  const total = items.reduce((s, it) => s + (it.importe || 0), 0);

  return (
    <div className="space-y-2">
      {items.length === 0 && <p className="text-[11px] text-[#5A7CA0] italic">Alquiler, luz, seguros, amortización de herramientas…</p>}
      {items.map((it) => (
        <div key={it.id} className="grid grid-cols-[1fr_90px_auto] gap-1.5 items-center">
          <input value={it.nombre} onChange={(e) => update(it.id, { nombre: e.target.value })} placeholder="Concepto"
            className="bg-[#0A1F33] border border-[#2E5C87] px-2 py-1.5 text-xs outline-none focus:border-[#E3A857] placeholder:text-[#3D5A78]" />
          <div className="flex items-center border border-[#2E5C87] bg-[#0A1F33]">
            <input type="number" step="0.01" value={it.importe} onChange={(e) => update(it.id, { importe: parseFloat(e.target.value) || 0 })}
              className="w-full bg-transparent px-2 py-1.5 text-xs font-['JetBrains_Mono'] outline-none" />
            <span className="pr-2 text-[10px] text-[#5FA8D3]">€/mes</span>
          </div>
          <button onClick={() => remove(it.id)} className="text-[#E38E3D] hover:text-[#f0a35a] p-1"><Trash2 size={13} /></button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-[#5FA8D3] hover:text-[#8ECAE6] mt-1">
        <Plus size={13} /> Añadir
      </button>
      <div className="flex justify-between items-center border-t border-[#2E5C87] pt-2 mt-2">
        <span className="text-[11px] uppercase tracking-wide text-[#7FA8CC]">Total fijo / mes</span>
        <span className="font-['JetBrains_Mono'] text-sm font-semibold text-[#EAF2FA]">{fmt(total)} €</span>
      </div>
    </div>
  );
}

export default function App() {
  const [nombre, setNombre] = useState("Mi producto");
  const [sector, setSector] = useState("");

  const [materiales, setMateriales] = useState([{ id: uid(), nombre: "Materia prima", cantidad: 1, unidad: "kg", precio: 3.5, merma: 5 }]);
  const [packaging, setPackaging] = useState([
    { id: uid(), nombre: "Caja", cantidad: 1, unidad: "ud", precio: 0.5, merma: 0 },
    { id: uid(), nombre: "Etiqueta", cantidad: 1, unidad: "ud", precio: 0.15, merma: 0 },
  ]);
  const [manoObra, setManoObra] = useState([{ id: uid(), nombre: "Elaboración", cantidad: 0.25, unidad: "h", precio: 12, merma: 0 }]);
  const [otros, setOtros] = useState([]);

  const [indirectos, setIndirectos] = useState([]);
  const [unidadesMes, setUnidadesMes] = useState(100);

  const [modoMargen, setModoMargen] = useState("coste");
  const [margen, setMargen] = useState(45);
  const [iva, setIva] = useState(21);
  const [irpf, setIrpf] = useState(20);
  const [irpfOpen, setIrpfOpen] = useState(false);

  const [marketingPct, setMarketingPct] = useState(5);
  const [comisionTipo, setComisionTipo] = useState("porcentaje");
  const [comisionValor, setComisionValor] = useState(0);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiSugerencia, setAiSugerencia] = useState(null);

  const [guardados, setGuardados] = useState([]);
  const [saveMsg, setSaveMsg] = useState("");

  const costeMateriales = sumItems(materiales);
  const costePackaging = sumItems(packaging);
  const costeManoObra = sumItems(manoObra);
  const costeOtros = sumItems(otros);
  const totalIndirectosMes = indirectos.reduce((s, it) => s + (it.importe || 0), 0);
  const costeIndirectoUnitario = unidadesMes > 0 ? totalIndirectosMes / unidadesMes : 0;
  const costeTotal = costeMateriales + costePackaging + costeManoObra + costeOtros + costeIndirectoUnitario;

  const pvpSinIva = modoMargen === "coste" ? costeTotal * (1 + margen / 100) : margen < 100 ? costeTotal / (1 - margen / 100) : costeTotal;
  const beneficioBruto = pvpSinIva - costeTotal;
  const ivaImporte = pvpSinIva * (iva / 100);
  const pvpFinal = pvpSinIva + ivaImporte;
  const margenReal = pvpSinIva > 0 ? (beneficioBruto / pvpSinIva) * 100 : 0;

  const marketingImporte = pvpSinIva * (marketingPct / 100);
  const comisionImporte = comisionTipo === "porcentaje" ? pvpSinIva * (comisionValor / 100) : comisionValor;
  const beneficioAntesImpuestos = beneficioBruto - marketingImporte - comisionImporte;
  const provisionIrpf = Math.max(beneficioAntesImpuestos, 0) * (irpf / 100);
  const netoPorVenta = beneficioAntesImpuestos - provisionIrpf;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setGuardados(raw ? JSON.parse(raw) : []);
    } catch {
      setGuardados([]);
    }
  }, []);

  const guardar = useCallback(() => {
    const entry = { id: Date.now(), nombre, sector, costeTotal, margen, modoMargen, iva, irpf, marketingPct, comisionTipo, comisionValor, pvpFinal, netoPorVenta };
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
  }, [nombre, sector, costeTotal, margen, modoMargen, iva, irpf, marketingPct, comisionTipo, comisionValor, pvpFinal, netoPorVenta, guardados]);

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
      const prompt = `Eres un asesor comercial para autónomos y pequeños negocios de producto en España (cliente de la consultora "Arquitectura Comercial").
Datos del producto:
- Nombre: ${nombre || "producto sin nombre"}
- Sector / tipo de negocio: ${sector || "no especificado"}
- Coste materiales (con mermas aplicadas): ${costeMateriales.toFixed(2)} €
- Coste packaging: ${costePackaging.toFixed(2)} €
- Coste mano de obra: ${costeManoObra.toFixed(2)} €
- Otros costes: ${costeOtros.toFixed(2)} €
- Coste indirecto prorrateado por unidad: ${costeIndirectoUnitario.toFixed(2)} €
- Coste total unitario: ${costeTotal.toFixed(2)} €
- IVA aplicable: ${iva}%
- % marketing/ads sobre cada venta: ${marketingPct}%
- Comisión por venta: ${comisionTipo === "porcentaje" ? comisionValor + "%" : comisionValor + " € fijos"}

Sugiere un rango de margen comercial razonable (sobre el PVP sin IVA) para este producto y sector en el mercado español.

Responde ÚNICAMENTE con JSON válido, sin texto adicional: {"marginMin": numero, "marginMax": numero, "marginRecomendado": numero, "razonamiento": "texto breve en español, máximo 3 frases"}`;

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
  }, [nombre, sector, costeMateriales, costePackaging, costeManoObra, costeOtros, costeIndirectoUnitario, costeTotal, iva, marketingPct, comisionTipo, comisionValor]);

  const breakdown = [
    { label: "Materiales", value: costeMateriales },
    { label: "Packaging", value: costePackaging },
    { label: "Mano de obra", value: costeManoObra },
    { label: "Otros directos", value: costeOtros },
    { label: "Indirectos (prorrateo)", value: costeIndirectoUnitario },
  ];

  return (
    <div className="min-h-screen w-full bg-[#0A1F33] text-[#EAF2FA] font-['Inter'] pb-16">
      <style>{`
        .blueprint-grid {
          background-image:
            linear-gradient(rgba(95,168,211,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(95,168,211,0.07) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
      `}</style>

      <div className="blueprint-grid">
        <header className="border-b border-[#2E5C87] px-6 py-6 md:px-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 text-[#E3A857] text-[11px] tracking-[0.3em] uppercase font-['JetBrains_Mono'] mb-1">
                <Ruler size={13} /> Arquitectura Comercial
              </div>
              <h1 className="text-2xl md:text-3xl font-['Space_Grotesk'] font-semibold text-[#EAF2FA]">Plano de Escandallo</h1>
              <p className="text-[#7FA8CC] text-sm mt-1">Materiales con merma, packaging, mano de obra, indirectos, margen, marketing, comisiones, IVA e IRPF.</p>
            </div>
            <div className="relative border border-[#E3A857] px-3 py-1.5 rotate-[-3deg] text-[#E3A857] text-[10px] tracking-[0.15em] uppercase font-['JetBrains_Mono']">Escala 1:1</div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 md:px-10 py-8 grid lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
            <BlueprintPanel title="Identificación del producto" tag="01">
              <div className="p-4 space-y-3">
                <label className="block">
                  <span className="block text-[11px] uppercase tracking-wide text-[#7FA8CC] mb-1">Nombre del producto</span>
                  <input value={nombre} onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-[#0A1F33] border border-[#2E5C87] px-3 py-2 text-sm outline-none focus:border-[#E3A857] transition-colors" />
                </label>
                <label className="block">
                  <span className="block text-[11px] uppercase tracking-wide text-[#7FA8CC] mb-1">Sector / tipo de negocio</span>
                  <input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="p. ej. cosmética artesanal, alimentación, cerámica…"
                    className="w-full bg-[#0A1F33] border border-[#2E5C87] px-3 py-2 text-sm outline-none focus:border-[#E3A857] transition-colors placeholder:text-[#3D5A78]" />
                </label>
              </div>
            </BlueprintPanel>

            <BlueprintPanel title="Materiales" tag="02" hint="El % de merma sube el coste real: recortes, desecho, mal aprovechamiento de un material.">
              <div className="p-4 pt-2"><ItemList items={materiales} setItems={setMateriales} placeholder="Añade cada material: tela, harina, cera, hilo…" /></div>
            </BlueprintPanel>

            <BlueprintPanel title="Packaging" tag="03">
              <div className="p-4"><ItemList items={packaging} setItems={setPackaging} placeholder="Caja, bolsa, etiqueta 1, etiqueta 2, adorno, papel de relleno…" /></div>
            </BlueprintPanel>

            <BlueprintPanel title="Mano de obra" tag="04">
              <div className="p-4"><ItemList items={manoObra} setItems={setManoObra} placeholder="Tareas por horas: elaboración, montaje, envasado…" /></div>
            </BlueprintPanel>

            <BlueprintPanel title="Otros costes directos" tag="05">
              <div className="p-4"><ItemList items={otros} setItems={setOtros} placeholder="Cualquier otro coste directo del producto." /></div>
            </BlueprintPanel>

            <BlueprintPanel title="Costes indirectos (prorrateados)" tag="06" hint="Alquiler, luz, seguros, amortización… se reparten entre las unidades que estimas vender al mes.">
              <div className="p-4 pt-2 space-y-3">
                <IndirectList items={indirectos} setItems={setIndirectos} />
                <label className="block">
                  <span className="block text-[11px] uppercase tracking-wide text-[#7FA8CC] mb-1">Unidades estimadas al mes</span>
                  <input type="number" step="1" value={unidadesMes} onChange={(e) => setUnidadesMes(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0A1F33] border border-[#2E5C87] px-3 py-2 text-sm font-['JetBrains_Mono'] outline-none focus:border-[#E3A857]" />
                </label>
                <div className="flex justify-between items-center border-t border-[#2E5C87] pt-2">
                  <span className="text-[11px] uppercase tracking-wide text-[#7FA8CC]">Coste indirecto / unidad</span>
                  <span className="font-['JetBrains_Mono'] text-sm font-semibold text-[#EAF2FA]">{fmt(costeIndirectoUnitario)} €</span>
                </div>
              </div>
            </BlueprintPanel>

            <BlueprintPanel title="Margen comercial" tag="07">
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center border-b border-[#2E5C87] pb-3">
                  <span className="text-[11px] uppercase tracking-wide text-[#7FA8CC]">Coste total unitario</span>
                  <span className="font-['JetBrains_Mono'] text-lg font-semibold text-[#EAF2FA]">{fmt(costeTotal)} €</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setModoMargen("coste")} className={`flex-1 py-1.5 text-xs uppercase tracking-wide border transition-colors ${modoMargen === "coste" ? "border-[#E3A857] text-[#E3A857] bg-[#E3A857]/10" : "border-[#2E5C87] text-[#7FA8CC]"}`}>% sobre coste</button>
                  <button onClick={() => setModoMargen("pvp")} className={`flex-1 py-1.5 text-xs uppercase tracking-wide border transition-colors ${modoMargen === "pvp" ? "border-[#E3A857] text-[#E3A857] bg-[#E3A857]/10" : "border-[#2E5C87] text-[#7FA8CC]"}`}>% sobre PVP</button>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] uppercase tracking-wide text-[#7FA8CC]">Margen</span>
                    <span className="font-['JetBrains_Mono'] text-sm text-[#E3A857] font-semibold">{margen}%</span>
                  </div>
                  <input type="range" min="0" max={modoMargen === "pvp" ? 90 : 300} value={margen} onChange={(e) => setMargen(parseFloat(e.target.value))} className="w-full accent-[#E3A857]" />
                </div>
                <button onClick={pedirSugerenciaIA} disabled={aiLoading}
                  className="w-full flex items-center justify-center gap-2 border border-[#5FA8D3] text-[#5FA8D3] hover:bg-[#5FA8D3]/10 py-2 text-xs uppercase tracking-wide transition-colors disabled:opacity-50">
                  {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {aiLoading ? "Calculando…" : "Sugerencia de margen con IA"}
                </button>
                {aiError && <p className="text-xs text-[#E38E3D]">{aiError}</p>}
                {aiSugerencia && (
                  <div className="border border-[#5FA8D3]/40 bg-[#5FA8D3]/5 p-3 text-xs space-y-1">
                    <p className="text-[#8ECAE6] font-['JetBrains_Mono']">Rango sugerido: {aiSugerencia.marginMin}%–{aiSugerencia.marginMax}% (recomendado {aiSugerencia.marginRecomendado}%)</p>
                    <p className="text-[#A9C4DE]">{aiSugerencia.razonamiento}</p>
                  </div>
                )}
              </div>
            </BlueprintPanel>

            <BlueprintPanel title="Marketing y comisiones" tag="08">
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] uppercase tracking-wide text-[#7FA8CC]">% destinado a ads / marketing</span>
                    <span className="font-['JetBrains_Mono'] text-sm text-[#E3A857] font-semibold">{marketingPct}%</span>
                  </div>
                  <input type="range" min="0" max="30" value={marketingPct} onChange={(e) => setMarketingPct(parseFloat(e.target.value))} className="w-full accent-[#E3A857]" />
                  <p className="text-[10px] text-[#5A7CA0] mt-1">Se calcula sobre el PVP sin IVA de cada venta.</p>
                </div>
                <div>
                  <span className="block text-[11px] uppercase tracking-wide text-[#7FA8CC] mb-1">Comisión por venta</span>
                  <div className="flex gap-2">
                    <select value={comisionTipo} onChange={(e) => setComisionTipo(e.target.value)} className="bg-[#0A1F33] border border-[#2E5C87] px-2 py-2 text-xs outline-none focus:border-[#E3A857]">
                      <option value="porcentaje">%</option>
                      <option value="fijo">€ fijos</option>
                    </select>
                    <input type="number" step="0.01" value={comisionValor} onChange={(e) => setComisionValor(parseFloat(e.target.value) || 0)}
                      className="flex-1 bg-[#0A1F33] border border-[#2E5C87] px-3 py-2 text-sm font-['JetBrains_Mono'] outline-none focus:border-[#E3A857]" />
                  </div>
                </div>
              </div>
            </BlueprintPanel>

            <BlueprintPanel title="Impuestos" tag="09">
              <div className="p-4 space-y-3">
                <label className="block">
                  <span className="block text-[11px] uppercase tracking-wide text-[#7FA8CC] mb-1">IVA aplicable</span>
                  <select value={iva} onChange={(e) => setIva(parseFloat(e.target.value))} className="w-full bg-[#0A1F33] border border-[#2E5C87] px-3 py-2 text-sm outline-none focus:border-[#E3A857]">
                    {IVA_OPTIONS.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                  </select>
                </label>
                <div>
                  <button onClick={() => setIrpfOpen(!irpfOpen)} className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-[#7FA8CC] mb-1">
                    Provisión IRPF (estimada) <ChevronDown size={12} className={`transition-transform ${irpfOpen ? "rotate-180" : ""}`} />
                  </button>
                  {irpfOpen && (
                    <p className="text-[11px] text-[#7FA8CC] mb-2 leading-relaxed">
                      Como autónomo en estimación directa, el IRPF no se retiene venta a venta: se paga trimestralmente (pago fraccionado, normalmente 20% del beneficio). Este % es una reserva orientativa.
                    </p>
                  )}
                  <div className="flex items-center border border-[#2E5C87] bg-[#0A1F33]">
                    <input type="number" step="1" value={irpf} onChange={(e) => setIrpf(parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent px-3 py-2 text-[#EAF2FA] font-['JetBrains_Mono'] text-sm outline-none" />
                    <span className="pr-3 text-[#5FA8D3] text-xs font-['JetBrains_Mono']">%</span>
                  </div>
                </div>
              </div>
            </BlueprintPanel>
          </div>

          <div className="space-y-6 lg:sticky lg:top-6">
            <BlueprintPanel title="Alzado del precio" tag="10" className="pb-6">
              <div className="p-5">
                <div className="text-[10px] uppercase tracking-wider text-[#5A7CA0] mb-2 flex items-center gap-1"><Info size={11} /> Reparto del coste total</div>
                <div className="space-y-1 text-xs font-['JetBrains_Mono'] mb-3">
                  {breakdown.map((b) => (
                    <div key={b.label} className="flex justify-between text-[#A9C4DE]">
                      <span>{b.label}</span>
                      <span>{fmt(b.value)} € {costeTotal > 0 && <span className="text-[#5A7CA0]">({fmt((b.value / costeTotal) * 100)}%)</span>}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-stretch">
                  <div className="border border-[#2E5C87] bg-[#0A1F33] p-3 flex justify-between items-center">
                    <span className="text-[11px] uppercase tracking-wide text-[#7FA8CC]">Coste total</span>
                    <span className="font-['JetBrains_Mono'] text-sm">{fmt(costeTotal)} €</span>
                  </div>
                  <DimLine label="+ margen" value={`${fmt(beneficioBruto)} € (${fmt(margenReal)}%)`} accent="#E3A857" />
                  <div className="border border-[#E3A857]/60 bg-[#E3A857]/10 p-3 flex justify-between items-center">
                    <span className="text-[11px] uppercase tracking-wide text-[#E3A857]">PVP sin IVA</span>
                    <span className="font-['JetBrains_Mono'] text-sm font-semibold text-[#E3A857]">{fmt(pvpSinIva)} €</span>
                  </div>
                  <DimLine label={`+ iva ${iva}%`} value={`${fmt(ivaImporte)} €`} />
                  <div className="border-2 border-[#5FA8D3] bg-[#5FA8D3]/10 p-3 flex justify-between items-center">
                    <span className="text-xs uppercase tracking-wide text-[#8ECAE6] font-semibold">PVP final cliente</span>
                    <span className="font-['JetBrains_Mono'] text-xl font-bold text-[#8ECAE6]">{fmt(pvpFinal)} €</span>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-dashed border-[#2E5C87] space-y-1.5">
                  <div className="flex justify-between items-center text-sm"><span className="text-[#A9C4DE]">Beneficio bruto por venta</span><span className="font-['JetBrains_Mono']">{fmt(beneficioBruto)} €</span></div>
                  <div className="flex justify-between items-center text-sm"><span className="text-[#A9C4DE]">− Marketing / ads ({marketingPct}%)</span><span className="font-['JetBrains_Mono'] text-[#E38E3D]">−{fmt(marketingImporte)} €</span></div>
                  <div className="flex justify-between items-center text-sm"><span className="text-[#A9C4DE]">− Comisión por venta</span><span className="font-['JetBrains_Mono'] text-[#E38E3D]">−{fmt(comisionImporte)} €</span></div>
                  <div className="flex justify-between items-center text-sm"><span className="text-[#A9C4DE]">− Provisión IRPF ({irpf}%)</span><span className="font-['JetBrains_Mono'] text-[#E38E3D]">−{fmt(provisionIrpf)} €</span></div>
                  <div className="border border-[#7FB88F] bg-[#7FB88F]/10 p-3 flex justify-between items-center mt-2">
                    <span className="text-xs uppercase tracking-wide text-[#7FB88F] font-semibold flex items-center gap-1.5"><Stamp size={14} /> Neto real por venta</span>
                    <span className="font-['JetBrains_Mono'] text-xl font-bold text-[#7FB88F]">{fmt(netoPorVenta)} €</span>
                  </div>
                </div>
                <button onClick={guardar} className="mt-5 w-full flex items-center justify-center gap-2 bg-[#E3A857] text-[#0A1F33] py-2.5 text-xs uppercase tracking-wide font-semibold hover:bg-[#f0b968] transition-colors">
                  <Save size={14} /> {saveMsg || "Guardar este escandallo"}
                </button>
              </div>
            </BlueprintPanel>

            <BlueprintPanel title="Archivo de planos guardados" tag="11">
              <div className="p-4">
                {guardados.length === 0 ? (
                  <p className="text-xs text-[#7FA8CC]">Aún no has guardado ningún escandallo.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {guardados.map((g) => (
                      <div key={g.id} className="flex items-center justify-between border border-[#2E5C87] px-3 py-2 text-xs">
                        <div>
                          <p className="text-[#EAF2FA] font-medium">{g.nombre}</p>
                          <p className="text-[#7FA8CC] font-['JetBrains_Mono']">PVP {fmt(g.pvpFinal)} € · Neto {fmt(g.netoPorVenta)} €</p>
                        </div>
                        <button onClick={() => borrar(g.id)} className="text-[#E38E3D] hover:text-[#f0a35a] p-1"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </BlueprintPanel>
          </div>
        </main>
      </div>
    </div>
  );
}
