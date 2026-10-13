'use strict';
const fs = require('fs');
const j = JSON.parse(fs.readFileSync(require('path').join(__dirname, '..', 'data', 'research-2026-10-12.json'), 'utf8'));
function td(c) {
  if (Array.isArray(c)) return `<td class="${c[0]}">${c[1]}</td>`;
  let s = String(c);
  if (/^-\d/.test(s)) s = '−' + s.slice(1);
  return `<td>${s}</td>`;
}
const html = j.alpha.rows.map(r => {
  const sep = r[0] === '…';
  return `            <tr${sep ? ' class="tbl-sep"' : ''}>${r.map(td).join('')}</tr>`;
}).join('\n');
fs.writeFileSync(require('path').join(__dirname, '..', 'data', 'research-tbody.html'), html);
const indexPath = require('path').join(__dirname, '..', 'index.html');
let page = fs.readFileSync(indexPath, 'utf8');
const re = /<tbody id="research-universe">[\s\S]*?<\/tbody>/;
if (!re.test(page)) throw new Error('tbody not found');
page = page.replace(re, '<tbody id="research-universe">\n' + html + '\n          </tbody>');
fs.writeFileSync(indexPath, page);
console.log('patched index.html', j.alpha.rows.length);
