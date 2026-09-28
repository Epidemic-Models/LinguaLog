/* =========================================================
   LinguaLog Pro iPen
   Shared handwriting layer for every .editor-surface
   ========================================================= */

(() => {
  "use strict";

  const NS = "LinguaIPen";

  /* =========================================================
     STATE
     ========================================================= */

  const state = {
    surface: null,
    canvas: null,
    ctx: null,

    active: false,
    drawing: false,

    tool: "pen",
    color: "#2d2925",
    size: 4,
    opacity: 1,

    strokes: [],
    redo: [],
    current: null,

    pageId: null,
    resizeObserver: null
  };


  /* =========================================================
     TOOL PRESETS
     ========================================================= */

  const PRESETS = {
    pen: {
      size: 4,
      opacity: 1,
      label: "Pen",
      icon: "✒"
    },

    pencil: {
      size: 3,
      opacity: 0.72,
      label: "Pencil",
      icon: "✎"
    },

    fountain: {
      size: 5,
      opacity: 0.95,
      label: "Fountain",
      icon: "🖋"
    },

    calligraphy: {
      size: 7,
      opacity: 0.92,
      label: "Calligraphy",
      icon: "𝓐"
    },

    marker: {
      size: 15,
      opacity: 0.28,
      label: "Highlighter",
      icon: "▰"
    },

    eraser: {
      size: 18,
      opacity: 1,
      label: "Eraser",
      icon: "◇"
    }
  };


  /* =========================================================
     CSS
     ========================================================= */

  function injectStyles() {

    if (
      document.getElementById(
        "lingualog-ipen-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "lingualog-ipen-styles";


    style.textContent = `

      /* =========================================
         SURFACE
         ========================================= */

      .editor-surface {
        position: relative !important;
      }


      /* =========================================
         DRAWING CANVAS
         ========================================= */

      .ipen-canvas {

        position: absolute;

        inset: 0;

        width: 100%;
        height: 100%;

        z-index: 80;

        pointer-events: none;

        touch-action: none;

        border-radius: inherit;
      }


      .ipen-canvas.ipen-active {

        pointer-events: auto;

        cursor: crosshair;
      }


      /* =========================================
         FLOATING IPEN BUTTON
         ========================================= */

      .ipen-launch {

        position: absolute;

        top: 18px;
        right: 18px;

        z-index: 120;

        width: 50px !important;
        height: 50px !important;

        min-width: 50px !important;

        padding: 0 !important;
        margin: 0 !important;

        border:
          1px solid
          rgba(255,255,255,.75)
          !important;

        border-radius:
          50%
          !important;

        background:
          rgba(255,255,255,.90)
          !important;

        color:
          #292522
          !important;

        box-shadow:
          0 12px 34px
          rgba(45,35,28,.18)
          !important;

        backdrop-filter:
          blur(14px);

        -webkit-backdrop-filter:
          blur(14px);

        font-size:
          21px
          !important;

        display:
          grid
          !important;

        place-items:
          center;

        cursor:
          pointer;

        transition:
          transform .2s ease,
          background .2s ease,
          color .2s ease;
      }


      .ipen-launch:hover {

        transform:
          translateY(-2px)
          scale(1.04);
      }


      .ipen-launch.ipen-on {

        background:
          #292522
          !important;

        color:
          #ffffff
          !important;
      }


      /* =========================================
         TOOLTIP
         ========================================= */

      .ipen-tip {

        position: absolute;

        top: 74px;
        right: 13px;

        z-index: 121;

        padding:
          7px 10px;

        border-radius:
          10px;

        background:
          rgba(41,37,34,.92);

        color:
          white;

        font:
          600 11px/1.2
          Inter,
          Arial,
          sans-serif;

        opacity:
          0;

        pointer-events:
          none;

        transition:
          opacity .2s ease;
      }


      .ipen-launch:hover + .ipen-tip {

        opacity:
          1;
      }


      /* =========================================
         TOOLBAR
         ========================================= */

      .ipen-toolbar {

        position: absolute;

        left: 50%;
        top: 18px;

        transform:
          translateX(-50%);

        z-index: 130;

        display:
          none;

        align-items:
          center;

        gap:
          7px;

        max-width:
          calc(100% - 150px);

        padding:
          9px 11px;

        border:
          1px solid
          rgba(255,255,255,.78);

        border-radius:
          22px;

        background:
          rgba(255,255,255,.94);

        box-shadow:
          0 16px 42px
          rgba(45,35,28,.18);

        backdrop-filter:
          blur(18px);

        -webkit-backdrop-filter:
          blur(18px);

        white-space:
          nowrap;
      }


      .ipen-toolbar.open {

        display:
          flex;
      }


      /* =========================================
         CURRENT TOOL
         ========================================= */

      .ipen-current-tool {

        display:
          flex;

        align-items:
          center;

        gap:
          7px;

        padding:
          0 7px 0 0;

        color:
          #342e2a;

        font-family:
          Inter,
          Arial,
          sans-serif;

        font-size:
          12px;

        font-weight:
          800;
      }


      .ipen-current-tool-icon {

        width:
          34px;

        height:
          34px;

        display:
          grid;

        place-items:
          center;

        border-radius:
          11px;

        background:
          #292522;

        color:
          white;

        font-size:
          17px;

        flex:
          0 0 auto;
      }


      .ipen-current-tool-name {

        min-width:
          48px;
      }


      /* =========================================
         TOOL BUTTONS
         ========================================= */

      .ipen-tools {

        display:
          flex;

        align-items:
          center;

        gap:
          4px;
      }


      .ipen-tool,
      .ipen-action {

        width:
          38px
          !important;

        height:
          38px
          !important;

        min-width:
          38px
          !important;

        padding:
          0
          !important;

        margin:
          0
          !important;

        border:
          0
          !important;

        border-radius:
          12px
          !important;

        background:
          transparent
          !important;

        color:
          #4a4039
          !important;

        display:
          grid
          !important;

        place-items:
          center;

        font-size:
          18px
          !important;

        font-weight:
          700
          !important;

        line-height:
          1
          !important;

        cursor:
          pointer;

        transition:
          background .15s ease,
          color .15s ease,
          transform .15s ease;
      }


      .ipen-tool:hover,
      .ipen-action:hover {

        background:
          rgba(0,0,0,.06)
          !important;

        transform:
          translateY(-1px);
      }


      .ipen-tool.active {

        background:
          #292522
          !important;

        color:
          white
          !important;

        box-shadow:
          0 6px 16px
          rgba(0,0,0,.15);
      }


      .ipen-eraser-tool.active {

        background:
          #292522
          !important;

        color:
          white
          !important;
      }


      /* =========================================
         SEPARATOR
         ========================================= */

      .ipen-sep {

        width:
          1px;

        height:
          28px;

        background:
          rgba(0,0,0,.10);

        margin:
          0 2px;

        flex:
          0 0 auto;
      }


      /* =========================================
         CONTROL GROUP
         ========================================= */

      .ipen-control-wrap {

        display:
          flex;

        align-items:
          center;

        gap:
          6px;

        margin:
          0
          !important;
      }


      .ipen-control-label {

        font-family:
          Inter,
          Arial,
          sans-serif;

        font-size:
          9px;

        font-weight:
          800;

        color:
          #81766e;

        text-transform:
          uppercase;

        letter-spacing:
          .05em;
      }


      /* =========================================
         COLOR
         ========================================= */

      .ipen-color {

        width:
          34px
          !important;

        height:
          34px
          !important;

        min-width:
          34px
          !important;

        padding:
          3px
          !important;

        margin:
          0
          !important;

        border:
          0
          !important;

        border-radius:
          50%
          !important;

        background:
          transparent
          !important;

        overflow:
          hidden;

        cursor:
          pointer;
      }


      /* =========================================
         SIZE
         ========================================= */

      .ipen-size-control {

        gap:
          5px;
      }


      .ipen-slider {

        width:
          82px
          !important;

        min-width:
          70px;

        padding:
          0
          !important;

        margin:
          0 2px
          !important;

        accent-color:
          #292522;
      }


      .ipen-size-label {

        min-width:
          30px;

        font:
          700 11px/1
          Inter,
          Arial,
          sans-serif;

        color:
          #71665d;

        text-align:
          center;
      }


      /* =========================================
         SPECIAL ACTIONS
         ========================================= */

      .ipen-clear-action {

        color:
          #9c4f4f
          !important;
      }


      .ipen-done-action {

        background:
          #292522
          !important;

        color:
          white
          !important;
      }


      .ipen-done-action:hover {

        background:
          #151311
          !important;

        color:
          white
          !important;
      }


      /* =========================================
         MOBILE
         ========================================= */

      @media (max-width: 900px) {

        .ipen-toolbar {

          left:
            14px;

          right:
            76px;

          top:
            12px;

          transform:
            none;

          max-width:
            none;

          overflow-x:
            auto;

          overflow-y:
            hidden;

          justify-content:
            flex-start;

          scrollbar-width:
            none;
        }


        .ipen-toolbar::-webkit-scrollbar {

          display:
            none;
        }


        .ipen-current-tool-name,
        .ipen-control-label {

          display:
            none;
        }


        .ipen-slider {

          width:
            64px
            !important;
        }


        .ipen-tool,
        .ipen-action {

          width:
            36px
            !important;

          height:
            36px
            !important;

          min-width:
            36px
            !important;
        }


        .ipen-launch {

          top:
            12px;

          right:
            12px;
        }


        .ipen-tip {

          display:
            none;
        }
      }


      /* =========================================
         SMALL PHONE
         ========================================= */

      @media (max-width: 520px) {

        .ipen-toolbar {

          border-radius:
            18px;

          padding:
            7px;
        }


        .ipen-current-tool {

          display:
            none;
        }


        .ipen-sep {

          height:
            24px;
        }


        .ipen-color {

          width:
            30px
            !important;

          height:
            30px
            !important;

          min-width:
            30px
            !important;
        }
      }


      /* =========================================
         READ MODE
         ========================================= */

      body[data-view-mode="read"]
      .ipen-launch,

      body[data-view-mode="read"]
      .ipen-toolbar,

      body[data-view-mode="read"]
      .ipen-tip {

        display:
          none
          !important;
      }
    
      /* =========================================
        MAGICAL IPEN EFFECT
        ========================================= */

        .ipen-launch {
        overflow: visible !important;
        isolation: isolate;

        transition:
            transform .25s cubic-bezier(.2,.8,.2,1),
            box-shadow .3s ease,
            background .3s ease,
            color .3s ease !important;
        }

        .ipen-launch::before {
        content: "";
        position: absolute;
        inset: -7px;
        border-radius: 50%;

        background: conic-gradient(
            from 0deg,
            rgba(255, 184, 220, .8),
            rgba(201, 183, 247, .8),
            rgba(173, 216, 255, .8),
            rgba(255, 221, 174, .8),
            rgba(255, 184, 220, .8)
        );

        filter: blur(9px);
        opacity: 0;
        transform: scale(.8);
        transition:
            opacity .3s ease,
            transform .3s ease;

        z-index: -2;
        }

        .ipen-launch::after {
        content: "";
        position: absolute;
        inset: 1px;
        border-radius: inherit;

        background: radial-gradient(
            circle at 30% 20%,
            rgba(255,255,255,.95),
            rgba(255,255,255,.70) 45%,
            rgba(255,255,255,.42)
        );

        opacity: 0;
        z-index: -1;

        transition: opacity .25s ease;
        }

        .ipen-launch:hover {
        transform:
            translateY(-3px)
            scale(1.09)
            rotate(-5deg) !important;

        box-shadow:
            0 0 0 1px rgba(255,255,255,.85),
            0 0 18px rgba(230,184,213,.8),
            0 0 35px rgba(201,183,247,.6),
            0 14px 36px rgba(80,60,90,.20)
            !important;
        }

        .ipen-launch:hover::before {
        opacity: 1;
        transform: scale(1.08);
        animation: ipenMagicSpin 3s linear infinite;
        }

        .ipen-launch:hover::after {
        opacity: .72;
        }

        .ipen-launch.ipen-on {
        background: linear-gradient(
            135deg,
            #292522,
            #51445b
        ) !important;

        color: white !important;

        box-shadow:
            0 0 18px rgba(231,191,216,.85),
            0 0 38px rgba(201,183,247,.6),
            0 12px 34px rgba(45,35,28,.24)
            !important;

        animation:
            ipenActivePulse 2.2s ease-in-out infinite;
        }

        .ipen-launch.ipen-on::before {
        opacity: .85;
        transform: scale(1.06);
        animation:
            ipenMagicSpin 4s linear infinite;
        }

        @keyframes ipenMagicSpin {
        from {
            transform:
            scale(1.08)
            rotate(0deg);
        }

        to {
            transform:
            scale(1.08)
            rotate(360deg);
        }
        }

        @keyframes ipenActivePulse {
        0%,
        100% {
            box-shadow:
            0 0 14px rgba(231,191,216,.55),
            0 0 28px rgba(201,183,247,.35),
            0 12px 34px rgba(45,35,28,.20);
        }

        50% {
            box-shadow:
            0 0 24px rgba(231,191,216,.9),
            0 0 46px rgba(201,183,247,.65),
            0 14px 40px rgba(45,35,28,.24);
        }
        }

        @media (prefers-reduced-motion: reduce) {
        .ipen-launch,
        .ipen-launch::before {
            animation: none !important;
        }
        }
            


    `;


    document.head.appendChild(style);
  }


  /* =========================================================
     PAGE HELPERS
     ========================================================= */

  function page() {

    try {

      if (
        window.currentPageId &&
        typeof window.getPageById === "function"
      ) {

        return window.getPageById(
          window.currentPageId
        );
      }

    } catch (error) {

      console.warn(
        "LinguaLog iPen: could not get page.",
        error
      );
    }

    return null;
  }


  function clone(value) {

    return JSON.parse(
      JSON.stringify(value)
    );
  }


  /* =========================================================
     LOAD
     ========================================================= */

  function loadPageData() {

    const p = page();

    state.pageId =
      window.currentPageId || null;


    state.strokes =
      Array.isArray(p?.ipenStrokes)
        ? clone(p.ipenStrokes)
        : [];


    state.redo = [];
  }


  /* =========================================================
     SAVE
     ========================================================= */

  let saveTimer = 0;


  function savePageData() {

    clearTimeout(saveTimer);


    saveTimer = setTimeout(() => {

      const p = page();


      if (!p) {

        /*
         * Drawing can still work even if the
         * current page object is unavailable.
         */

        return;
      }


      p.ipenStrokes =
        clone(state.strokes);


      try {

        if (
          typeof window.savePage ===
          "function"
        ) {

          window.savePage(p);
        }

      } catch (error) {

        console.warn(
          "LinguaLog iPen savePage error:",
          error
        );
      }


      try {

        if (
          typeof
          window.saveCurrentJournalState ===
          "function"
        ) {

          window.saveCurrentJournalState();
        }

      } catch (error) {

        console.warn(
          "LinguaLog iPen journal save error:",
          error
        );
      }

    }, 120);
  }


  /* =========================================================
     TOOLBAR HTML
     ========================================================= */

  function toolbarHTML() {

    return `

      <div
        class="ipen-toolbar"
        data-ipen-ui
      >

        <!-- CURRENT TOOL -->

        <div class="ipen-current-tool">

          <span
            class="ipen-current-tool-icon"
          >
            ${PRESETS[state.tool].icon}
          </span>

          <span
            class="ipen-current-tool-name"
          >
            ${PRESETS[state.tool].label}
          </span>

        </div>


        <span class="ipen-sep"></span>


        <!-- DRAWING TOOLS -->

        <div class="ipen-tools">


          <button
            class="ipen-tool active"
            data-tool="pen"
            type="button"
            title="Pen"
            aria-label="Pen"
          >
            ✒
          </button>


          <button
            class="ipen-tool"
            data-tool="pencil"
            type="button"
            title="Pencil"
            aria-label="Pencil"
          >
            ✎
          </button>


          <button
            class="ipen-tool"
            data-tool="fountain"
            type="button"
            title="Fountain pen"
            aria-label="Fountain pen"
          >
            🖋
          </button>


          <button
            class="ipen-tool"
            data-tool="calligraphy"
            type="button"
            title="Calligraphy"
            aria-label="Calligraphy"
          >
            𝓐
          </button>


          <button
            class="ipen-tool"
            data-tool="marker"
            type="button"
            title="Highlighter"
            aria-label="Highlighter"
          >
            ▰
          </button>


          <button
            class="
              ipen-tool
              ipen-eraser-tool
            "
            data-tool="eraser"
            type="button"
            title="Eraser"
            aria-label="Eraser"
          >
            ◇
          </button>


        </div>


        <span class="ipen-sep"></span>


        <!-- COLOR -->

        <label
          class="ipen-control-wrap"
          title="Ink color"
        >

          <span
            class="ipen-control-label"
          >
            Color
          </span>


          <input
            class="ipen-color"
            type="color"
            value="${state.color}"
            aria-label="Ink color"
          >

        </label>


        <!-- SIZE -->

        <label
          class="
            ipen-control-wrap
            ipen-size-control
          "
          title="Brush size"
        >

          <span
            class="ipen-control-label"
          >
            Size
          </span>


          <input
            class="ipen-slider"
            type="range"
            min="1"
            max="40"
            step="1"
            value="${state.size}"
            aria-label="Brush size"
          >


          <span
            class="ipen-size-label"
          >
            ${state.size}px
          </span>

        </label>


        <span class="ipen-sep"></span>


        <!-- UNDO -->

        <button
          class="ipen-action"
          data-action="undo"
          type="button"
          title="Undo"
          aria-label="Undo"
        >
          ↶
        </button>


        <!-- REDO -->

        <button
          class="ipen-action"
          data-action="redo"
          type="button"
          title="Redo"
          aria-label="Redo"
        >
          ↷
        </button>


        <!-- CLEAR -->

        <button
          class="
            ipen-action
            ipen-clear-action
          "
          data-action="clear"
          type="button"
          title="Clear all handwriting"
          aria-label="Clear all handwriting"
        >
          ⌧
        </button>


        <!-- DONE -->

        <button
          class="
            ipen-action
            ipen-done-action
          "
          data-action="done"
          type="button"
          title="Done"
          aria-label="Done"
        >
          ✓
        </button>

      </div>


      <!-- FLOATING BUTTON -->

      <button
        class="ipen-launch"
        type="button"
        title="Open Pro iPen"
        aria-label="Open Pro iPen"
        data-ipen-ui
      >
        ✎
      </button>


      <div
        class="ipen-tip"
        data-ipen-ui
      >
        Pro iPen
      </div>

    `;
  }


  /* =========================================================
     ATTACH
     ========================================================= */

  function attach(surface) {

    if (!surface) {
      return;
    }


    /*
     * If already attached to this exact surface,
     * don't duplicate the canvas or toolbar.
     */

    if (
      surface === state.surface &&
      surface.dataset.ipenReady === "1"
    ) {

      return;
    }


    detach();

    injectStyles();


    state.surface =
      surface;


    surface.dataset.ipenReady =
      "1";


    const canvas =
      document.createElement("canvas");


    canvas.className =
      "ipen-canvas";


    canvas.setAttribute(
      "aria-label",
      "Handwriting layer"
    );


    surface.appendChild(canvas);


    surface.insertAdjacentHTML(
      "beforeend",
      toolbarHTML()
    );


    state.canvas =
      canvas;


    state.ctx =
      canvas.getContext("2d");


    loadPageData();

    bindUI();

    bindCanvas();

    resize();


    if (
      typeof ResizeObserver !==
      "undefined"
    ) {

      state.resizeObserver =
        new ResizeObserver(resize);


      state.resizeObserver.observe(
        surface
      );
    }
  }


  /* =========================================================
     DETACH
     ========================================================= */

  function detach() {

    if (state.resizeObserver) {

      state.resizeObserver.disconnect();
    }


    /*
     * Remove old ready marker so the same DOM
     * surface can be reattached later if needed.
     */

    if (state.surface) {

      delete state.surface.dataset.ipenReady;
    }


    state.resizeObserver =
      null;


    state.surface =
      null;


    state.canvas =
      null;


    state.ctx =
      null;


    state.active =
      false;


    state.drawing =
      false;


    state.current =
      null;
  }


  /* =========================================================
     CANVAS SIZE
     ========================================================= */

  function resize() {

    if (
      !state.surface ||
      !state.canvas
    ) {

      return;
    }


    const rect =
      state.surface.getBoundingClientRect();


    const dpr =
      Math.max(
        1,
        Math.min(
          window.devicePixelRatio || 1,
          2
        )
      );


    const width =
      Math.max(
        1,
        Math.round(
          rect.width * dpr
        )
      );


    const height =
      Math.max(
        1,
        Math.round(
          rect.height * dpr
        )
      );


    if (
      state.canvas.width !== width ||
      state.canvas.height !== height
    ) {

      state.canvas.width =
        width;


      state.canvas.height =
        height;


      state.canvas.style.width =
        `${rect.width}px`;


      state.canvas.style.height =
        `${rect.height}px`;


      redraw();
    }
  }


  /* =========================================================
     POINTER POSITION
     ========================================================= */

  function pointFromEvent(event) {

    const rect =
      state.canvas.getBoundingClientRect();


    const width =
      Math.max(
        rect.width,
        1
      );


    const height =
      Math.max(
        rect.height,
        1
      );


    return {

      x:
        (event.clientX - rect.left) /
        width,

      y:
        (event.clientY - rect.top) /
        height,

      p:
        event.pointerType === "pen" &&
        event.pressure > 0
          ? event.pressure
          : 0.5,

      t:
        Date.now()
    };
  }


  /* =========================================================
     STROKE WIDTH
     ========================================================= */

  function widthFor(
    stroke,
    pressure
  ) {

    let width =
      stroke.size;


    if (
      stroke.tool === "pencil"
    ) {

      width *=
        0.65 +
        pressure * 0.55;
    }


    if (
      stroke.tool === "fountain"
    ) {

      width *=
        0.55 +
        pressure * 1.05;
    }


    if (
      stroke.tool === "calligraphy"
    ) {

      width *=
        0.8 +
        pressure * 0.45;
    }


    if (
      stroke.tool === "marker"
    ) {

      width *=
        1.35;
    }


    if (
      stroke.tool === "eraser"
    ) {

      width *=
        1.8;
    }


    return width;
  }


  /* =========================================================
     DRAW STROKE
     ========================================================= */

  function drawStroke(stroke) {

    const ctx =
      state.ctx;


    const canvas =
      state.canvas;


    if (
      !ctx ||
      !canvas ||
      !stroke ||
      !Array.isArray(stroke.points) ||
      !stroke.points.length
    ) {

      return;
    }


    const sx =
      canvas.width;


    const sy =
      canvas.height;


    ctx.save();


    ctx.lineCap =
      stroke.tool === "calligraphy"
        ? "butt"
        : "round";


    ctx.lineJoin =
      "round";


    /*
     * ERASER:
     * destination-out removes existing pixels.
     */

    ctx.globalCompositeOperation =
      stroke.tool === "eraser"
        ? "destination-out"
        : "source-over";


    ctx.strokeStyle =
      stroke.color;


    ctx.globalAlpha =
      stroke.tool === "eraser"
        ? 1
        : stroke.opacity;


    if (
      stroke.tool === "pencil"
    ) {

      ctx.globalAlpha *=
        0.82;
    }


    const points =
      stroke.points;


    /*
     * Single point / tap
     */

    if (
      points.length === 1
    ) {

      const point =
        points[0];


      ctx.beginPath();


      ctx.arc(
        point.x * sx,
        point.y * sy,
        widthFor(
          stroke,
          point.p
        ) / 2,
        0,
        Math.PI * 2
      );


      if (
        stroke.tool === "eraser"
      ) {

        ctx.fillStyle =
          "rgba(0,0,0,1)";

      } else {

        ctx.fillStyle =
          stroke.color;
      }


      ctx.fill();
    }

    else {

      /*
       * Smooth multi-point stroke
       */

      for (
        let i = 1;
        i < points.length;
        i++
      ) {

        const previous =
          points[i - 1];


        const current =
          points[i];


        const pressure =
          (
            previous.p +
            current.p
          ) / 2;


        ctx.beginPath();


        ctx.lineWidth =
          widthFor(
            stroke,
            pressure
          ) *
          (
            sx /
            Math.max(
              1,
              state.surface.clientWidth
            )
          );


        ctx.moveTo(
          previous.x * sx,
          previous.y * sy
        );


        const middleX =
          (
            previous.x +
            current.x
          ) *
          0.5 *
          sx;


        const middleY =
          (
            previous.y +
            current.y
          ) *
          0.5 *
          sy;


        ctx.quadraticCurveTo(
          previous.x * sx,
          previous.y * sy,
          middleX,
          middleY
        );


        ctx.stroke();
      }
    }


    ctx.restore();
  }


  /* =========================================================
     REDRAW
     ========================================================= */

  function redraw() {

    if (
      !state.ctx ||
      !state.canvas
    ) {

      return;
    }


    state.ctx.clearRect(
      0,
      0,
      state.canvas.width,
      state.canvas.height
    );


    state.strokes.forEach(
      drawStroke
    );


    if (state.current) {

      drawStroke(
        state.current
      );
    }
  }


  /* =========================================================
     DRAW START
     ========================================================= */

  function begin(event) {

    if (!state.active) {
      return;
    }


    /*
     * Ignore right-click and middle-click.
     */

    if (
      typeof event.button ===
        "number" &&
      event.button > 0
    ) {

      return;
    }


    event.preventDefault();


    state.drawing =
      true;


    try {

      state.canvas.setPointerCapture?.(
        event.pointerId
      );

    } catch (_) {}


    state.current = {

      tool:
        state.tool,

      color:
        state.color,

      size:
        state.size,

      opacity:
        state.opacity,

      points: [
        pointFromEvent(event)
      ]
    };


    redraw();
  }


  /* =========================================================
     DRAW MOVE
     ========================================================= */

  function move(event) {

    if (
      !state.active ||
      !state.drawing ||
      !state.current
    ) {

      return;
    }


    event.preventDefault();


    const events =
      typeof event.getCoalescedEvents ===
      "function"

        ? event.getCoalescedEvents()

        : [event];


    for (
      const pointerEvent of events
    ) {

      state.current.points.push(
        pointFromEvent(
          pointerEvent
        )
      );
    }


    redraw();
  }


  /* =========================================================
     DRAW END
     ========================================================= */

  function end(event) {

    if (
      !state.drawing ||
      !state.current
    ) {

      return;
    }


    event?.preventDefault?.();


    state.drawing =
      false;


    state.strokes.push(
      state.current
    );


    state.current =
      null;


    /*
     * Creating a new stroke invalidates
     * the redo history.
     */

    state.redo =
      [];


    redraw();

    savePageData();
  }


  /* =========================================================
     CANVAS EVENTS
     ========================================================= */

  function bindCanvas() {

    const canvas =
      state.canvas;


    if (!canvas) {
      return;
    }


    canvas.addEventListener(
      "pointerdown",
      begin,
      {
        passive: false
      }
    );


    canvas.addEventListener(
      "pointermove",
      move,
      {
        passive: false
      }
    );


    canvas.addEventListener(
      "pointerup",
      end,
      {
        passive: false
      }
    );


    canvas.addEventListener(
      "pointercancel",
      end,
      {
        passive: false
      }
    );


    canvas.addEventListener(
      "pointerleave",
      event => {

        /*
         * Do not automatically end when
         * pointer capture is active.
         */

        if (
          state.drawing &&
          !canvas.hasPointerCapture?.(
            event.pointerId
          )
        ) {

          end(event);
        }
      },
      {
        passive: false
      }
    );
  }


  /* =========================================================
     OPEN / CLOSE IPEN
     ========================================================= */

  function setActive(on) {

    state.active =
      Boolean(on);


    state.canvas?.classList.toggle(
      "ipen-active",
      state.active
    );


    state.surface
      ?.querySelector(
        ".ipen-launch"
      )
      ?.classList.toggle(
        "ipen-on",
        state.active
      );


    state.surface
      ?.querySelector(
        ".ipen-toolbar"
      )
      ?.classList.toggle(
        "open",
        state.active
      );
  }


  /* =========================================================
     TOOL SELECTION
     ========================================================= */

  function selectTool(tool) {

    if (!PRESETS[tool]) {
      return;
    }


    state.tool =
      tool;


    state.size =
      PRESETS[tool].size;


    state.opacity =
      PRESETS[tool].opacity;


    /*
     * Active button
     */

    state.surface
      ?.querySelectorAll(
        ".ipen-tool"
      )
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.tool === tool
        );
      });


    /*
     * Current tool name
     */

    const toolName =
      state.surface?.querySelector(
        ".ipen-current-tool-name"
      );


    if (toolName) {

      toolName.textContent =
        PRESETS[tool].label;
    }


    /*
     * Current tool icon
     */

    const toolIcon =
      state.surface?.querySelector(
        ".ipen-current-tool-icon"
      );


    if (toolIcon) {

      toolIcon.textContent =
        PRESETS[tool].icon;
    }


    /*
     * Update size slider
     */

    const slider =
      state.surface?.querySelector(
        ".ipen-slider"
      );


    if (slider) {

      slider.value =
        state.size;
    }


    /*
     * Update size label
     */

    const sizeLabel =
      state.surface?.querySelector(
        ".ipen-size-label"
      );


    if (sizeLabel) {

      sizeLabel.textContent =
        `${state.size}px`;
    }
  }


  /* =========================================================
     UNDO
     ========================================================= */

  function undo() {

    if (
      !state.strokes.length
    ) {

      return;
    }


    const stroke =
      state.strokes.pop();


    state.redo.push(
      stroke
    );


    redraw();

    savePageData();
  }


  /* =========================================================
     REDO
     ========================================================= */

  function redo() {

    if (
      !state.redo.length
    ) {

      return;
    }


    const stroke =
      state.redo.pop();


    state.strokes.push(
      stroke
    );


    redraw();

    savePageData();
  }


  /* =========================================================
     CLEAR
     ========================================================= */

  function clearAll() {

    if (
      !state.strokes.length
    ) {

      return;
    }


    const confirmed =
      window.confirm(
        "Clear all handwriting on this page?"
      );


    if (!confirmed) {
      return;
    }


    /*
     * Save the removed strokes in redo
     * so the user can recover them.
     */

    state.redo =
      state.strokes.splice(0);


    redraw();

    savePageData();
  }


  /* =========================================================
     UI EVENTS
     ========================================================= */

  function bindUI() {

    const surface =
      state.surface;


    if (!surface) {
      return;
    }


    /*
     * Launch button
     */

    const launchButton =
      surface.querySelector(
        ".ipen-launch"
      );


    launchButton?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        event.stopPropagation();

        setActive(
          !state.active
        );
      }
    );


    /*
     * Drawing tools
     */

    surface
      .querySelectorAll(
        ".ipen-tool"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          event => {

            event.preventDefault();

            event.stopPropagation();

            selectTool(
              button.dataset.tool
            );
          }
        );
      });


    /*
     * Color
     */

    const colorInput =
      surface.querySelector(
        ".ipen-color"
      );


    colorInput?.addEventListener(
      "input",
      event => {

        state.color =
          event.target.value;
      }
    );


    /*
     * Size
     */

    const slider =
      surface.querySelector(
        ".ipen-slider"
      );


    slider?.addEventListener(
      "input",
      event => {

        state.size =
          Number(
            event.target.value
          );


        const label =
          surface.querySelector(
            ".ipen-size-label"
          );


        if (label) {

          label.textContent =
            `${state.size}px`;
        }
      }
    );


    /*
     * Undo
     */

    surface
      .querySelector(
        '[data-action="undo"]'
      )
      ?.addEventListener(
        "click",
        event => {

          event.preventDefault();

          event.stopPropagation();

          undo();
        }
      );


    /*
     * Redo
     */

    surface
      .querySelector(
        '[data-action="redo"]'
      )
      ?.addEventListener(
        "click",
        event => {

          event.preventDefault();

          event.stopPropagation();

          redo();
        }
      );


    /*
     * Clear
     */

    surface
      .querySelector(
        '[data-action="clear"]'
      )
      ?.addEventListener(
        "click",
        event => {

          event.preventDefault();

          event.stopPropagation();

          clearAll();
        }
      );


    /*
     * Done
     */

    surface
      .querySelector(
        '[data-action="done"]'
      )
      ?.addEventListener(
        "click",
        event => {

          event.preventDefault();

          event.stopPropagation();

          setActive(false);
        }
      );
  }


  /* =========================================================
     FIND EDITOR SURFACE
     ========================================================= */

  function findSurface() {

    /*
     * Primary LinguaLog editor target.
     */

    let surface =
      document.querySelector(
        "#editorContainer .editor-surface"
      );


    /*
     * Fallback:
     * allows iPen to work if an editor surface
     * is rendered elsewhere.
     */

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


    const currentPageId =
      window.currentPageId ||
      null;


    /*
     * New DOM surface
     */

    if (
      surface !== state.surface
    ) {

      attach(surface);

      return;
    }


    /*
     * Same surface but page changed.
     *
     * This is important if LinguaLog swaps
     * page data without replacing the
     * editor-surface DOM element.
     */

    if (
      state.pageId !==
      currentPageId
    ) {

      state.active =
        false;


      state.drawing =
        false;


      state.current =
        null;


      loadPageData();

      redraw();


      state.canvas?.classList.remove(
        "ipen-active"
      );


      state.surface
        ?.querySelector(
          ".ipen-launch"
        )
        ?.classList.remove(
          "ipen-on"
        );


      state.surface
        ?.querySelector(
          ".ipen-toolbar"
        )
        ?.classList.remove(
          "open"
        );
    }
  }


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
     WINDOW RESIZE
     ========================================================= */

  window.addEventListener(
    "resize",
    () => {

      requestAnimationFrame(
        resize
      );
    }
  );


  /* =========================================================
     KEYBOARD SHORTCUTS
     ========================================================= */

  document.addEventListener(
    "keydown",
    event => {

      if (
        !state.active
      ) {

        return;
      }


      /*
       * ESC = close iPen
       */

      if (
        event.key === "Escape"
      ) {

        setActive(false);

        return;
      }


      /*
       * Cmd/Ctrl + Z
       */

      const command =
        event.metaKey ||
        event.ctrlKey;


      if (
        command &&
        !event.shiftKey &&
        event.key.toLowerCase() === "z"
      ) {

        event.preventDefault();

        undo();

        return;
      }


      /*
       * Cmd/Ctrl + Shift + Z
       */

      if (
        command &&
        event.shiftKey &&
        event.key.toLowerCase() === "z"
      ) {

        event.preventDefault();

        redo();

        return;
      }


      /*
       * E = Eraser
       */

      if (
        !command &&
        event.key.toLowerCase() === "e"
      ) {

        const tag =
          document.activeElement
            ?.tagName
            ?.toLowerCase();


        if (
          tag !== "input" &&
          tag !== "textarea" &&
          tag !== "select"
        ) {

          selectTool("eraser");
        }
      }


      /*
       * P = Pen
       */

      if (
        !command &&
        event.key.toLowerCase() === "p"
      ) {

        const tag =
          document.activeElement
            ?.tagName
            ?.toLowerCase();


        if (
          tag !== "input" &&
          tag !== "textarea" &&
          tag !== "select"
        ) {

          selectTool("pen");
        }
      }
    }
  );


  /* =========================================================
     BOOT
     ========================================================= */

  function boot() {

    injectStyles();


    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
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

    scan,

    setActive,

    selectTool,

    undo,

    redo,

    clear:
      clearAll,

    redraw,

    get active() {

      return state.active;
    },

    get tool() {

      return state.tool;
    },

    get strokes() {

      return clone(
        state.strokes
      );
    }
  };

})();