const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const NASA_KEY = process.env.NASA_FIRMS_MAP_KEY;


// =====================================================
// HOME / SERVER TEST
// =====================================================

app.get("/", (req, res) => {

    res.json({

        status: "online",

        message:
            "THERMOGUARD AI Backend is running",

        service:
            "NASA FIRMS + OpenStreetMap Integration"

    });

});


// =====================================================
// NASA FIRMS
// =====================================================

app.get("/api/fires", async (req, res) => {

    try {

        if (!NASA_KEY) {

            return res.status(500).json({

                success: false,

                message:
                    "NASA FIRMS MAP_KEY is not configured."

            });

        }


        // Maharashtra approximate bounding box

        const west = 72.5;

        const south = 15.5;

        const east = 80.0;

        const north = 22.5;


        const source =
            "VIIRS_SNPP_NRT";

        const days = 1;


        const url =
            `https://firms.modaps.eosdis.nasa.gov/api/area/csv/` +
            `${NASA_KEY}/${source}/` +
            `${west},${south},${east},${north}/${days}`;


        const response =
            await axios.get(url);


        const csvData =
            response.data;


        // =================================================
        // CSV → JSON
        // =================================================

        const lines =
            csvData
                .trim()
                .split("\n");


        if (lines.length <= 1) {

            return res.json({

                success: true,

                count: 0,

                source: "NASA FIRMS",

                satellite: source,

                fires: []

            });

        }


        const headers =
            lines[0].split(",");


        const fires =
            lines
                .slice(1)
                .map(line => {

                    const values =
                        line.split(",");

                    const fire = {};


                    headers.forEach(
                        (header, index) => {

                            fire[header] =
                                values[index];

                        }
                    );


                    return fire;

                });


        res.json({

            success: true,

            count: fires.length,

            source:
                "NASA FIRMS",

            satellite:
                source,

            fires:
                fires

        });

    }

    catch (error) {

        console.error(
            "NASA FIRMS Error:",
            error.message
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to fetch NASA FIRMS data.",

            error:
                error.message

        });

    }

});


// =====================================================
// OSM INFRASTRUCTURE
// =====================================================

app.get(
    "/api/infrastructure",
    async (req, res) => {

        try {

            const latitude =
                parseFloat(req.query.lat);

            const longitude =
                parseFloat(req.query.lon);


            // ---------------------------------------------
            // Validate coordinates
            // ---------------------------------------------

            if (
                Number.isNaN(latitude) ||
                Number.isNaN(longitude)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Valid latitude and longitude are required."

                });

            }


            console.log(
                `OSM request: ${latitude}, ${longitude}`
            );


            // ---------------------------------------------
            // Overpass Query
            // ---------------------------------------------

            const query = `

[out:json][timeout:25];

(

    /* INDUSTRIAL AREAS */

    nwr(
        around:5000,
        ${latitude},
        ${longitude}
    )["landuse"="industrial"];


    nwr(
        around:5000,
        ${latitude},
        ${longitude}
    )["industrial"];


    /* ROADS */

    way(
        around:5000,
        ${latitude},
        ${longitude}
    )["highway"];


    /* SETTLEMENTS */

    nwr(
        around:5000,
        ${latitude},
        ${longitude}
    )["place"~"city|town|village|suburb"];

);

out center;

`;


            // ---------------------------------------------
            // Overpass API
            // ---------------------------------------------

            const overpassURL =
                "https://overpass-api.de/api/interpreter";


            const response =
                await axios.post(
                    overpassURL,
                    query,
                    {
                        headers: {

                            "Content-Type":
                                "text/plain"

                        },

                        timeout: 30000
                    }
                );


            const elements =
                response.data.elements || [];


            // ---------------------------------------------
            // Counters
            // ---------------------------------------------

            let industrialCount = 0;

            let roadCount = 0;

            let settlementCount = 0;


            // ---------------------------------------------
            // Nearest distances
            // ---------------------------------------------

            let nearestIndustrial =
                Infinity;

            let nearestRoad =
                Infinity;

            let nearestSettlement =
                Infinity;


            // ---------------------------------------------
            // Process OSM elements
            // ---------------------------------------------

            elements.forEach(
                element => {

                    const tags =
                        element.tags || {};


                    // -------------------------------------
                    // Get coordinates
                    // -------------------------------------

                    let elementLat = null;

                    let elementLon = null;


                    if (
                        element.lat !== undefined &&
                        element.lon !== undefined
                    ) {

                        elementLat =
                            parseFloat(
                                element.lat
                            );

                        elementLon =
                            parseFloat(
                                element.lon
                            );

                    }

                    else if (
                        element.center
                    ) {

                        elementLat =
                            parseFloat(
                                element.center.lat
                            );

                        elementLon =
                            parseFloat(
                                element.center.lon
                            );

                    }


                    if (
                        Number.isNaN(elementLat) ||
                        Number.isNaN(elementLon)
                    ) {

                        return;

                    }


                    // -------------------------------------
                    // Calculate distance
                    // -------------------------------------

                    const distance =
                        calculateDistance(
                            latitude,
                            longitude,
                            elementLat,
                            elementLon
                        );


                    // -------------------------------------
                    // Industrial
                    // -------------------------------------

                    if (
                        tags.landuse ===
                        "industrial" ||

                        tags.industrial
                    ) {

                        industrialCount++;


                        if (
                            distance <
                            nearestIndustrial
                        ) {

                            nearestIndustrial =
                                distance;

                        }

                    }


                    // -------------------------------------
                    // Roads
                    // -------------------------------------

                    if (
                        tags.highway
                    ) {

                        roadCount++;


                        if (
                            distance <
                            nearestRoad
                        ) {

                            nearestRoad =
                                distance;

                        }

                    }


                    // -------------------------------------
                    // Settlement
                    // -------------------------------------

                    if (
                        tags.place &&
                        (
                            tags.place === "city" ||
                            tags.place === "town" ||
                            tags.place === "village" ||
                            tags.place === "suburb"
                        )
                    ) {

                        settlementCount++;


                        if (
                            distance <
                            nearestSettlement
                        ) {

                            nearestSettlement =
                                distance;

                        }

                    }

                }
            );


            // ---------------------------------------------
            // Format distance
            // ---------------------------------------------

            const formatDistance =
                distance => {

                    if (
                        distance === Infinity
                    ) {

                        return null;

                    }


                    if (
                        distance < 1
                    ) {

                        return (
                            Math.round(
                                distance * 1000
                            ) +
                            " m"
                        );

                    }


                    return (
                        distance.toFixed(2) +
                        " km"
                    );

                };


            // ---------------------------------------------
            // Final response
            // ---------------------------------------------

            res.json({

                success: true,

                source:
                    "OpenStreetMap",

                searchRadius:
                    "5 km",

                location: {

                    latitude:
                        latitude,

                    longitude:
                        longitude

                },


                industrial: {

                    count:
                        industrialCount,

                    nearest:
                        formatDistance(
                            nearestIndustrial
                        )

                },


                roads: {

                    count:
                        roadCount,

                    nearest:
                        formatDistance(
                            nearestRoad
                        )

                },


                settlements: {

                    count:
                        settlementCount,

                    nearest:
                        formatDistance(
                            nearestSettlement
                        )

                }

            });

        }

        catch (error) {

            console.error(
                "OSM ERROR:",
                error.message
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to fetch OpenStreetMap infrastructure data.",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// HAVERSINE DISTANCE
// =====================================================

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius =
        6371;


    const dLat =
        toRadians(
            lat2 - lat1
        );


    const dLon =
        toRadians(
            lon2 - lon1
        );


    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(
            toRadians(lat1)
        ) *

        Math.cos(
            toRadians(lat2)
        ) *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return (
        earthRadius * c
    );

}


// =====================================================
// DEGREES → RADIANS
// =====================================================

function toRadians(
    degrees
) {

    return (
        degrees *
        Math.PI /
        180
    );

}


// =====================================================
// SERVER
// =====================================================

app.listen(
    PORT,
    () => {

        console.log(
            `🔥 THERMOGUARD AI Backend running at http://localhost:${PORT}`
        );

        console.log(
            `🛰️ NASA FIRMS: /api/fires`
        );

        console.log(
            `🗺️ OSM Infrastructure: /api/infrastructure`
        );

    }
);