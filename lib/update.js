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
const tmpPath = path.join(varPath, 'output.html');
const outPath = path.join(srvPath, 'output.html');

const exePath = path.join(etcPath, 'build')
const cssPath = path.join(etcPath, 'style.css')

async function preamble() {
    const style = await fs.promises.readFile(cssPath, 'utf-8');
    return `<meta charset="utf-8"><style>${style}</style>`;
}

async function transformRaw(errorCode) {
    const convert = new Convert({
        fg: 'cyan',
        bg: '#111',
        escapeXML: true,
    });
    const rawText = await fs.promises.readFile(rawPath, 'utf-8');
    const html = await preamble() + (
        errorCode === 0 && rawText.search('<.*>') !== -1
        ? rawText
        : `<pre>${convert.toHtml(rawText)}</pre>`
    );
    await fs.promises.writeFile(tmpPath, html);
    await fs.promises.rename(tmpPath, outPath);
}

export default function update() {
    const proc = spawn(exePath);
    const rawStream = fs.createWriteStream(rawPath);
    proc.stdout.pipe(rawStream);
    proc.stderr.pipe(rawStream);
    return new Promise((resolve) => {
        proc.on('close', (errorCode) => {
            transformRaw(errorCode).then(resolve);
        });
    });
}
