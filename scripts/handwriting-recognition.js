/* =========================================================
   LinguaLog Handwriting Recognition
   Provider-independent recognition layer
   ========================================================= */

(() => {
    "use strict";

    const NS = "LinguaHandwriting";

    const state = {
        provider: null,
        recognizing: false
    };


    /* =========================================================
       NORMALIZE STROKES
       ========================================================= */

    function normalizeStrokes(strokes = []) {

        if (!Array.isArray(strokes)) {
            return [];
        }

        return strokes
            .filter(stroke =>
                stroke &&
                stroke.tool !== "eraser" &&
                Array.isArray(stroke.points) &&
                stroke.points.length
            )
            .map(stroke => ({
                tool: stroke.tool || "pen",

                points: stroke.points.map(point => ({
                    x: Number(point.x) || 0,
                    y: Number(point.y) || 0,
                    t: Number(point.t) || 0,
                    p: Number(point.p) || 0.5
                }))
            }));
    }


    /* =========================================================
       PAGE LANGUAGE
       ========================================================= */

    function getLanguage() {

        try {
            const page =
                typeof window.getPageById === "function" &&
                window.currentPageId
                    ? window.getPageById(window.currentPageId)
                    : null;

            return (
                page?.language ||
                page?.targetLanguage ||
                page?.sourceLanguage ||
                document.documentElement.lang ||
                "en"
            );

        } catch (error) {

            console.warn(
                "LinguaLog handwriting: language detection failed.",
                error
            );

            return "en";
        }
    }


    /* =========================================================
       PROVIDER
       ========================================================= */

    function setProvider(provider) {

        if (
            provider !== null &&
            typeof provider?.recognize !== "function"
        ) {
            throw new Error(
                "Handwriting provider must implement recognize()."
            );
        }

        state.provider = provider;
    }


    /* =========================================================
       RECOGNIZE
       ========================================================= */

    async function recognize({
        strokes = [],
        language = null
    } = {}) {

        if (state.recognizing) {
            throw new Error(
                "Handwriting recognition is already running."
            );
        }

        const normalized =
            normalizeStrokes(strokes);

        if (!normalized.length) {
            throw new Error(
                "Write something with iPen first."
            );
        }

        if (!state.provider) {
            return {
                status: "provider-required",
                text: "",
                alternatives: [],
                language: language || getLanguage()
            };
        }

        state.recognizing = true;

        try {

            const result =
                await state.provider.recognize({
                    strokes: normalized,
                    language: language || getLanguage()
                });

            return {
                status: "success",
                text: result?.text || "",
                alternatives:
                    Array.isArray(result?.alternatives)
                        ? result.alternatives
                        : [],
                language:
                    result?.language ||
                    language ||
                    getLanguage()
            };

        } finally {

            state.recognizing = false;
        }
    }


    /* =========================================================
       PUBLIC API
       ========================================================= */

    window[NS] = {

        recognize,

        setProvider,

        normalizeStrokes,

        getLanguage,

        get recognizing() {
            return state.recognizing;
        }
    };

})();
