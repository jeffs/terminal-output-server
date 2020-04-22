#!/usr/bin/env -S node --experimental-modules --no-warnings

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

import Convert from 'ansi-to-html';

const libPath = path.dirname(new URL(import.meta.url).pathname);
const varPath = path.join(libPath, '..', 'var');
const srvPath = path.join(libPath, '..', 'srv');

const rawPath = path.join(varPath, 'output.raw');
const tmpPath = path.join(varPath, 'output.html');
const outPath = path.join(srvPath, 'output.html');

const exePath = path.join(libPath, 'build')

const htmlPreamble = `<meta charset="utf-8">
<style>
body {
    background-color: #111;
    color: cyan;
}
table {
    border-collapse: collapse;
    table-layout: fixed;
}
td, th {
    border: 1px solid cyan;
    padding: 1rem;
}
</style>`;

async function transformRaw(errorCode) {
    const convert = new Convert({
        fg: 'cyan',
        bg: '#111',
        escapeXML: true,
    });
    const rawText = await fs.promises.readFile(rawPath, 'utf-8');
    const html = htmlPreamble + (
        errorCode === 0 && rawText.search('<.*>') !== -1
        ? rawText
        : `<pre>${convert.toHtml(rawText)}</pre>`
    );
    await fs.promises.writeFile(tmpPath, html);
    await fs.promises.rename(tmpPath, outPath);
}

function main() {
    const proc = spawn(exePath);
    const rawStream = fs.createWriteStream(rawPath);
    proc.stdout.pipe(rawStream);
    proc.stderr.pipe(rawStream);
    proc.on('close', transformRaw);
}

main();
