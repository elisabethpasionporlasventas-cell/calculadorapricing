// Forward the calculator registration to the site's existing lead endpoint.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error:'Método no permitido'});
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) return res.status(415).json({error:'Formato no válido'});
  const body = req.body;
  if (!body || typeof body !== 'object' || JSON.stringify(body).length > 8000) return res.status(400).json({error:'Datos no válidos'});
  try {
    const upstream = await fetch('https://elisabethtchana.com/api/pricing-leads', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body), signal:AbortSignal.timeout(10000)
    });
    const result = await upstream.json();
    res.status(upstream.status).json(result);
  } catch {
    res.status(503).json({error:'El registro no está disponible temporalmente. Inténtalo de nuevo.'});
  }
}
