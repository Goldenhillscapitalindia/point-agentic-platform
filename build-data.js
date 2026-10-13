// Build trusted chat snapshots from the same source datasets and adapters as the UI.
// Only repository source is evaluated here, never visitor input or environment values.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('./chat-core');
const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8');

function declaration(source, name) {
  const match = new RegExp('\\bconst\\s+' + name + '\\s*=').exec(source);
  if (!match) throw new Error('Missing dataset: ' + name);
  const start = match.index + match[0].length;
  for (let end = source.indexOf(';', start); end >= 0; end = source.indexOf(';', end + 1)) {
    const expression = source.slice(start, end);
    try { new vm.Script('(' + expression + ')'); }
    catch { continue; }
    return 'const ' + name + ' = ' + expression + ';\n';
  }
  throw new Error('Incomplete dataset: ' + name);
}

function generate() {
  const source = read('app.js'), markup = read('index.html');
  const columns = {};
  for (const table of markup.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)) {
    const id = /<tbody[^>]*id="([^"]+)"/.exec(table[1]);
    if (!id) continue;
    columns[id[1]] = [...table[1].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/g)]
      .map(m => ({textContent: core.clean(m[1]).trim()}));
  }
  const names = ['fundDetail','fundExtra','fundCards','decisionBriefs','viewTables','panelData','marketData','cards','cardsByFund','briefs','funds'];
  const context = vm.createContext({PointChatCore:core, document:{getElementById(id) {
    if (!columns[id]?.length) throw new Error('Missing table headings: ' + id);
    return {closest:()=>({querySelectorAll:()=>columns[id]})};
  }}});
  const adapter = source.slice(source.indexOf('  function chatSnapshot(id)'), source.indexOf('  const pointChat=window.PointChat.mount'));
  const platform = vm.runInContext(names.map(n=>declaration(source,n)).join('') +
    '\nfunction account(){return {funds:funds.map(f=>f.id)}}\n' + adapter + '\nfunds.map(f=>chatSnapshot(f.id));', context, {timeout:3000});
  const terminalSource = read('institutional.js');
  const terminalNames = ['FUNDS','APEX','HEALTH','CHANGED','CARDS','LIMITS','DECISIONS','OPPS'];
  const terminalAdapter = terminalSource.slice(terminalSource.indexOf('function terminalSnapshot(id)'), terminalSource.indexOf('const pointChat=window.PointChat.mount'));
  const terminal = vm.runInNewContext(terminalNames.map(n=>declaration(terminalSource,n)).join('') + terminalAdapter +
    '\nObject.keys(FUNDS).map(terminalSnapshot);', {PointChatCore:core}, {timeout:3000});
  const snapshots = [...platform, ...terminal];
  const out = path.join(__dirname, 'server');
  fs.mkdirSync(out, {recursive:true});
  fs.writeFileSync(path.join(out, 'portfolio-data.json'), JSON.stringify(snapshots, null, 2) + '\n');
  return snapshots;
}
module.exports = {generate};
if (require.main === module) generate();
