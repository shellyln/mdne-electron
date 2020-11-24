# mdne-electron - Markdown Neo Edit for Electron

<img src="https://raw.githubusercontent.com/shellyln/mdne-electron/master/contents/logo.svg?sanitize=true" title="logo" style="width: 200px">

### A simple markdown and code editor powered by [Markdown-it](https://github.com/markdown-it/markdown-it), [Ace](https://ace.c9.io/) and [Electron](https://electronjs.org/).

[![npm](https://img.shields.io/npm/v/mdne-electron.svg)](https://www.npmjs.com/package/mdne-electron)
[![GitHub release](https://img.shields.io/github/release/shellyln/mdne-electron.svg)](https://github.com/shellyln/mdne-electron/releases)
[![Travis](https://img.shields.io/travis/shellyln/mdne-electron/master.svg)](https://travis-ci.org/shellyln/mdne-electron)
[![GitHub forks](https://img.shields.io/github/forks/shellyln/mdne-electron.svg?style=social&label=Fork)](https://github.com/shellyln/mdne-electron/fork)
[![GitHub stars](https://img.shields.io/github/stars/shellyln/mdne-electron.svg?style=social&label=Star)](https://github.com/shellyln/mdne-electron)



## For details and features, please refer to [Original version of mdne (for Carlo)](https://github.com/shellyln/mdne).


## Features
* Live preview of Markdown, HTML, [LSX](https://github.com/shellyln/liyad#what-is-lsx) formats.
* Export Markdown, HTML, LSX into PDF or HTML.
* Code highlighting.
  * C#
  * CSS
  * GraphQL
  * HTML
  * JavaScript
  * JSON
  * Less
  * Lisp
  * Markdown
  * Protobuf
  * Python
  * Sass
  * Scss
  * shell script
  * SQL
  * SVG
  * TSX
  * TypeScript
  * XML
  * YAML
* Markdown extended syntax
  * Many markdown-it plugins are enabled. See [here](https://github.com/shellyln/menneu#features).
* Scripting and value expansion
  * See [here](https://github.com/shellyln/menneu#lisp-block-expansion).
* Full screen mode (F11)


----
## Requirements

* [Optional] Google Chrome (latest)
  * for previewing as or exporting as PDF


----

## Build scripts

### Project setup
```sh
npm ci

# npm install    # it causes a dependency update
```

### Compiles for production
```sh
npm run build
```

### Compiles for production (only electron main process)
```sh
npm run build:mainproc
```

### Clean project
```sh
npm run clean
```

### Start electron app for debug
```sh
npm run start
```

### Build electron distribution executable files (unpacked)
```sh
npm run pack
```

### Build electron distribution executable files (packing to the installer)
```sh
npm run dist          # build for current machine

# npm run dist:win    # build for windows (x64)
# npm run dist:linux  # build for linux (x64)
# npm run dist:mac    # build for macos (x64)
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```



---

## **Electron Documentation (security)**
See [this](https://electronjs.org/docs/tutorial/security) guide.


----
## License
[ISC](https://github.com/shellyln/mdne-electron/blob/master/LICENSE.md)  
Copyright (c) 2019 Shellyl_N and Authors.

## Bundled softwares' license

* [Ace](https://github.com/ajaxorg/ace): [license](https://github.com/ajaxorg/ace/blob/master/LICENSE) (BSD-3-Clause)
* [Materialize](https://materializecss.com/): [license](https://github.com/Dogfalo/materialize/blob/v1-dev/LICENSE) (MIT)
* [Normalize.css](https://necolas.github.io/normalize.css/): [license](https://github.com/necolas/normalize.css/blob/master/LICENSE.md) (MIT)
* [React](https://reactjs.org/): [license](https://github.com/facebook/react/blob/master/LICENSE) (MIT)
* [pako](https://github.com/nodeca/pako): [license](https://github.com/nodeca/pako/blob/master/LICENSE) (MIT + ZLIB)
* [dialog-polyfill](https://github.com/GoogleChrome/dialog-polyfill): [license](https://github.com/GoogleChrome/dialog-polyfill/blob/master/LICENSE) (BSD-3-Clause)
