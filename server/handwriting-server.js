/* =========================================================
   LinguaLog Handwriting Recognition Server
   Secure bridge: LinguaLog -> MyScript Cloud
   ========================================================= */

"use strict";

require("dotenv").config();

const express = require("express");
const crypto = require("crypto");
const cors = require("cors");

const app = express();

app.use(
    cors({
        origin: [
            "http://localhost:8000",
            "http://127.0.0.1:8000"
        ]
    })
);

const PORT =
    process.env.PORT || 3000;

const MYSCRIPT_URL =
    "https://cloud.myscript.com/api/v4.0/iink/recognize";

app.use(
    express.json({
        limit: "5mb"
    })
);


/* =========================================================
   LANGUAGE
   ========================================================= */

function normalizeLanguage(language) {

    const value =
        String(language || "en")
            .trim()
            .replace("-", "_");

    const languages = {
        en: "en_US",
        nb: "nb_NO",
        no: "nb_NO",
        nn: "nn_NO",
        fr: "fr_FR",
        de: "de_DE",
        es: "es_ES",
        it: "it_IT",
        pt: "pt_PT"
    };

    if (value.includes("_")) {
        return value;
    }

    return languages[value.toLowerCase()] || "en_US";
}


/* =========================================================
   CONVERT LINGUALOG STROKES -> MYSCRIPT STROKES
   ========================================================= */

function convertStrokes(strokes) {

    if (!Array.isArray(strokes)) {
        return [];
    }

    /*
     * LinguaLog stores x/y from 0 -> 1.
     *
     * Convert them into a stable writing area measured
     * in pixels. The aspect ratio does not have to match
     * the physical screen exactly for our first version.
     */

    const WIDTH = 1000;
    const HEIGHT = 1400;

    return strokes
        .filter(stroke =>
            stroke &&
            stroke.tool !== "eraser" &&
            Array.isArray(stroke.points) &&
            stroke.points.length
        )
        .map(stroke => {

            const points =
                stroke.points;

            const firstTime =
                Number(points[0]?.t) || 0;

            return {

                x: points.map(point =>
                    Math.max(
                        0,
                        Number(point.x || 0) * WIDTH
                    )
                ),

                y: points.map(point =>
                    Math.max(
                        0,
                        Number(point.y || 0) * HEIGHT
                    )
                ),

                t: points.map(point =>
                    Math.max(
                        0,
                        (Number(point.t) || firstTime) -
                        firstTime
                    )
                ),

                p: points.map(point =>
                    Math.max(
                        0,
                        Math.min(
                            1,
                            Number(point.p) || 0.5
                        )
                    )
                )
            };
        });
}


/* =========================================================
   EXTRACT RECOGNIZED TEXT
   ========================================================= */

function extractText(result) {

    if (!result) {
        return "";
    }

    if (typeof result.label === "string") {
        return result.label.trim();
    }

    if (typeof result.text === "string") {
        return result.text.trim();
    }

    /*
     * JIIX responses can contain nested text blocks.
     */

    const collected = [];

    function walk(value) {

        if (!value) {
            return;
        }

        if (Array.isArray(value)) {

            value.forEach(walk);

            return;
        }

        if (typeof value !== "object") {
            return;
        }

        if (
            typeof value.label === "string" &&
            value.label.trim()
        ) {

            collected.push(
                value.label.trim()
            );

            return;
        }

        if (
            typeof value.text === "string" &&
            value.text.trim()
        ) {

            collected.push(
                value.text.trim()
            );

            return;
        }

        Object.values(value).forEach(walk);
    }

    walk(result);

    return [...new Set(collected)]
        .join("\n")
        .trim();
}


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get(
    "/api/handwriting",
    (req, res) => {

        res.json({
            ok: true,
            service: "LinguaLog handwriting recognition"
        });
    }
);


/* =========================================================
   RECOGNIZE HANDWRITING
   ========================================================= */

app.post(
    "/api/handwriting",
    async (req, res) => {

        try {

            const applicationKey =
                process.env.MYSCRIPT_APPLICATION_KEY;

            const hmacKey =
                process.env.MYSCRIPT_HMAC_KEY;


            if (
                !applicationKey ||
                !hmacKey
            ) {

                return res.status(500).json({
                    error:
                        "MyScript credentials are not configured."
                });
            }


            const strokes =
                convertStrokes(
                    req.body?.strokes
                );


            if (!strokes.length) {

                return res.status(400).json({
                    error:
                        "No handwriting strokes were provided."
                });
            }


            const language =
                normalizeLanguage(
                    req.body?.language
                );


            /*
             * MyScript recognizer request.
             */

            const payload = {

                scaleX: 1,
                scaleY: 1,

                contentType:
                    "Text",

                configuration: {

                    lang:
                        language,

                    export: {

                        jiix: {

                            strokes:
                                false
                        }
                    }
                },

                strokes
            };


            /*
             * IMPORTANT:
             *
             * HMAC must be calculated from exactly the
             * same JSON string that we send to MyScript.
             */

            const body =
                JSON.stringify(payload);


            const hmac =
                crypto
                    .createHmac(
                        "sha512",
                        applicationKey + hmacKey
                    )
                    .update(body)
                    .digest("hex");


            const response =
                await fetch(
                    MYSCRIPT_URL,
                    {
                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/vnd.myscript.jiix,application/json",

                            "applicationKey":
                                applicationKey,

                            "hmac":
                                hmac
                        },

                        body
                    }
                );


            const responseText =
                await response.text();


            let result;

            try {

                result =
                    JSON.parse(
                        responseText
                    );

            } catch (_) {

                result = {
                    raw: responseText
                };
            }


            if (!response.ok) {

                console.error(
                    "MyScript recognition error:",
                    response.status,
                    result
                );


                return res
                    .status(response.status)
                    .json({
                        error:
                            result?.message ||
                            "MyScript recognition failed.",

                        code:
                            result?.code ||
                            null
                    });
            }


            const text =
                extractText(result);


            return res.json({

                status:
                    "success",

                text,

                alternatives:
                    [],

                language,

                raw:
                    result
            });


        } catch (error) {

            console.error(
                "LinguaLog handwriting server error:",
                error
            );


            return res
                .status(500)
                .json({
                    error:
                        "Handwriting recognition failed."
                });
        }
    }
);


/* =========================================================
   START SERVER
   ========================================================= */

app.listen(
    PORT,
    () => {

        console.log(
            `LinguaLog handwriting server running on http://localhost:${PORT}`
        );
    }
);