// Copyright (c) 2019 Shellyl_N and Authors
// license: ISC
// https://github.com/shellyln


import { nativeFileSaveDialog,
         listDirectory,
         listDesktopDirectory,
         listHomeDirectory,
         fileExists,
         getDirName,
         getBaseName } from '../libs/backend-api.js';
import { alertWrap,
         confirmWrap } from '../libs/backend-wrap.js';



export default class FileSaveDialog extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};
        this.state.title = '';
        this.state.currentFilePath = '';
        this.state.fileTypes = [];
        this.state.selectedFileType = '*';

        this.state.currentDir = '';
        this.state.currentDirFiles = [];
        this.state.inputFileName = '';

        this.dialogRef = React.createRef();
        this.fileNameInputRef = React.createRef();
        this.fileTypeSelectorRef = React.createRef();
    }

    showModal(options, handler) {
        this.setState({title: options.title});
        this.setState({currentFilePath: options.currentFilePath});
        this.setState({fileTypes: options.fileTypes});

        const ext = options.currentFilePath ?
            (options.currentFilePath.lastIndexOf('.') >= 0 ?
                options.currentFilePath.toLowerCase()
                .slice(options.currentFilePath.lastIndexOf('.')) : '') : '';
        let selectedType = options.fileTypes.filter(x => x.exts.filter(z => z === ext)[0])[0];
        let allFilesType = options.fileTypes.filter(x => x.value === '*')[0];
        this.setState({selectedFileType:
            options.forExport ? options.fileTypes[0].value :
                (selectedType ? selectedType.value :
                    (ext !== '' ? allFilesType.value : options.fileTypes[0].value))});

        this.setState({currentDir: ''});
        this.setState({currentDirFiles: []});
        this.setState({inputFileName: ''});
        this.options = options;
        this.handler = handler;

        if (nativeFileSaveDialog) {
            (async () => {
                const fileName = await nativeFileSaveDialog(
                    options.title,
                    options.currentFilePath,
                    options.fileTypes.map(x => ({
                        name: x.text,
                        extensions: x.exts && x.exts.length > 0 ? x.exts.map(t => t.slice(1)) : ['*'],
                        mime: x.mime,
                    })), options.intent);
                if (fileName) {
                    this.handler(await getDirName(fileName), await getBaseName(fileName));
                }
            })();
        } else {
            this.dialogRef.current.showModal();
            document.activeElement.blur();

            listDirectory(options.currentFilePath)
            .then(info => {
                this.setState({currentDir: info.directory});
                this.setState({currentDirFiles: info.files});
            })
            // eslint-disable-next-line no-unused-vars
            .catch(e => {
                listDesktopDirectory()
                .then(info => {
                    this.setState({currentDir: info.directory});
                    this.setState({currentDirFiles: info.files});
                })
                // eslint-disable-next-line no-unused-vars
                .catch(e2 => {
                    listHomeDirectory()
                    .then(info => {
                        this.setState({currentDir: info.directory});
                        this.setState({currentDirFiles: info.files});
                    })
                    .catch(e3 => {
                        // TODO: await it.
                        alertWrap(e3);
                    });
                });
            });

            getBaseName(options.currentFilePath)
            .then(name => {
                this.fileNameInputRef.current.focus();
                this.setState({inputFileName: name});
            })
            // eslint-disable-next-line no-unused-vars
            .catch(e => {
                // NOTE: ignore error
                // alertWrap(e); // TODO: await it.
            });
        }
    }

    handleFileListItemClick(ev, name, isDir) {
        if (isDir) {
            this.fileNameInputRef.current.focus();

            listDirectory(this.state.currentDir, name)
            .then(info => {
                this.setState({currentDir: info.directory});
                this.setState({currentDirFiles: info.files});
            })
            .catch(e => {
                // TODO: await it.
                alertWrap(e);
            });
        } else {
            this.fileNameInputRef.current.focus();
            this.setState({inputFileName: name});
        }
    }

    // eslint-disable-next-line no-unused-vars
    async handleOkClick(ev) {
        try {
            if (this.state.inputFileName.trim() === '') {
                return;
            }

            let fileName = this.state.inputFileName;
            const ext = fileName.lastIndexOf('.') >= 0 ?
                fileName.toLowerCase().slice(fileName.lastIndexOf('.')) : '';
            let selectedType = this.options.fileTypes.filter(x => x.value === this.state.selectedFileType)[0];
            if (ext === '' && selectedType) {
                fileName += selectedType.exts[0] || '';
            } else if (! selectedType.exts.filter(x => x === ext)[0]) {
                fileName += selectedType.exts[0] || '';
            }

            if (await fileExists(this.state.currentDir, fileName)) {
                if (! await confirmWrap('Are you sure want to overwrite the existing file?')) {
                    return;
                }
            }

            this.handler(this.state.currentDir, fileName);

            document.activeElement.blur();
            this.dialogRef.current.close();
        } catch (e) {
            await alertWrap(e);
        }
    }

    getFilteredCurrentDirFiles() {
        return this.state.currentDirFiles.filter(x => {
            if (x.isDirectory) {
                return true;
            }
            let fileName = x.name;
            const ext = fileName.lastIndexOf('.') >= 0 ?
                fileName.toLowerCase().slice(fileName.lastIndexOf('.')) : '';
            let selectedType = this.options.fileTypes.filter(x => x.value === this.state.selectedFileType)[0];
            if (!selectedType || !selectedType.exts || selectedType.exts.length === 0) {
                return true;
            }
            return (selectedType.exts.filter(z => z === ext)[0]);
        });
    }

    // eslint-disable-next-line no-unused-vars
    handleCancelClick(ev) {
        document.activeElement.blur();
        this.dialogRef.current.close();
    }

    render() {
        return (lsx`
        (dialog (@ (ref ${this.dialogRef})
                   (style (backgroundColor "#333")
                          (color "white") ))
            (h5 ${this.state.title})
            (div ${this.state.currentDir})
            (div (@ (style (width "80vw")
                           (height "70vh")
                           (display "table-cell")
                           (textAlign "center") ))
                (div (@ (style (color "black")
                               (text-align "left")
                               (height "calc(100% - 100px)")
                               (overflow-x "auto")
                               (overflow-y "scroll") ))
                    (ul (@ (className "collection")
                           (style (margin "0")) )
                        ($=for ${this.getFilteredCurrentDirFiles()}
                            (li (@ (key $index)
                                   (className "collection-item"))
                                (a (@ (onClick (|-> (ev) use ($data)
                                          (${(ev, name, isDir) => this.handleFileListItemClick(ev, name, isDir)}
                                              ev ::$data:name ::$data:isDirectory )))
                                      (style (cursor "pointer")
                                             (color "inherit")
                                             (text-decoration "none") ))
                                    (i (@ (className "material-icons tiny")
                                          (style (margin "0 10px 10px 10px")) )
                                        ($if ::$data:isDirectory "folder" "insert_drive_file") )
                                    ::$data:name )) )))
                (div (@ (className "row"))
                    (div (@ (className "input-field col s10"))
                        (label "File name")
                        (input (@ (ref ${this.fileNameInputRef})
                                  (style (color "white"))
                                  (type "text")
                                  (spellcheck "false")
                                  (onChange ${() => this.setState({inputFileName: this.fileNameInputRef.current.value})})
                                  (value ${this.state.inputFileName}) )))
                    (div (@ (className "input-field col s2"))
                        (select (@ (ref ${this.fileTypeSelectorRef})
                                   (className "browser-default")
                                   (onChange ${() => this.setState({selectedFileType: this.fileTypeSelectorRef.current.value})}) )
                            ($=for ${this.state.fileTypes}
                                (option (@ (key   ::$data:value)
                                           (value ::$data:value)
                                           (($if (== ${this.state.selectedFileType} ::$data:value)
                                               "selected" "data-x-no-selected" )))
                                    ::$data:text ))))))
            (div (@ (style (display "flex")
                           (justifyContent "center") ))
                (button (@ (style (textTransform "none")
                                  (margin "0 3px 0 3px")
                                  (width "9em") )
                           (className "btn grey darken-3")
                           (onClick ${(ev) => this.handleCancelClick(ev)}) )
                    (i (@ (className "material-icons large")) "cancel")
                    (span (@ (style (margin "0 10px 10px 10px")
                                    (display "inline-block")
                                    (vertical-align "middle") )) "Cancel") )
                (button (@ (style (textTransform "none")
                                  (margin "0 3px 0 3px")
                                  (width "9em") )
                           (className "btn blue darken-2")
                           (onClick ${(ev) => this.handleOkClick(ev)}) )
                    (i (@ (className "material-icons large")) "check")
                    (span (@ (style (margin "0 10px 10px 10px")
                                    (display "inline-block")
                                    (vertical-align "middle") )) "OK") ) ))`
        );
    }
}
