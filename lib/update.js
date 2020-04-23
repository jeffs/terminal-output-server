#!/usr/bin/env -S node --experimental-modules --no-warnings

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

import Convert from 'ansi-to-html';

const libPath = path.dirname(new URL(import.meta.url).pathname);
const varPath = path.join(libPath, '..', 'var');
const srvPath = path.join(libPath, '..', 'srv');
const etcPath = path.join(libPath, '..', 'etc');

const rawPath = path.join(varPath, 'output.raw');
const logPath = path.join(varPath, 'output.log');
const tmpPath = path.join(varPath, 'output.html');
const outPath = path.join(srvPath, 'output.html');

const exePath = path.join(etcPath, 'build')
const cssPath = path.join(etcPath, 'style.css')

const convert = new Convert({
    fg: 'cyan',
    bg: '#111',
    escapeXML: true,
});

async function loadPreamble() {
    const style = await fs.promises.readFile(cssPath, 'utf-8');
    return `<meta charset="utf-8"><style>${style}</style>`;
}

function format(text) {
    const isHTML = text.search('<.*>') !== -1;
    return isHTML ? text : `<pre>${convert.toHtml(text)}</pre>`;
}

async function transformRaw(errorCode) {
    const logText = await fs.promises.readFile(logPath, 'utf-8');
    const rawText = await fs.promises.readFile(rawPath, 'utf-8');
    const preamble = await loadPreamble();

    let html = preamble;
    if (errorCode || logText) {
        html += '<div class="error-box">';
        if (logText) {
            html += format(logText);
        }
        html += `<p>process returned ${errorCode}</p>`;
        html += '</div>';
    }
    if (rawText) {
        html += format(rawText);
    }

    await fs.promises.writeFile(tmpPath, html);
    await fs.promises.rename(tmpPath, outPath);
}

export default function update() {
    const proc = spawn(exePath);
    const rawStream = fs.createWriteStream(rawPath);
    const logStream = fs.createWriteStream(logPath);
    proc.stdout.pipe(rawStream);
    proc.stderr.pipe(logStream);
    return new Promise((resolve) => {
        proc.on('close', (errorCode) => {
            transformRaw(errorCode).then(resolve);
        });
    });
}
