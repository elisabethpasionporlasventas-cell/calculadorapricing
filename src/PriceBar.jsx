import { useEffect, useState } from "react";

const fmt = (n) =>
  (isFinite(n) ? n : 0).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const COLORS = ["#8C9A7B", "#D9B88F", "#B56A3C", "#CF9A72", "#B3BDA5", "#7A5A4A", "#9C8270"];
const IVA_COLOR = "#4A2D35";

/**
 * Barra «tu precio frente a lo que cuesta vender»: apila cada coste por venta,
 * marca el precio actual y dice en euros si se pierde o cuánto queda.
 * price: precio actual con IVA · iva: % · items: [{label, value}] costes por venta sin IVA
 * recommended: precio recomendado con IVA según el margen elegido.
 */
export default function PriceBar({ price, iva, items, recommended }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 120);
    return () => clearTimeout(t);
  }, []);

  const ivaImporte = price - price / (1 + iva / 100);
  const segs = [
    ...items.map((s, i) => ({ ...s, color: COLORS[i % COLORS.length] })).filter((s) => s.value > 0.004),
    ...(ivaImporte > 0.004 ? [{ label: `IVA (${iva} %)`, value: ivaImporte, color: IVA_COLOR }] : []),
  ];
  const total = segs.reduce((s, x) => s + x.value, 0);
  const queda = price - total;
  const scale = Math.max(price, total) * 1.06 || 1;
  const pct = (v) => (v / scale) * 100;

  const estado = queda < 0 ? "rojo" : recommended > 0 && price + 0.004 < recommended ? "ambar" : "verde";
  const titulo =
    estado === "rojo"
      ? `Pierdes ${fmt(-queda)} € en cada venta`
      : estado === "ambar"
      ? `Te quedan ${fmt(queda)} € por venta`
      : `Cubres todo y te quedan ${fmt(queda)} € por venta`;
  const detalle =
    estado === "rojo"
      ? "Tu precio no llega a cubrir lo que te cuesta vender."
      : estado === "ambar"
      ? `Cubres los costes, pero no llegas al margen que te has marcado. Para llegar, tu precio debería ser ${fmt(recommended)} €.`
      : "Tu precio cubre los costes y el margen que te has marcado.";

  let x = 0;
  return (
    <section className={`pbar pbar-${estado}`} aria-label="Tu precio frente a lo que te cuesta vender">
      <div className="pbar-head">
        <span>Lo vendes a</span>
        <strong>{fmt(price)} €</strong>
      </div>
      <div className="pbar-track" role="img" aria-label={`${titulo}. ${detalle}`}>
        {segs.map((s, i) => {
          const left = x;
          x += pct(s.value);
          return (
            <span
              key={s.label}
              className="pbar-seg"
              style={{
                left: `${left}%`,
                width: shown ? `${pct(s.value)}%` : 0,
                background: s.color,
                transitionDelay: `${i * 140}ms`,
              }}
            />
          );
        })}
        {queda < 0 && (
          <span className="pbar-loss" style={{ left: `${pct(price)}%`, width: `${pct(-queda)}%`, opacity: shown ? 1 : 0, transitionDelay: `${segs.length * 140 + 150}ms` }} />
        )}
        {queda > 0 && (
          <span className="pbar-keep" style={{ left: `${pct(total)}%`, width: shown ? `${pct(queda)}%` : 0, transitionDelay: `${segs.length * 140 + 150}ms` }} />
        )}
        <span className={`pbar-mark ${pct(price) > 70 ? "flip" : ""}`} style={{ left: `${pct(price)}%` }}>
          <em>tu precio</em>
        </span>
      </div>
      <ul className="pbar-legend">
        {segs.map((s) => (
          <li key={s.label}>
            <i style={{ background: s.color }} />
            {s.label}
            <b>{fmt(s.value)} €</b>
          </li>
        ))}
        {queda > 0 && (
          <li className="pbar-legend-keep">
            <i style={{ background: "#68745a" }} />
            Te queda
            <b>{fmt(queda)} €</b>
          </li>
        )}
      </ul>
      <div className="pbar-verdict">
        <span className="pbar-lights" aria-hidden="true">
          <i className="l-rojo" />
          <i className="l-ambar" />
          <i className="l-verde" />
        </span>
        <div>
          <strong>{titulo}</strong>
          <p>{detalle} Antes de impuestos personales (IRPF).</p>
        </div>
      </div>
    </section>
  );
}
