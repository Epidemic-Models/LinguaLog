/* LinguaLog Pro iPen — shared handwriting layer for every .editor-surface */
(() => {
  "use strict";

  const NS = "LinguaIPen";
  const state = {
    surface: null, canvas: null, ctx: null, active: false, drawing: false,
    tool: "pen", color: "#2d2925", size: 4, opacity: 1,
    strokes: [], redo: [], current: null, pageId: null, resizeObserver: null
  };

  const PRESETS = {
    pen:         { size: 4,  opacity: 1,    label: "Pen" },
    pencil:      { size: 3,  opacity: 0.72, label: "Pencil" },
    fountain:    { size: 5,  opacity: 0.95, label: "Fountain" },
    calligraphy: { size: 7,  opacity: 0.92, label: "Calligraphy" },
    marker:      { size: 15, opacity: 0.28, label: "Highlighter" },
    eraser:      { size: 18, opacity: 1,    label: "Eraser" }
  };

  function injectStyles() {
    if (document.getElementById("lingualog-ipen-styles")) return;

    const style = document.createElement("style");
    style.id = "lingualog-ipen-styles";

    style.textContent = `
      .editor-surface {
        position: relative !important;
      }

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

      .ipen-launch {
        position: absolute;
        top: 18px;
        right: 18px;
        bottom: auto;
        z-index: 1002;

        pointer-events: auto !important;
        touch-action: manipulation;

        width: 48px !important;
        height: 48px !important;
        padding: 0 !important;

        border: 1px solid rgba(255,255,255,.7) !important;
        border-radius: 50% !important;

        background: rgba(255,255,255,.88) !important;
        color: #292522 !important;

        box-shadow: 0 12px 34px rgba(45,35,28,.18) !important;
        backdrop-filter: blur(14px);

        font-size: 22px !important;

        display: grid !important;
        place-items: center;

        transition: .2s ease;
      }

      .ipen-launch:hover {
        transform: translateY(-2px) scale(1.04);
      }

      .ipen-launch.ipen-on {
        background: #292522 !important;
        color: #fff !important;
      }

      .ipen-toolbar {
        position: absolute;
        left: 50%;
        top: 16px;
        transform: translateX(-50%);

        z-index: 130;

        display: none;
        align-items: center;
        gap: 7px;

        max-width: calc(100% - 28px);

        padding: 9px;

        border: 1px solid rgba(255,255,255,.75);
        border-radius: 22px;

        background: rgba(255,255,255,.91);

        box-shadow: 0 16px 42px rgba(45,35,28,.18);
        backdrop-filter: blur(18px);

        white-space: nowrap;
      }

      .ipen-toolbar.open {
        display: flex;
      }

      .ipen-tools {
        display: flex;
        gap: 5px;
      }

      .ipen-tool,
      .ipen-action {
        width: 38px !important;
        height: 38px !important;
        min-width: 38px !important;

        padding: 0 !important;
        margin: 0 !important;

        border: 0 !important;
        border-radius: 12px !important;

        background: transparent !important;
        color: #4a4039 !important;

        display: grid !important;
        place-items: center;

        font-size: 18px !important;
        font-weight: 700 !important;
      }

      .ipen-tool:hover,
      .ipen-action:hover {
        background: rgba(0,0,0,.06) !important;
      }

      .ipen-tool.active {
        background: #292522 !important;
        color: white !important;
        box-shadow: 0 6px 16px rgba(0,0,0,.15);
      }

      .ipen-sep {
        width: 1px;
        height: 28px;
        background: rgba(0,0,0,.1);
        margin: 0 2px;
      }

      .ipen-color {
        width: 34px !important;
        height: 34px !important;

        padding: 3px !important;

        border: 0 !important;
        border-radius: 50% !important;

        background: transparent !important;

        overflow: hidden;
        cursor: pointer;
      }

      .ipen-slider {
        width: 88px !important;
        padding: 0 !important;
        margin: 0 3px !important;
        accent-color: #292522;
      }

      .ipen-size-label {
        min-width: 32px;

        font: 700 11px/1 Arial, sans-serif;
        color: #71665d;

        text-align: center;
      }

      .ipen-tip {
        position: absolute;
        top: 72px;
        right: 18px;
        bottom: auto;

        z-index: 1001;

        padding: 7px 10px;

        border-radius: 10px;

        background: rgba(41,37,34,.9);
        color: white;

        font: 600 11px/1.2 Arial, sans-serif;

        opacity: 0;
        pointer-events: none;

        transition: .2s;
      }

      .ipen-launch:hover + .ipen-tip {
        opacity: 1;
      }

      @media(max-width:700px) {
        .ipen-toolbar {
          top: 10px;
          overflow-x: auto;
          justify-content: flex-start;
        }

        .ipen-slider {
          width: 64px !important;
        }

        .ipen-tool,
        .ipen-action {
          width: 36px !important;
          height: 36px !important;
          min-width: 36px !important;
        }

        .ipen-launch {
        top: 12px;
        right: 12px;
        bottom: auto;
        }
      }

      body[data-view-mode="read"] .ipen-launch,
      body[data-view-mode="read"] .ipen-toolbar,
      body[data-view-mode="read"] .ipen-tip {
        display: none !important;
      }
    `;

    document.head.appendChild(style);
  }

  function page() {
    try {
      return window.currentPageId &&
        typeof window.getPageById === "function"
        ? window.getPageById(window.currentPageId)
        : null;
    } catch (_) {
      return null;
    }
  }

  function clone(v) {
    return JSON.parse(JSON.stringify(v));
  }

  function loadPageData() {
    const p = page();

    state.pageId = window.currentPageId || null;

    state.strokes = Array.isArray(p?.ipenStrokes)
      ? clone(p.ipenStrokes)
      : [];

    state.redo = [];
  }

  let saveTimer = 0;

  function savePageData() {
    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
      const p = page();

      if (!p) return;

      p.ipenStrokes = clone(state.strokes);

      try {
        if (typeof window.savePage === "function") {
          window.savePage(p);
        }
      } catch (_) {}

      try {
        if (typeof window.saveCurrentJournalState === "function") {
          window.saveCurrentJournalState();
        }
      } catch (_) {}
    }, 120);
  }

  function toolbarHTML() {
    return `
      <div class="ipen-toolbar" data-ipen-ui>

        <div class="ipen-tools">

          <button
            class="ipen-tool active"
            data-tool="pen"
            title="Pen"
          >✒</button>

          <button
            class="ipen-tool"
            data-tool="pencil"
            title="Pencil"
          >✎</button>

          <button
            class="ipen-tool"
            data-tool="fountain"
            title="Fountain pen"
          >⌁</button>

          <button
            class="ipen-tool"
            data-tool="calligraphy"
            title="Calligraphy"
          >𝓐</button>

          <button
            class="ipen-tool"
            data-tool="marker"
            title="Highlighter"
          >▰</button>

          <button
            class="ipen-tool"
            data-tool="eraser"
            title="Eraser"
          >⌫</button>

        </div>

        <span class="ipen-sep"></span>

        <input
          class="ipen-color"
          type="color"
          value="${state.color}"
          title="Ink color"
        >

        <input
          class="ipen-slider"
          type="range"
          min="1"
          max="40"
          step="1"
          value="${state.size}"
          title="Stroke size"
        >

        <span class="ipen-size-label">
          ${state.size}px
        </span>

        <span class="ipen-sep"></span>

        <button
          class="ipen-action"
          data-action="undo"
          title="Undo"
        >↶</button>

        <button
          class="ipen-action"
          data-action="redo"
          title="Redo"
        >↷</button>

        <button
          class="ipen-action"
          data-action="clear"
          title="Clear handwriting"
        >⌧</button>

        <button
          class="ipen-action"
          data-action="done"
          title="Done"
        >✓</button>

      </div>

      <button
        class="ipen-launch"
        type="button"
        title="Open Pro iPen"
        data-ipen-ui
      >✎</button>

      <div
        class="ipen-tip"
        data-ipen-ui
      >
        Pro iPen
      </div>
    `;
  }

  function attach(surface) {
    if (!surface || surface.dataset.ipenReady === "1") return;

    detach();
    injectStyles();

    state.surface = surface;
    surface.dataset.ipenReady = "1";

    const canvas = document.createElement("canvas");

    canvas.className = "ipen-canvas";
    canvas.setAttribute("aria-label", "Handwriting layer");

    surface.appendChild(canvas);

    surface.insertAdjacentHTML(
      "beforeend",
      toolbarHTML()
    );

    state.canvas = canvas;
    state.ctx = canvas.getContext("2d");

    loadPageData();
    bindUI();
    bindCanvas();
    resize();

    state.resizeObserver = new ResizeObserver(resize);
    state.resizeObserver.observe(surface);
  }

  function detach() {
    if (state.resizeObserver) {
      state.resizeObserver.disconnect();
    }

    state.resizeObserver = null;

    state.surface = null;
    state.canvas = null;
    state.ctx = null;

    state.active = false;
    state.drawing = false;
  }

  function resize() {
    if (!state.surface || !state.canvas) return;

    const r = state.surface.getBoundingClientRect();

    const dpr = Math.max(
      1,
      Math.min(window.devicePixelRatio || 1, 2)
    );

    const w = Math.max(
      1,
      Math.round(r.width * dpr)
    );

    const h = Math.max(
      1,
      Math.round(r.height * dpr)
    );

    if (
      state.canvas.width !== w ||
      state.canvas.height !== h
    ) {
      state.canvas.width = w;
      state.canvas.height = h;

      state.canvas.style.width = `${r.width}px`;
      state.canvas.style.height = `${r.height}px`;

      redraw();
    }
  }

  function pointFromEvent(e) {
    const r = state.canvas.getBoundingClientRect();

    return {
      x: (e.clientX - r.left) / r.width,
      y: (e.clientY - r.top) / r.height,

      p:
        e.pointerType === "pen" &&
        e.pressure > 0
          ? e.pressure
          : 0.5,

      t: Date.now()
    };
  }

  function widthFor(stroke, p) {
    let w = stroke.size;

    if (stroke.tool === "pencil") {
      w *= 0.65 + p * 0.55;
    }

    if (stroke.tool === "fountain") {
      w *= 0.55 + p * 1.05;
    }

    if (stroke.tool === "calligraphy") {
      w *= 0.8 + p * 0.45;
    }

    if (stroke.tool === "marker") {
      w *= 1.35;
    }

    if (stroke.tool === "eraser") {
      w *= 1.8;
    }

    return w;
  }

  function drawStroke(stroke) {
    const ctx = state.ctx;
    const c = state.canvas;

    if (
      !ctx ||
      !stroke?.points?.length
    ) return;

    const sx = c.width;
    const sy = c.height;

    ctx.save();

    ctx.lineCap =
      stroke.tool === "calligraphy"
        ? "butt"
        : "round";

    ctx.lineJoin = "round";

    ctx.globalCompositeOperation =
      stroke.tool === "eraser"
        ? "destination-out"
        : "source-over";

    ctx.strokeStyle = stroke.color;

    ctx.globalAlpha =
      stroke.tool === "eraser"
        ? 1
        : stroke.opacity;

    if (stroke.tool === "pencil") {
      ctx.globalAlpha *= 0.82;
    }

    const pts = stroke.points;

    if (pts.length === 1) {
      ctx.beginPath();

      ctx.arc(
        pts[0].x * sx,
        pts[0].y * sy,
        widthFor(stroke, pts[0].p) / 2,
        0,
        Math.PI * 2
      );

      ctx.fillStyle = stroke.color;
      ctx.fill();

    } else {

      for (let i = 1; i < pts.length; i++) {

        const a = pts[i - 1];
        const b = pts[i];

        ctx.beginPath();

        ctx.lineWidth =
          widthFor(
            stroke,
            (a.p + b.p) / 2
          ) *
          (
            sx /
            Math.max(
              1,
              state.surface.clientWidth
            )
          );

        ctx.moveTo(
          a.x * sx,
          a.y * sy
        );

        const mx =
          (a.x + b.x) *
          0.5 *
          sx;

        const my =
          (a.y + b.y) *
          0.5 *
          sy;

        ctx.quadraticCurveTo(
          a.x * sx,
          a.y * sy,
          mx,
          my
        );

        ctx.stroke();
      }
    }

    ctx.restore();
  }

  function redraw() {
    if (
      !state.ctx ||
      !state.canvas
    ) return;

    state.ctx.clearRect(
      0,
      0,
      state.canvas.width,
      state.canvas.height
    );

    state.strokes.forEach(drawStroke);

    if (state.current) {
      drawStroke(state.current);
    }
  }

  function begin(e) {
    if (
      !state.active ||
      e.button > 0
    ) return;

    e.preventDefault();

    state.drawing = true;

    state.canvas.setPointerCapture?.(
      e.pointerId
    );

    state.current = {
      tool: state.tool,
      color: state.color,
      size: state.size,
      opacity: state.opacity,
      points: [
        pointFromEvent(e)
      ]
    };

    redraw();
  }

  function move(e) {
    if (
      !state.active ||
      !state.drawing ||
      !state.current
    ) return;

    e.preventDefault();

    const events =
      typeof e.getCoalescedEvents === "function"
        ? e.getCoalescedEvents()
        : [e];

    for (const ev of events) {
      state.current.points.push(
        pointFromEvent(ev)
      );
    }

    redraw();
  }

  function end(e) {
    if (
      !state.drawing ||
      !state.current
    ) return;

    e?.preventDefault?.();

    state.drawing = false;

    state.strokes.push(
      state.current
    );

    state.current = null;
    state.redo = [];

    redraw();
    savePageData();
  }

  function bindCanvas() {
    const c = state.canvas;

    c.addEventListener(
      "pointerdown",
      begin,
      { passive: false }
    );

    c.addEventListener(
      "pointermove",
      move,
      { passive: false }
    );

    c.addEventListener(
      "pointerup",
      end,
      { passive: false }
    );

    c.addEventListener(
      "pointercancel",
      end,
      { passive: false }
    );
  }

  function setActive(on) {
    state.active = !!on;

    state.canvas?.classList.toggle(
      "ipen-active",
      state.active
    );

    state.surface
      ?.querySelector(".ipen-launch")
      ?.classList.toggle(
        "ipen-on",
        state.active
      );

    state.surface
      ?.querySelector(".ipen-toolbar")
      ?.classList.toggle(
        "open",
        state.active
      );
  }

  function selectTool(tool) {
    if (!PRESETS[tool]) return;

    state.tool = tool;
    state.size = PRESETS[tool].size;
    state.opacity = PRESETS[tool].opacity;

    state.surface
      .querySelectorAll(".ipen-tool")
      .forEach((b) => {
        b.classList.toggle(
          "active",
          b.dataset.tool === tool
        );
      });

    const slider =
      state.surface.querySelector(
        ".ipen-slider"
      );

    if (slider) {
      slider.value = state.size;
    }

    const label =
      state.surface.querySelector(
        ".ipen-size-label"
      );

    if (label) {
      label.textContent =
        `${state.size}px`;
    }
  }

  function undo() {
    if (!state.strokes.length) return;

    state.redo.push(
      state.strokes.pop()
    );

    redraw();
    savePageData();
  }

  function redo() {
    if (!state.redo.length) return;

    state.strokes.push(
      state.redo.pop()
    );

    redraw();
    savePageData();
  }

  function clearAll() {
    if (!state.strokes.length) return;

    if (
      !confirm(
        "Clear all handwriting on this page?"
      )
    ) return;

    state.redo =
      state.strokes.splice(0);

    redraw();
    savePageData();
  }

  function bindUI() {
    const s = state.surface;

    const launcher = s.querySelector(".ipen-launch");

    if (launcher) {
    launcher.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    launcher.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        setActive(!state.active);
    });
    }

    s.querySelectorAll(
      ".ipen-tool"
    ).forEach((b) => {

      b.addEventListener(
        "click",
        () => selectTool(
          b.dataset.tool
        )
      );

    });

    s.querySelector(
      ".ipen-color"
    ).addEventListener(
      "input",
      (e) => {
        state.color =
          e.target.value;
      }
    );

    s.querySelector(
      ".ipen-slider"
    ).addEventListener(
      "input",
      (e) => {

        state.size =
          +e.target.value;

        s.querySelector(
          ".ipen-size-label"
        ).textContent =
          `${state.size}px`;
      }
    );

    s.querySelector(
      '[data-action="undo"]'
    ).addEventListener(
      "click",
      undo
    );

    s.querySelector(
      '[data-action="redo"]'
    ).addEventListener(
      "click",
      redo
    );

    s.querySelector(
      '[data-action="clear"]'
    ).addEventListener(
      "click",
      clearAll
    );

    s.querySelector(
      '[data-action="done"]'
    ).addEventListener(
      "click",
      () => setActive(false)
    );
  }

  function scan() {
    const surface =
      document.querySelector(
        "#editorContainer .editor-surface"
      );

    if (!surface) return;

    if (
      surface !== state.surface ||
      state.pageId !==
        (window.currentPageId || null)
    ) {
      attach(surface);
    }
  }

  const observer =
    new MutationObserver(
      () => requestAnimationFrame(scan)
    );

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
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      boot
    );
  } else {
    boot();
  }

  window[NS] = {
    attach,
    scan,
    setActive,
    selectTool,
    undo,
    redo,
    clear: clearAll,

    get active() {
      return state.active;
    }
  };
})();