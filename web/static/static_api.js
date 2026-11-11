// Static-site data layer: answers api() GETs from the JSON files exported by scripts/build_static.py
// (api/info.json, api/demo.json). POST /replay plays moves through the Python engine, so it is refused here;
// the play page shows a "needs the local app" notice instead of calling it.
const files = new Map();
function file(rel) {
  if (!files.has(rel)) {
    files.set(rel, fetch('api/' + rel + '.json').then(r => { if (!r.ok) throw new Error(`${r.status} ${rel}`); return r.json(); }));
  }
  return files.get(rel);
}

export async function staticApi(path, body) {
  const clean = path.split('?')[0].replace(/^\/+/, '');
  if (body || clean === 'replay') throw new Error('Replaying moves through the Python engine needs the local app (python run_web.py).');
  return file(clean);
}
