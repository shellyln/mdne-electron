// Copyright (c) 2020 Shellyl_N and Authors
// license: ISC
// https://github.com/shellyln



export const openFilter = [{
    value: 'md',
    text: 'Markdown (*.md, *.markdown)',
    exts: ['.md', '.markdown'],
    mime: 'text/markdown',
},{
    value: 'html',
    text: 'HTML (*.html, *.htm)',
    exts: ['.html', '.htm'],
    mime: 'text/html',
},{
    value: '*',
    text: 'All Files (*.*)',
    exts: [],
    mime: '*/*',
}];


export const saveAsFilter = [{
    value: 'md',
    text: 'Markdown (*.md, *.markdown)',
    exts: ['.md', '.markdown'],
    mime: 'text/markdown',
},{
    value: 'html',
    text: 'HTML (*.html, *.htm)',
    exts: ['.html', '.htm'],
    mime: 'text/html',
},{
    value: '*',
    text: 'All Files (*.*)',
    exts: [],
    mime: '*/*',
}];


export const exportFilter = [].concat(
    (window._MDNE_BACKEND_CAPS_NO_PDF_RENDERER ? [] : [{
        value: 'pdf',
        text: 'PDF (*.pdf)',
        exts: ['.pdf'],
        mime: 'application/pdf',
    }]),
    [{
        value: 'html',
        text: 'HTML (*.html, *.htm)',
        exts: ['.html', '.htm'],
        mime: 'text/html',
    },{
        value: '*',
        text: 'All Files (*.*)',
        exts: [],
        mime: '*/*',
    }]
);
