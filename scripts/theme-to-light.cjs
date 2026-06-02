const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk(path.join(__dirname, '../src'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    content = content.replace(/bg-\[#0d0d0d\]/g, 'bg-white');
    content = content.replace(/bg-\[#111\]/g, 'bg-gray-50');
    content = content.replace(/bg-\[#111111\]/g, 'bg-gray-50');
    content = content.replace(/bg-\[#141414\]/g, 'bg-gray-50');
    content = content.replace(/bg-\[#1a1a1a\]/g, 'bg-gray-100');
    content = content.replace(/bg-\[#1f1f1f\]/g, 'bg-gray-200');
    
    // Borders
    content = content.replace(/border-\[#1a1a1a\]/g, 'border-gray-200');
    content = content.replace(/border-\[#1f1f1f\]/g, 'border-gray-200');
    content = content.replace(/border-\[#2a2a2a\]/g, 'border-gray-300');
    
    // Text colors
    content = content.replace(/text-\[#d0d0d0\]/g, 'text-gray-900');
    content = content.replace(/text-\[#f0f0f0\]/g, 'text-gray-900');
    content = content.replace(/text-\[#888\]/g, 'text-gray-600');
    content = content.replace(/text-\[#666\]/g, 'text-gray-500');
    content = content.replace(/text-\[#555\]/g, 'text-gray-500');
    content = content.replace(/text-\[#444\]/g, 'text-gray-500');
    
    content = content.replace(/text-white/g, 'text-black');
    content = content.replace(/text-\[#fff\]/gi, 'text-black');
    content = content.replace(/text-\[#ffffff\]/gi, 'text-black');

    let lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('bg-[#ba1f3d]') && lines[i].includes('text-black')) {
            lines[i] = lines[i].replace(/text-black/g, 'text-white');
        }
        if (lines[i].includes('bg-cardinal') && lines[i].includes('text-black')) {
            lines[i] = lines[i].replace(/text-black/g, 'text-white');
        }
        if (lines[i].includes('bg-black')) {
            lines[i] = lines[i].replace(/bg-black/g, 'bg-white');
        }
    }
    content = lines.join('\n');

    if (content !== original) {
        fs.writeFileSync(file, content);
    }
});
console.log('Done converting themes');
