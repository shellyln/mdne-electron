// Copyright (c) 2019 Shellyl_N and Authors
// license: ISC
// https://github.com/shellyln



export default class SettingsDialog extends React.Component {
    constructor(props) {
        super(props);

        this.state = {};
        this.state.showFields = false;
        this.state.fontFamily = void 0;
        this.state.fontSize = 14;
        this.state.useSoftTabs = true,
        this.state.tabSize = 4;
        this.state.wrap = false;
        this.state.showInvisibles = false;
        this.state.darkThemePreview = false;
        this.state.theme = 'monokai';

        this.dialogRef = React.createRef();
    }

    showModal(options, handler) {
        this.dialogRef.current.showModal();
        document.activeElement.blur();
        this.options = options;
        this.handler = handler;
        this.setState({
            showFields: false,
            fontFamily: options.editor.fontFamily,
            fontSize: options.editor.fontSize > 0 ? options.editor.fontSize : 14,
            useSoftTabs: !!options.editor.useSoftTabs,
            tabSize: options.editor.tabSize,
            wrap: options.editor.wrap === 'off' ? false : (options.editor.wrap === 'free'),
            showInvisibles: !!options.editor.showInvisibles,
            theme: (options.editor.theme || '').replace('ace/theme/', ''),
            darkThemePreview: !!options.renderer.darkThemePreview,
        });
        setTimeout(() => this.setState({showFields: true}), 30);
    }

    componentDidUpdate() {
        M.updateTextFields();
        const elems = document.querySelectorAll('select');
        /* const instances = */ M.FormSelect.init(elems, {});
    }

    handleFontFamilyChange(ev) {
        this.setState({
            fontFamily: (ev.target.value || '').trim() === '' ? null : ev.target.value,
        });
    }

    handleFontSizeChange(ev) {
        this.setState({
            fontSize: ev.target.value,
        });
    }

    handleTabSizeChange(ev) {
        this.setState({
            tabSize: Math.floor(Number(ev.target.value)),
        });
    }

    handleSoftTabsChange(ev) {
        this.setState({
            useSoftTabs: ev.target.checked,
        });
    }

    handleWrapChange(ev) {
        this.setState({
            wrap: ev.target.checked,
        });
    }

    handleShowInvisiblesChange(ev) {
        this.setState({
            showInvisibles: ev.target.checked,
        });
    }

    handleDarkThemePreviewChange(ev) {
        this.setState({
            darkThemePreview: ev.target.checked,
        });
    }

    handleThemeChange(ev) {
        this.setState({
            theme: ev.target.value,
        });
    }

    // eslint-disable-next-line no-unused-vars
    handleOkClick(ev) {
        document.activeElement.blur();
        this.dialogRef.current.close();

        const fontSize = Number(this.state.fontSize);
        this.handler({
            editor: {
                fontFamily: this.state.fontFamily,
                fontSize: fontSize > 0 ? fontSize : 14,
                useSoftTabs: this.state.useSoftTabs,
                tabSize: this.state.tabSize > 0 ? this.state.tabSize : 4,
                wrap: this.state.wrap,
                showInvisibles: this.state.showInvisibles,
                theme: `ace/theme/${this.state.theme}`,
            },
            renderer: {
                darkThemePreview: this.state.darkThemePreview,
            },
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
                   (className "appSettingsDialog-root")
                   (style (backgroundColor "#333")
                          (color "white") ))
            (style (@ (dangerouslySetInnerHTML """$concat
                .appSettingsDialog-root .select-wrapper input {
                    color: white;
                }
                .appSettingsDialog-root .select-wrapper svg.caret {
                    fill: white;
                }
                """) ))
            (h5 "Settings")
            (div (@ (style (width "80vw")
                           (height "70vh")
                           (display "table-cell")
                           (textAlign "center")
                           (paddingTop "20px") ))
                ($if ${this.state.showFields} (form
                    (div (@ (className "row")
                            (style (margin "0")) )
                        (div (@ (className "input-field col s12"))
                            (input (@ (id "appSettingsDialog-fontFamily")
                                      (type "text")
                                      (className "validate")
                                      (style (color "white"))
                                      (value ${this.state.fontFamily})
                                      (onChange ${(ev) => this.handleFontFamilyChange(ev)}) ))
                            (label (@ (for "appSettingsDialog-fontFamily"))
                                "Font family (e.g. Consolas, 'Migu 1M', monospace)") ))
                    (div (@ (className "row")
                            (style (margin "0")) )
                        (div (@ (className "input-field col s2"))
                            (input (@ (id "appSettingsDialog-fontSize")
                                      (type "number")
                                      (className "validate")
                                      (style (color "white"))
                                      (value ${this.state.fontSize})
                                      (onChange ${(ev) => this.handleFontSizeChange(ev)}) ))
                            (label (@ (for "appSettingsDialog-fontSize"))
                                "Font size (in points)") ))
                    (div (@ (className "row")
                            (style (margin "0")) )
                        (div (@ (className "input-field col s2"))
                            (input (@ (id "appSettingsDialog-tabSize")
                                      (type "number")
                                      (className "validate")
                                      (style (color "white"))
                                      (value ${this.state.tabSize})
                                      (onChange ${(ev) => this.handleTabSizeChange(ev)}) ))
                            (label (@ (for "appSettingsDialog-tabSize"))
                                "Tab size") )
                        (div (@ (className "input-field col s4"))
                            (label
                                (input (@ (type "checkbox")
                                          (className "filled-in")
                                          (checked ${this.state.useSoftTabs ? 'checked' : ''})
                                          (onChange ${(ev) => this.handleSoftTabsChange(ev)}) ))
                                (span "Soft tabs") )))
                    (div (@ (className "row")
                            (style (margin "0")) )
                        (div (@ (className "input-field col s4"))
                            (label
                                (input (@ (type "checkbox")
                                          (className "filled-in")
                                          (checked ${this.state.wrap ? 'checked' : ''})
                                          (onChange ${(ev) => this.handleWrapChange(ev)}) ))
                                (span "Wrap") ))
                        (div (@ (className "input-field col s4"))
                            (label
                                (input (@ (type "checkbox")
                                          (className "filled-in")
                                          (checked ${this.state.showInvisibles ? 'checked' : ''})
                                          (onChange ${(ev) => this.handleShowInvisiblesChange(ev)}) ))
                                (span "Show Invisibles") ))
                        (div (@ (className "input-field col s4"))
                            (label
                                (input (@ (type "checkbox")
                                          (className "filled-in")
                                          (checked ${this.state.darkThemePreview ? 'checked' : ''})
                                          (onChange ${(ev) => this.handleDarkThemePreviewChange(ev)}) ))
                                (span "Preview in dark theme") )))
                    (div (@ (className "row")
                            (style (margin "40px 0 0 0")
                                   (color "white") ))
                        (div (@ (className "input-field col s12"))
                            (select (@ (id "appSettingsDialog-theme")
                                       (onChange ${(ev) => this.handleThemeChange(ev)}) )
                                (option (@ (value "monokai")
                                           (selected ${this.state.theme === 'monokai' ? 'selected' : ''})) "Monokai")
                                (option (@ (value "cobalt")
                                           (selected ${this.state.theme === 'cobalt' ? 'selected' : ''})) "Cobalt")
                                (option (@ (value "terminal")
                                           (selected ${this.state.theme === 'terminal' ? 'selected' : ''})) "Terminal")
                                (option (@ (value "tomorrow_night_bright")
                                           (selected ${this.state.theme === 'tomorrow_night_bright' ? 'selected' : ''})) "Tomorrow Night Bright")
                                (option (@ (value "chrome")
                                           (selected ${this.state.theme === 'chrome' ? 'selected' : ''})) "Chrome")
                                (option (@ (value "kuroir")
                                           (selected ${this.state.theme === 'kuroir' ? 'selected' : ''})) "Kuroir")
                                (option (@ (value "textmate")
                                           (selected ${this.state.theme === 'textmate' ? 'selected' : ''})) "Textmate") )
                            (label (@ (for "appSettingsDialog-theme"))
                                "Theme") )) )))
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
