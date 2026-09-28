/* =========================================================
   LinguaLog Shared Editor Tools
   Reusable rich-text formatting UI for journal pages
   ========================================================= */

(() => {
    "use strict";

    const NS = "LinguaEditorTools";

    /* =========================================================
       STATE
       ========================================================= */

    const state = {
        surface: null,
        launcher: null,
        popover: null,

        open: false,

        activeEditor: null,
        savedRange: null,

        font: "Inter",
        size: 16,
        color: "#2d2925",
        highlight: "#fff1a8",

        resizeObserver: null
    };


    /* =========================================================
       SETTINGS
       ========================================================= */

    const FONTS = [
        "Inter",
        "Arial",
        "Georgia",
        "Times New Roman",
        "Verdana",
        "Trebuchet MS",
        "Courier New"
    ];


    const SIZES = [
        12,
        14,
        16,
        18,
        20,
        24,
        28,
        32,
        36,
        42,
        48
    ];


    /* =========================================================
       CSS
       ========================================================= */

    function injectStyles() {

        if (
            document.getElementById(
                "lingualog-editor-tools-styles"
            )
        ) {
            return;
        }


        const style =
            document.createElement("style");


        style.id =
            "lingualog-editor-tools-styles";


        style.textContent = `

        /* =========================================
           EDITOR SURFACE
           ========================================= */

        .editor-surface {
            position: relative !important;
        }


        /* =========================================
           LAUNCHER
           ========================================= */

        .editor-tools-launch {

            position: absolute;

            top: 18px;
            right: 80px;

            z-index: 145;

            width: 50px !important;
            height: 50px !important;

            min-width: 50px !important;

            padding: 0 !important;
            margin: 0 !important;

            border:
                1px solid
                rgba(255,255,255,.80)
                !important;

            border-radius:
                50%
                !important;

            background:
                rgba(255,255,255,.92)
                !important;

            color:
                #292522
                !important;

            box-shadow:
                0 12px 34px
                rgba(45,35,28,.16)
                !important;

            backdrop-filter:
                blur(14px);

            -webkit-backdrop-filter:
                blur(14px);

            display:
                grid
                !important;

            place-items:
                center;

            cursor:
                pointer;

            transition:
                transform .2s ease,
                box-shadow .2s ease,
                background .2s ease;

        }


        .editor-tools-launch:hover {

            transform:
                translateY(-2px)
                scale(1.05);

            box-shadow:
                0 16px 38px
                rgba(45,35,28,.20)
                !important;
        }


        .editor-tools-launch.open {

            background:
                #292522
                !important;

            color:
                white
                !important;
        }


        /* =========================================
           CUSTOM ICON
           ========================================= */

        .editor-tools-icon {

            width: 23px;
            height: 23px;

            display:
                flex;

            flex-direction:
                column;

            justify-content:
                center;

            gap:
                4px;
        }


        .editor-tools-icon-line {

            width:
                100%;

            height:
                2px;

            position:
                relative;

            border-radius:
                20px;

            background:
                currentColor;
        }


        .editor-tools-icon-line::after {

            content:
                "";

            position:
                absolute;

            top:
                50%;

            width:
                6px;

            height:
                6px;

            border-radius:
                50%;

            background:
                currentColor;

            transform:
                translateY(-50%);
        }


        .editor-tools-icon-line:nth-child(1)::after {

            left:
                4px;
        }


        .editor-tools-icon-line:nth-child(2)::after {

            right:
                3px;
        }


        .editor-tools-icon-line:nth-child(3)::after {

            left:
                9px;
        }


        /* =========================================
           POPOVER
           ========================================= */

        .editor-tools-popover {

            position:
                absolute;

            top:
                78px;

            right:
                18px;

            z-index:
                150;

            width:
                min(390px, calc(100% - 36px));

            max-height:
                min(650px, calc(100vh - 120px));

            overflow-y:
                auto;

            display:
                none;

            padding:
                18px;

            border:
                1px solid
                rgba(255,255,255,.76);

            border-radius:
                24px;

            background:
                rgba(255,255,255,.94);

            box-shadow:
                0 22px 60px
                rgba(45,35,28,.20);

            backdrop-filter:
                blur(22px);

            -webkit-backdrop-filter:
                blur(22px);

            font-family:
                Inter,
                Arial,
                sans-serif;

            color:
                #332d29;
        }


        .editor-tools-popover.open {

            display:
                block;
        }


        /* =========================================
           HEADER
           ========================================= */

        .editor-tools-header {

            display:
                flex;

            align-items:
                center;

            justify-content:
                space-between;

            gap:
                12px;

            margin-bottom:
                16px;
        }


        .editor-tools-title {

            font-size:
                15px;

            font-weight:
                850;

            letter-spacing:
                -.01em;
        }


        .editor-tools-close {

            width:
                32px !important;

            height:
                32px !important;

            min-width:
                32px !important;

            padding:
                0 !important;

            margin:
                0 !important;

            border:
                0 !important;

            border-radius:
                10px !important;

            background:
                rgba(0,0,0,.055)
                !important;

            color:
                #4b433e
                !important;

            display:
                grid
                !important;

            place-items:
                center;

            cursor:
                pointer;

            font-size:
                17px !important;
        }


        /* =========================================
           SECTION
           ========================================= */

        .editor-tools-section {

            padding:
                15px 0;

            border-top:
                1px solid
                rgba(0,0,0,.07);
        }


        .editor-tools-section:first-of-type {

            border-top:
                0;

            padding-top:
                0;
        }


        .editor-tools-section-title {

            margin-bottom:
                10px;

            font-size:
                11px;

            font-weight:
                850;

            text-transform:
                uppercase;

            letter-spacing:
                .06em;

            color:
                #8a7e75;
        }


        /* =========================================
           ROW
           ========================================= */

        .editor-tools-row {

            display:
                flex;

            align-items:
                center;

            gap:
                8px;

            flex-wrap:
                wrap;
        }


        .editor-tools-row +
        .editor-tools-row {

            margin-top:
                9px;
        }


        /* =========================================
           BUTTONS
           ========================================= */

        .editor-tool-button {

            min-width:
                40px !important;

            height:
                40px !important;

            padding:
                0 12px !important;

            margin:
                0 !important;

            border:
                1px solid
                rgba(0,0,0,.07)
                !important;

            border-radius:
                12px !important;

            background:
                rgba(248,247,245,.95)
                !important;

            color:
                #3b3531
                !important;

            font-family:
                Inter,
                Arial,
                sans-serif;

            font-size:
                14px !important;

            font-weight:
                750 !important;

            display:
                inline-flex
                !important;

            align-items:
                center;

            justify-content:
                center;

            cursor:
                pointer;

            transition:
                transform .15s ease,
                background .15s ease,
                border-color .15s ease;
        }


        .editor-tool-button:hover {

            transform:
                translateY(-1px);

            background:
                white
                !important;

            border-color:
                rgba(0,0,0,.14)
                !important;
        }


        .editor-tool-button.active {

            background:
                #292522
                !important;

            color:
                white
                !important;

            border-color:
                #292522
                !important;
        }


        /* =========================================
           SELECTS
           ========================================= */

        .editor-tools-select {

            height:
                42px !important;

            padding:
                0 36px 0 12px
                !important;

            margin:
                0 !important;

            border:
                1px solid
                rgba(0,0,0,.10)
                !important;

            border-radius:
                12px
                !important;

            background:
                white
                !important;

            color:
                #342e2a
                !important;

            font-family:
                Inter,
                Arial,
                sans-serif;

            font-size:
                13px
                !important;

            outline:
                none;
        }


        .editor-tools-font {

            flex:
                1 1 180px;
        }


        .editor-tools-size {

            width:
                92px;
        }


        /* =========================================
           COLORS
           ========================================= */

        .editor-tools-color-wrap {

            display:
                flex;

            align-items:
                center;

            gap:
                8px;

            flex:
                1;
        }


        .editor-tools-color-label {

            font-size:
                12px;

            font-weight:
                700;

            color:
                #675d56;
        }


        .editor-tools-color {

            width:
                42px !important;

            height:
                40px !important;

            min-width:
                42px !important;

            padding:
                3px !important;

            margin:
                0 !important;

            border:
                1px solid
                rgba(0,0,0,.08)
                !important;

            border-radius:
                12px
                !important;

            background:
                white
                !important;

            cursor:
                pointer;
        }


        /* =========================================
           TEXT BOX STYLES
           ========================================= */

        .editor-box-style {

            font-size:
                12px !important;

            font-weight:
                700 !important;
        }


        /* =========================================
           MOBILE
           ========================================= */

        @media (max-width: 900px) {

            .editor-tools-launch {

                top:
                    12px;

                right:
                    74px;
            }


            .editor-tools-popover {

                top:
                    72px;

                right:
                    12px;

                width:
                    min(390px, calc(100% - 24px));

                max-height:
                    calc(100vh - 100px);
            }
        }


        @media (max-width: 520px) {

            .editor-tools-popover {

                left:
                    10px;

                right:
                    10px;

                width:
                    auto;

                border-radius:
                    20px;

                padding:
                    15px;
            }


            .editor-tools-font {

                flex:
                    1 1 140px;
            }
        }


        /* =========================================
           READ MODE
           ========================================= */

        body[data-view-mode="read"]
        .editor-tools-launch,

        body[data-view-mode="read"]
        .editor-tools-popover {

            display:
                none
                !important;
        }

        `;


        document.head.appendChild(
            style
        );
    }


    /* =========================================================
       HTML
       ========================================================= */

    function editorToolsHTML() {

        const fontOptions =
            FONTS.map(font => {

                return `
                    <option
                        value="${font}"
                        ${font === state.font ? "selected" : ""}
                    >
                        ${font}
                    </option>
                `;

            }).join("");


        const sizeOptions =
            SIZES.map(size => {

                return `
                    <option
                        value="${size}"
                        ${size === state.size ? "selected" : ""}
                    >
                        ${size}
                    </option>
                `;

            }).join("");


        return `

            <!-- =================================
                 SHARED EDITOR TOOLS BUTTON
                 ================================= -->

            <button
                class="editor-tools-launch"
                type="button"
                title="Editor tools"
                aria-label="Open editor tools"
                data-editor-tools-ui
            >

                <span
                    class="editor-tools-icon"
                    aria-hidden="true"
                >
                    <span
                        class="editor-tools-icon-line"
                    ></span>

                    <span
                        class="editor-tools-icon-line"
                    ></span>

                    <span
                        class="editor-tools-icon-line"
                    ></span>
                </span>

            </button>


            <!-- =================================
                 POPOVER
                 ================================= -->

            <div
                class="editor-tools-popover"
                data-editor-tools-ui
            >

                <div
                    class="editor-tools-header"
                >

                    <div
                        class="editor-tools-title"
                    >
                        Editor tools
                    </div>


                    <button
                        class="editor-tools-close"
                        type="button"
                        aria-label="Close editor tools"
                        title="Close"
                    >
                        ×
                    </button>

                </div>


                <!-- =============================
                     TEXT STYLE
                     ============================= -->

                <section
                    class="editor-tools-section"
                >

                    <div
                        class="editor-tools-section-title"
                    >
                        Text
                    </div>


                    <div
                        class="editor-tools-row"
                    >

                        <select
                            class="
                                editor-tools-select
                                editor-tools-font
                            "
                            aria-label="Font"
                        >
                            ${fontOptions}
                        </select>


                        <select
                            class="
                                editor-tools-select
                                editor-tools-size
                            "
                            aria-label="Font size"
                        >
                            ${sizeOptions}
                        </select>

                    </div>


                    <div
                        class="editor-tools-row"
                    >

                        <button
                            class="editor-tool-button"
                            type="button"
                            data-command="bold"
                            title="Bold"
                            aria-label="Bold"
                        >
                            <strong>B</strong>
                        </button>


                        <button
                            class="editor-tool-button"
                            type="button"
                            data-command="italic"
                            title="Italic"
                            aria-label="Italic"
                        >
                            <em>I</em>
                        </button>


                        <button
                            class="editor-tool-button"
                            type="button"
                            data-command="underline"
                            title="Underline"
                            aria-label="Underline"
                        >
                            <u>U</u>
                        </button>


                        <button
                            class="editor-tool-button"
                            type="button"
                            data-command="strikeThrough"
                            title="Strikethrough"
                            aria-label="Strikethrough"
                        >
                            <s>S</s>
                        </button>

                    </div>


                    <div
                        class="editor-tools-row"
                    >

                        <label
                            class="editor-tools-color-wrap"
                        >

                            <span
                                class="editor-tools-color-label"
                            >
                                Text
                            </span>

                            <input
                                class="
                                    editor-tools-color
                                    editor-tools-text-color
                                "
                                type="color"
                                value="${state.color}"
                                aria-label="Text color"
                            >

                        </label>


                        <label
                            class="editor-tools-color-wrap"
                        >

                            <span
                                class="editor-tools-color-label"
                            >
                                Highlight
                            </span>

                            <input
                                class="
                                    editor-tools-color
                                    editor-tools-highlight-color
                                "
                                type="color"
                                value="${state.highlight}"
                                aria-label="Highlight color"
                            >

                        </label>

                    </div>

                </section>


                <!-- =============================
                     PARAGRAPH
                     ============================= -->

                <section
                    class="editor-tools-section"
                >

                    <div
                        class="editor-tools-section-title"
                    >
                        Paragraph
                    </div>


                    <div
                        class="editor-tools-row"
                    >

                        <button
                            class="editor-tool-button"
                            type="button"
                            data-command="justifyLeft"
                            title="Align left"
                            aria-label="Align left"
                        >
                            ≡
                        </button>


                        <button
                            class="editor-tool-button"
                            type="button"
                            data-command="justifyCenter"
                            title="Align center"
                            aria-label="Align center"
                        >
                            ≡
                        </button>


                        <button
                            class="editor-tool-button"
                            type="button"
                            data-command="justifyRight"
                            title="Align right"
                            aria-label="Align right"
                        >
                            ≡
                        </button>


                        <button
                            class="editor-tool-button"
                            type="button"
                            data-command="insertUnorderedList"
                            title="Bulleted list"
                            aria-label="Bulleted list"
                        >
                            •≡
                        </button>


                        <button
                            class="editor-tool-button"
                            type="button"
                            data-command="insertOrderedList"
                            title="Numbered list"
                            aria-label="Numbered list"
                        >
                            1≡
                        </button>

                    </div>

                </section>


                <!-- =============================
                     INSERT
                     ============================= -->

                <section
                    class="editor-tools-section"
                >

                    <div
                        class="editor-tools-section-title"
                    >
                        Insert
                    </div>


                    <div
                        class="editor-tools-row"
                    >

                        <button
                            class="editor-tool-button"
                            type="button"
                            data-insert="link"
                        >
                            Link
                        </button>


                        <button
                            class="editor-tool-button"
                            type="button"
                            data-insert="table"
                        >
                            Table
                        </button>

                    </div>

                </section>


                <!-- =============================
                     TEXT BOXES
                     ============================= -->

                <section
                    class="editor-tools-section"
                >

                    <div
                        class="editor-tools-section-title"
                    >
                        Text boxes
                    </div>


                    <div
                        class="editor-tools-row"
                    >

                        <button
                            class="
                                editor-tool-button
                                editor-box-style
                            "
                            type="button"
                            data-box-style="cloud"
                        >
                            Cloud
                        </button>


                        <button
                            class="
                                editor-tool-button
                                editor-box-style
                            "
                            type="button"
                            data-box-style="speech"
                        >
                            Speech
                        </button>


                        <button
                            class="
                                editor-tool-button
                                editor-box-style
                            "
                            type="button"
                            data-box-style="ribbon"
                        >
                            Ribbon
                        </button>


                        <button
                            class="
                                editor-tool-button
                                editor-box-style
                            "
                            type="button"
                            data-box-style="label"
                        >
                            Label
                        </button>


                        <button
                            class="
                                editor-tool-button
                                editor-box-style
                            "
                            type="button"
                            data-box-style="scallop"
                        >
                            Scallop
                        </button>


                        <button
                            class="
                                editor-tool-button
                                editor-box-style
                            "
                            type="button"
                            data-box-style="oval"
                        >
                            Oval
                        </button>

                    </div>

                </section>

            </div>
        `;
    }


    /* =========================================================
       SELECTION HELPERS
       ========================================================= */

    function isTextEditor(element) {

        if (!element) {
            return false;
        }


        /*
        * Rich-text editor:
        * Blank page and any journal fields that
        * use contenteditable.
        */

        if (
            element.matches?.(
                '[contenteditable="true"]'
            ) ||
            element.closest?.(
                '[contenteditable="true"]'
            )
        ) {
            return true;
        }


        /*
        * Standard textarea:
        * General / Language journal fields may
        * still use these.
        */

        if (
            element.matches?.(
                "textarea"
            ) ||
            element.closest?.(
                "textarea"
            )
        ) {
            return true;
        }


        /*
        * Text-like inputs.
        */

        const input =
            element.matches?.("input")
                ? element
                : element.closest?.("input");


        if (input) {

            const type =
                (
                    input.getAttribute("type") ||
                    "text"
                ).toLowerCase();


            return [
                "text",
                "search",
                "url",
                "email"
            ].includes(type);
        }


        return false;
    }

    function findTextEditor(element) {

        if (!element) {
            return null;
        }


        /*
        * contenteditable
        */

        const richEditor =
            element.matches?.(
                '[contenteditable="true"]'
            )
                ? element
                : element.closest?.(
                    '[contenteditable="true"]'
                );


        if (richEditor) {
            return richEditor;
        }


        /*
        * textarea
        */

        const textarea =
            element.matches?.("textarea")
                ? element
                : element.closest?.("textarea");


        if (textarea) {
            return textarea;
        }


        /*
        * text-like input
        */

        const input =
            element.matches?.("input")
                ? element
                : element.closest?.("input");


        if (input) {

            const type =
                (
                    input.getAttribute("type") ||
                    "text"
                ).toLowerCase();


            if (
                [
                    "text",
                    "search",
                    "url",
                    "email"
                ].includes(type)
            ) {
                return input;
            }
        }


        return null;
    }


    function rememberSelection() {

        /*
        * First check the element that currently
        * has keyboard focus.
        *
        * This is important for textarea/input,
        * because window.getSelection() does not
        * give us their text selection.
        */

        const focused =
            document.activeElement;


        const focusedEditor =
            findTextEditor(focused);


        if (
            focusedEditor &&
            (
                !state.surface ||
                state.surface.contains(focusedEditor)
            )
        ) {

            state.activeEditor =
                focusedEditor;


            /*
            * textarea / input selection
            */

            if (
                focusedEditor.matches(
                    "textarea, input"
                )
            ) {

                state.savedRange = {
                    type: "text-control",

                    start:
                        focusedEditor.selectionStart ?? 0,

                    end:
                        focusedEditor.selectionEnd ?? 0
                };


                return;
            }
        }


        /*
        * contenteditable selection
        */

        const selection =
            window.getSelection();


        if (
            !selection ||
            selection.rangeCount === 0
        ) {
            return;
        }


        const range =
            selection.getRangeAt(0);


        const container =
            range.commonAncestorContainer;


        const element =
            container.nodeType === Node.ELEMENT_NODE
                ? container
                : container.parentElement;


        const editor =
            findTextEditor(element);


        if (
            !editor ||
            !editor.matches(
                '[contenteditable="true"]'
            )
        ) {
            return;
        }


        /*
        * Make sure the editor belongs to
        * the current journal surface.
        */

        if (
            state.surface &&
            !state.surface.contains(editor)
        ) {
            return;
        }


        state.activeEditor =
            editor;


        state.savedRange = {
            type: "contenteditable",
            range: range.cloneRange()
        };
    }


    function restoreSelection() {

        if (
            !state.activeEditor ||
            !state.savedRange
        ) {
            return false;
        }


        /*
        * textarea / input
        */

        if (
            state.savedRange.type ===
            "text-control"
        ) {

            try {

                state.activeEditor.focus();


                state.activeEditor.setSelectionRange(
                    state.savedRange.start,
                    state.savedRange.end
                );


                return true;

            } catch (_) {

                return false;
            }
        }


        /*
        * contenteditable
        */

        if (
            state.savedRange.type ===
            "contenteditable"
        ) {

            const selection =
                window.getSelection();


            if (!selection) {
                return false;
            }


            try {

                state.activeEditor.focus();


                selection.removeAllRanges();


                selection.addRange(
                    state.savedRange.range
                );


                return true;

            } catch (_) {

                return false;
            }
        }


        return false;
    }


    /* =========================================================
       COMMAND
       ========================================================= */

    function executeCommand(
        command,
        value = null
    ) {

        const editor =
            state.activeEditor;


        if (!editor) {

            console.warn(
                "LinguaLog Editor Tools: no active editor."
            );

            return false;
        }


        /*
        * =====================================================
        * CONTENTEDITABLE — RICH TEXT
        * =====================================================
        */

        if (
            editor.matches(
                '[contenteditable="true"]'
            )
        ) {

            if (!restoreSelection()) {

                console.warn(
                    "LinguaLog Editor Tools: could not restore selection."
                );

                return false;
            }


            try {

                editor.focus();


                const success =
                    document.execCommand(
                        command,
                        false,
                        value
                    );


                rememberSelection();

                notifyChange();


                return success;

            } catch (error) {

                console.warn(
                    "LinguaLog editor command failed:",
                    command,
                    error
                );


                return false;
            }
        }


        /*
        * =====================================================
        * TEXTAREA / INPUT
        * =====================================================
        *
        * These are valid text editors, but they are
        * plain-text controls.
        *
        * Commands such as bold, italic, underline,
        * lists, alignment, links and tables cannot
        * be applied to only part of their text.
        *
        * Font, size, color and background are handled
        * separately by their own functions.
        * =====================================================
        */

        if (
            editor.matches(
                "textarea, input"
            )
        ) {

            console.info(
                "LinguaLog Editor Tools:",
                `"${command}" requires a rich-text field.`
            );


            return false;
        }


        return false;
    }

    /* =========================================================
   FONT
   ========================================================= */

    function applyFont(font) {

        state.font =
            font;


        const editor =
            state.activeEditor;


        if (!editor) {

            console.warn(
                "LinguaLog Editor Tools: no active editor."
            );

            return;
        }


        /*
        * Rich-text editor:
        * apply font only to the selected text.
        */

        if (
            editor.matches(
                '[contenteditable="true"]'
            )
        ) {

            executeCommand(
                "fontName",
                font
            );


            return;
        }


        /*
        * Standard textarea/input cannot have
        * different fonts inside one field.
        *
        * For now, apply the font to the entire
        * field so the control still works.
        */

        if (
            editor.matches(
                "textarea, input"
            )
        ) {

            editor.style.fontFamily =
                font;


            notifyChange();


            return;
        }
    }

    /* =========================================================
       FONT SIZE
       ========================================================= */

    function applyFontSize(size) {

        state.size =
            Number(size);


        const editor =
            state.activeEditor;


        if (!editor) {

            console.warn(
                "LinguaLog Editor Tools: no active editor."
            );

            return;
        }


        /*
        * =====================================================
        * TEXTAREA / INPUT
        * =====================================================
        *
        * These fields cannot style only part of their text,
        * so font size applies to the whole field.
        */

        if (
            editor.matches(
                "textarea, input"
            )
        ) {

            editor.style.fontSize =
                `${state.size}px`;


            notifyChange();


            return;
        }


        /*
        * =====================================================
        * CONTENTEDITABLE
        * =====================================================
        *
        * Rich-text fields can apply the size only
        * to the selected text.
        */

        if (
            !editor.matches(
                '[contenteditable="true"]'
            )
        ) {
            return;
        }


        restoreSelection();


        try {

            /*
            * execCommand fontSize accepts only 1–7.
            * Use 7 temporarily, then convert the
            * generated font element to our pixel size.
            */

            document.execCommand(
                "fontSize",
                false,
                "7"
            );


            editor
                .querySelectorAll(
                    'font[size="7"]'
                )
                .forEach(font => {

                    font.removeAttribute(
                        "size"
                    );


                    font.style.fontSize =
                        `${state.size}px`;
                });


            rememberSelection();

            notifyChange();

        } catch (error) {

            console.warn(
                "LinguaLog font size failed:",
                error
            );
        }
    }


    /* =========================================================
       TEXT COLOR
       ========================================================= */

    function applyTextColor(color) {

        state.color =
            color;


        const editor =
            state.activeEditor;


        if (!editor) {

            console.warn(
                "LinguaLog Editor Tools: no active editor."
            );

            return;
        }


        /*
        * Normal input / textarea:
        * color applies to the entire field.
        */

        if (
            editor.matches(
                "textarea, input"
            )
        ) {

            editor.style.color =
                color;


            notifyChange();


            return;
        }


        /*
        * Rich-text contenteditable:
        * color applies to selected text.
        */

        if (
            editor.matches(
                '[contenteditable="true"]'
            )
        ) {

            executeCommand(
                "foreColor",
                color
            );
        }
    }

    /* =========================================================
       HIGHLIGHT
       ========================================================= */

    function applyHighlight(color) {

        state.highlight =
            color;


        const editor =
            state.activeEditor;


        if (!editor) {

            console.warn(
                "LinguaLog Editor Tools: no active editor."
            );

            return;
        }


        /*
        * Normal input / textarea:
        * partial highlighting is impossible,
        * so use the field background.
        */

        if (
            editor.matches(
                "textarea, input"
            )
        ) {

            editor.style.backgroundColor =
                color;


            notifyChange();


            return;
        }


        /*
        * Rich-text contenteditable:
        * highlight only selected text.
        */

        if (
            editor.matches(
                '[contenteditable="true"]'
            )
        ) {

            executeCommand(
                "hiliteColor",
                color
            );
        }
    }


    /* =========================================================
       LINK
       ========================================================= */

    function insertLink() {

        const editor =
            state.activeEditor;


        /*
        * Links require a rich-text field.
        */

        if (
            !editor ||
            !editor.matches(
                '[contenteditable="true"]'
            )
        ) {

            console.info(
                "LinguaLog Editor Tools:",
                "Links require a rich-text field."
            );

            return;
        }


        if (!restoreSelection()) {

            console.warn(
                "LinguaLog Editor Tools: could not restore selection."
            );

            return;
        }


        const url =
            window.prompt(
                "Enter link URL:"
            );


        if (!url) {
            return;
        }


        executeCommand(
            "createLink",
            url
        );
    }


    /* =========================================================
       TABLE
       ========================================================= */

    function insertTable(
        rows = 2,
        columns = 2
    ) {

        const editor =
            state.activeEditor;


        /*
        * Tables require a rich-text field.
        */

        if (
            !editor ||
            !editor.matches(
                '[contenteditable="true"]'
            )
        ) {

            console.info(
                "LinguaLog Editor Tools:",
                "Tables require a rich-text field."
            );

            return;
        }


        if (!restoreSelection()) {

            console.warn(
                "LinguaLog Editor Tools: could not restore selection."
            );

            return;
        }


        let html =
            `
            <table
                style="
                    width:100%;
                    border-collapse:collapse;
                    margin:12px 0;
                "
            >
            `;


        for (
            let row = 0;
            row < rows;
            row++
        ) {

            html += "<tr>";


            for (
                let column = 0;
                column < columns;
                column++
            ) {

                html += `
                    <td
                        style="
                            border:1px solid rgba(0,0,0,.18);
                            padding:8px;
                            min-width:60px;
                        "
                    >
                        &nbsp;
                    </td>
                `;
            }


            html += "</tr>";
        }


        html += "</table>";


        executeCommand(
            "insertHTML",
            html
        );
    }

    /* =========================================================
       TEXT BOX STYLE
       ========================================================= */

    function applyBoxStyle(style) {

        /*
         * We deliberately expose this through
         * an event rather than hard-coding the
         * Blank Page implementation here.
         *
         * Existing page/template code can listen
         * for this event and apply its own
         * Cloud / Speech / Ribbon / etc. logic.
         */

        window.dispatchEvent(
            new CustomEvent(
                "lingualog:editor-box-style",
                {
                    detail: {
                        style,
                        editor:
                            state.activeEditor
                    }
                }
            )
        );
    }


    /* =========================================================
       CHANGE EVENT
       ========================================================= */

    function notifyChange() {

        window.dispatchEvent(
            new CustomEvent(
                "lingualog:editor-change",
                {
                    detail: {
                        editor:
                            state.activeEditor
                    }
                }
            )
        );
    }


    /* =========================================================
       OPEN / CLOSE
       ========================================================= */

    function setOpen(open) {

        state.open =
            Boolean(open);


        state.popover
            ?.classList.toggle(
                "open",
                state.open
            );


        state.launcher
            ?.classList.toggle(
                "open",
                state.open
            );


        state.launcher
            ?.setAttribute(
                "aria-expanded",
                String(state.open)
            );
    }


    function toggle() {

        setOpen(
            !state.open
        );
    }


    /* =========================================================
       BIND UI
       ========================================================= */

    function bindUI() {

        const surface =
            state.surface;


        if (!surface) {
            return;
        }

            /* =====================================
       ACTIVE EDITOR TRACKING
       ===================================== */

        surface.addEventListener(
            "focusin",
            event => {

                const editor =
                    findTextEditor(
                        event.target
                    );


                if (!editor) {
                    return;
                }


                state.activeEditor =
                    editor;


                /*
                * Save textarea/input cursor or
                * selection immediately.
                */

                if (
                    editor.matches(
                        "textarea, input"
                    )
                ) {

                    state.savedRange = {
                        type: "text-control",

                        start:
                            editor.selectionStart ?? 0,

                        end:
                            editor.selectionEnd ?? 0
                    };
                }
            }
        );


        surface.addEventListener(
            "pointerup",
            event => {

                const editor =
                    findTextEditor(
                        event.target
                    );


                if (!editor) {
                    return;
                }


                state.activeEditor =
                    editor;


                /*
                * Let the browser finish updating
                * the selection before saving it.
                */

                requestAnimationFrame(() => {

                    rememberSelection();

                });
            }
        );


        state.launcher =
            surface.querySelector(
                ".editor-tools-launch"
            );


        state.popover =
            surface.querySelector(
                ".editor-tools-popover"
            );


        /* =====================================
           LAUNCHER
           ===================================== */

        state.launcher
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    rememberSelection();

                    toggle();
                }
            );


        /* =====================================
           CLOSE
           ===================================== */

        state.popover
            ?.querySelector(
                ".editor-tools-close"
            )
            ?.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    setOpen(false);
                }
            );


        /* =====================================
           KEEP POPOVER CLICKS INTERNAL
           ===================================== */

        state.popover
            ?.addEventListener(
                "pointerdown",
                event => {

                    /*
                     * Prevent the popover interaction
                     * from destroying the saved
                     * text selection.
                     */

                    if (
                        event.target.matches(
                            "button"
                        ) ||
                        event.target.closest(
                            "button"
                        )
                    ) {

                        event.preventDefault();
                    }


                    event.stopPropagation();
                }
            );


        state.popover
            ?.addEventListener(
                "click",
                event => {

                    event.stopPropagation();
                }
            );


        /* =====================================
           COMMAND BUTTONS
           ===================================== */

        state.popover
            ?.querySelectorAll(
                "[data-command]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();


                        executeCommand(
                            button.dataset.command
                        );
                    }
                );
            });


        /* =====================================
           FONT
           ===================================== */

        state.popover
            ?.querySelector(
                ".editor-tools-font"
            )
            ?.addEventListener(
                "change",
                event => {

                    applyFont(
                        event.target.value
                    );
                }
            );


        /* =====================================
           SIZE
           ===================================== */

        state.popover
            ?.querySelector(
                ".editor-tools-size"
            )
            ?.addEventListener(
                "change",
                event => {

                    applyFontSize(
                        event.target.value
                    );
                }
            );


        /* =====================================
           TEXT COLOR
           ===================================== */

        state.popover
            ?.querySelector(
                ".editor-tools-text-color"
            )
            ?.addEventListener(
                "input",
                event => {

                    applyTextColor(
                        event.target.value
                    );
                }
            );


        /* =====================================
           HIGHLIGHT
           ===================================== */

        state.popover
            ?.querySelector(
                ".editor-tools-highlight-color"
            )
            ?.addEventListener(
                "input",
                event => {

                    applyHighlight(
                        event.target.value
                    );
                }
            );


        /* =====================================
           INSERT
           ===================================== */

        state.popover
            ?.querySelectorAll(
                "[data-insert]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();


                        switch (
                            button.dataset.insert
                        ) {

                            case "link":

                                insertLink();

                                break;


                            case "table":

                                insertTable(
                                    2,
                                    2
                                );

                                break;
                        }
                    }
                );
            });


        /* =====================================
           BOX STYLE
           ===================================== */

        state.popover
            ?.querySelectorAll(
                "[data-box-style]"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.preventDefault();


                        applyBoxStyle(
                            button.dataset.boxStyle
                        );
                    }
                );
            });
    }


    /* =========================================================
       ATTACH
       ========================================================= */

    function attach(surface) {

        if (!surface) {
            return;
        }


        if (
            state.surface === surface &&
            surface.dataset.editorToolsReady === "1"
        ) {

            return;
        }


        detach();

        injectStyles();


        state.surface =
            surface;


        surface.dataset.editorToolsReady =
            "1";


        surface.insertAdjacentHTML(
            "beforeend",
            editorToolsHTML()
        );


        bindUI();


        if (
            typeof ResizeObserver !==
            "undefined"
        ) {

            state.resizeObserver =
                new ResizeObserver(() => {

                    /*
                     * Reserved for future responsive
                     * positioning calculations.
                     */

                });


            state.resizeObserver.observe(
                surface
            );
        }
    }


    /* =========================================================
       DETACH
       ========================================================= */

    function detach() {

        if (
            state.resizeObserver
        ) {

            state.resizeObserver.disconnect();
        }


        if (
            state.surface
        ) {

            delete state.surface
                .dataset
                .editorToolsReady;


            state.surface
                .querySelector(
                    ".editor-tools-launch"
                )
                ?.remove();


            state.surface
                .querySelector(
                    ".editor-tools-popover"
                )
                ?.remove();
        }


        state.surface =
            null;


        state.launcher =
            null;


        state.popover =
            null;


        state.activeEditor =
            null;


        state.savedRange =
            null;


        state.open =
            false;


        state.resizeObserver =
            null;
    }


    /* =========================================================
       FIND SURFACE
       ========================================================= */

    function findSurface() {

        let surface =
            document.querySelector(
                "#editorContainer .editor-surface"
            );


        if (!surface) {

            surface =
                document.querySelector(
                    ".editor-surface"
                );
        }


        return surface;
    }


    /* =========================================================
       SCAN
       ========================================================= */

    function scan() {

        const surface =
            findSurface();


        if (!surface) {
            return;
        }


        if (
            surface !== state.surface
        ) {

            attach(surface);
        }
    }


    /* =========================================================
       GLOBAL SELECTION TRACKING
       ========================================================= */

    document.addEventListener(
        "selectionchange",
        () => {

            /*
             * Don't overwrite the stored range
             * while interacting with our menu.
             */

            const active =
                document.activeElement;


            if (
                active &&
                state.popover?.contains(active)
            ) {

                return;
            }


            rememberSelection();
        }
    );


    /* =========================================================
       CLICK OUTSIDE
       ========================================================= */

    document.addEventListener(
        "pointerdown",
        event => {

            if (!state.open) {
                return;
            }


            if (
                state.popover?.contains(
                    event.target
                )
            ) {

                return;
            }


            if (
                state.launcher?.contains(
                    event.target
                )
            ) {

                return;
            }


            /*
             * Close ONLY the popover.
             * The launcher stays visible.
             */

            setOpen(false);
        }
    );


    /* =========================================================
       ESC
       ========================================================= */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                state.open
            ) {

                setOpen(false);
            }
        }
    );


    /* =========================================================
       DOM OBSERVER
       ========================================================= */

    const observer =
        new MutationObserver(() => {

            requestAnimationFrame(
                scan
            );
        });


    /* =========================================================
       BOOT
       ========================================================= */

    function boot() {

        injectStyles();


        observer.observe(
            document.body,
            {
                childList:
                    true,

                subtree:
                    true
            }
        );


        scan();
    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            boot
        );

    } else {

        boot();
    }


    /* =========================================================
       PUBLIC API
       ========================================================= */

    window[NS] = {

        attach,

        detach,

        scan,

        open() {

            setOpen(true);
        },

        close() {

            setOpen(false);
        },

        toggle,

        applyFont,

        applyFontSize,

        applyTextColor,

        applyHighlight,

        insertTable,

        insertLink,

        applyBoxStyle,

        get open() {

            return state.open;
        },

        get activeEditor() {

            return state.activeEditor;
        }
    };

})();