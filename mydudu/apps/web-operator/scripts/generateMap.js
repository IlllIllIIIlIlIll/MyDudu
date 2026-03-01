const fs = require('fs');

const svg = fs.readFileSync('c:/Users/FAVIAN/Documents/GitHub/MyDudu/mydudu/apps/web-operator/public/maps/kabupaten-tangerang-districts.svg', 'utf8');

const matches = [...svg.matchAll(/<path d="([^"]+)"[^>]*data-name="([^"]+)"/g)];

// Precalculated 4-color mapping
const coloring = {
    'Jayanti': 0, 'Balaraja': 1, 'Cisoka': 2, 'Solear': 1, 'Tigaraksa': 0, 'Jambe': 2, 'Panongan': 1,
    'Cikupa': 2, 'Sukamulya': 3, 'Kresek': 1, 'GunungKaler': 2, 'Mekarbaru': 0, 'Kronjo': 1, 'Kemiri': 0,
    'Mauk': 1, 'Rajeg': 0, 'SindangJaya': 1, 'PasarKemis': 0, 'Sukadiri': 2, 'Pakuhaji': 0, 'Sepatan': 1,
    'SepatanTimur': 3, 'Teluknaga': 1, 'Kosambi': 0, 'Curug': 0, 'KelapaDua': 1, 'Legok': 2, 'Pagedangan': 0, 'Cisauk': 1
};

const colors = ['#FCA5A5', '#FDE047', '#86EFAC', '#93C5FD'];

let jsxPaths = matches.map(m => {
    const d = m[1];
    const name = m[2];
    let cIndex = coloring[name];
    if (cIndex === undefined) cIndex = Math.floor(Math.random() * 4);
    return `        <path d="${d}" fill="${colors[cIndex]}" stroke="#ffffff" strokeWidth="2" className="hover:opacity-80 transition-opacity cursor-pointer"><title>${name}</title></path>`;
}).join('\n');

const outLines = [];
outLines.push(`import React from 'react';`);
outLines.push(``);
outLines.push(`export function TangerangMap() {`);
outLines.push(`  return (`);
outLines.push(`    <div className="w-full flex flex-col items-center bg-gray-50 rounded-lg p-6 border border-gray-100 relative overflow-hidden">`);
outLines.push(`      {/* Legend Map */}`);
outLines.push(`      <div className="absolute top-4 left-4 flex flex-col gap-2 bg-white/90 p-3 rounded-md shadow-sm border border-gray-100 backdrop-blur-sm z-10 text-xs text-gray-600">`);
outLines.push(`        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FCA5A5]"></div>Tinggi</div>`);
outLines.push(`        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#FDE047]"></div>Sedang</div>`);
outLines.push(`        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#86EFAC]"></div>Rendah</div>`);
outLines.push(`        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#93C5FD]"></div>Aman</div>`);
outLines.push(`      </div>`);
outLines.push(``);
outLines.push(`      <svg viewBox="0 0 1000 934" className="w-full max-w-2xl h-auto drop-shadow-sm">`);
outLines.push(jsxPaths);
outLines.push(`      </svg>`);
outLines.push(`    </div>`);
outLines.push(`  );`);
outLines.push(`}`);

fs.writeFileSync('c:/Users/FAVIAN/Documents/GitHub/MyDudu/mydudu/apps/web-operator/src/components/TangerangMap.tsx', outLines.join('\n'));
console.log('Component Created successfully');
