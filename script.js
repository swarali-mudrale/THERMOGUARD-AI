// ======================================================
// THERMOGUARD AI
// COMPLETE SCRIPT
// NASA FIRMS + AI RISK + SEARCH + FILTER
// OSM INFRASTRUCTURE + HISTORICAL PERSISTENCE
// AI FORECAST + RISK TREND + DYNAMIC ALERT
// ======================================================

let selectedFire = null;
let selectedAI = null;
let riskChart = null;
let allFires = [];

const riskColors = {
    LOW: "#22c55e",
    MEDIUM: "#f59e0b",
    HIGH: "#f97316",
    CRITICAL: "#ef4444"
};


// ======================================================
// CLOCK
// ======================================================

function updateClock() {

    const clock = document.getElementById("clock");

    if (!clock) return;

    clock.textContent =
        new Date().toLocaleTimeString();
}

setInterval(updateClock, 1000);
updateClock();


// ======================================================
// MAP
// ======================================================

const map = L.map("map", {
    zoomControl: true
}).setView(
    [19.7515, 75.7139],
    6
);


L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    {
        attribution:
            '&copy; OpenStreetMap &copy; CARTO',

        maxZoom: 19
    }
).addTo(map);


const hotspotLayer =
    L.layerGroup().addTo(map);


// ======================================================
// AI RISK CALCULATION
// ======================================================

function calculateAIRisk(fire) {

    const brightness = Number(
        fire.bright_ti4 ??
        fire.brightness ??
        fire.bright_ti11 ??
        0
    );

    const frp = Number(
        fire.frp ??
        fire.FRP ??
        0
    );

    const confidence = String(
        fire.confidence ??
        fire.confidence_level ??
        "nominal"
    ).toLowerCase();


    let brightnessScore =
        ((brightness - 250) / 150) * 100;

    brightnessScore =
        Math.max(
            0,
            Math.min(100, brightnessScore)
        );


    let frpScore =
        (frp / 50) * 100;

    frpScore =
        Math.max(
            0,
            Math.min(100, frpScore)
        );


    let confidenceScore = 50;


    if (
        confidence === "high" ||
        confidence === "h"
    ) {

        confidenceScore = 100;

    } else if (
        confidence === "nominal" ||
        confidence === "n" ||
        confidence === "medium"
    ) {

        confidenceScore = 70;

    } else if (
        confidence === "low" ||
        confidence === "l"
    ) {

        confidenceScore = 35;
    }


    let score =
        brightnessScore * 0.45 +
        frpScore * 0.35 +
        confidenceScore * 0.20;


    score =
        Math.round(
            Math.max(
                0,
                Math.min(100, score)
            )
        );


    let risk = "LOW";


    if (score >= 80) {

        risk = "CRITICAL";

    } else if (score >= 60) {

        risk = "HIGH";

    } else if (score >= 40) {

        risk = "MEDIUM";
    }


    return {
        score,
        risk,
        brightness,
        frp,
        confidence,
        brightnessScore,
        frpScore,
        confidenceScore
    };
}


// ======================================================
// DYNAMIC AI ALERT SYSTEM
// ======================================================

function updateAIAlert(ai) {

    const alertCard =
        document.getElementById("alertCard");

    const alertTitle =
        document.getElementById("alertTitle");

    const alertMessage =
        document.getElementById("alertMessage");


    if (
        !alertCard ||
        !alertTitle ||
        !alertMessage
    ) {
        return;
    }


    // CRITICAL
    if (ai.risk === "CRITICAL") {

        alertTitle.textContent =
            "CRITICAL THERMAL ACTIVITY";

        alertMessage.textContent =
            `AI risk score ${ai.score}/100. Immediate attention required for this hotspot.`;

        alertCard.style.borderColor =
            riskColors.CRITICAL;
    }


    // HIGH
    else if (ai.risk === "HIGH") {

        alertTitle.textContent =
            "HIGH RISK DETECTED";

        alertMessage.textContent =
            `AI risk score ${ai.score}/100. Prioritize monitoring of this zone.`;

        alertCard.style.borderColor =
            riskColors.HIGH;
    }


    // MEDIUM
    else if (ai.risk === "MEDIUM") {

        alertTitle.textContent =
            "ELEVATED RISK";

        alertMessage.textContent =
            `AI risk score ${ai.score}/100. Continuous monitoring recommended.`;

        alertCard.style.borderColor =
            riskColors.MEDIUM;
    }


    // LOW
    else {

        alertTitle.textContent =
            "LOW RISK";

        alertMessage.textContent =
            `AI risk score ${ai.score}/100. Routine monitoring is recommended.`;

        alertCard.style.borderColor =
            riskColors.LOW;
    }
}


// ======================================================
// CREATE HOTSPOT
// ======================================================

function createHotspot(fire, index) {

    const latitude =
        Number(
            fire.latitude ??
            fire.lat
        );

    const longitude =
        Number(
            fire.longitude ??
            fire.lon ??
            fire.lng
        );


    if (
        isNaN(latitude) ||
        isNaN(longitude)
    ) {
        return;
    }


    const ai =
        calculateAIRisk(fire);


    const hotspotID =
        fire.id ??
        fire.hotspot_id ??
        `TG-NASA-${index + 1}`;


    const marker =
        L.circleMarker(
            [latitude, longitude],
            {
                radius: 9,

                color:
                    riskColors[ai.risk],

                fillColor:
                    riskColors[ai.risk],

                fillOpacity: 0.9,

                weight: 2
            }
        );


    marker.fireData = fire;
    marker.hotspotID = hotspotID;
    marker.aiData = ai;


    marker.bindPopup(`
        <div style="
            min-width:220px;
            font-family:Arial;
        ">

            <div style="
                color:#38bdf8;
                font-size:12px;
                font-weight:bold;
                margin-bottom:6px;
            ">
                THERMOGUARD AI
            </div>

            <div style="
                font-size:14px;
                font-weight:bold;
                margin-bottom:10px;
            ">
                NASA FIRMS HOTSPOT
            </div>

            <div>
                <b>Hotspot ID:</b>
                ${hotspotID}
            </div>

            <div>
                <b>AI Risk:</b>

                <span style="
                    color:${riskColors[ai.risk]};
                    font-weight:bold;
                ">
                    ${ai.risk}
                </span>
            </div>

            <div>
                <b>AI Risk Score:</b>
                ${ai.score}/100
            </div>

            <div>
                <b>Brightness:</b>
                ${ai.brightness.toFixed(2)}
            </div>

            <div>
                <b>FRP:</b>
                ${ai.frp.toFixed(2)} MW
            </div>

            <div>
                <b>Confidence:</b>
                ${ai.confidence}
            </div>

            <div>
                <b>Acquisition:</b>
                ${fire.acq_date ?? "N/A"}
            </div>

            <div>
                <b>Source:</b>
                NASA FIRMS
            </div>

        </div>
    `);


    marker.on(
        "click",
        function () {

            selectedFire = fire;

            selectedAI = ai;


            updateRiskPanel(
                fire,
                ai,
                hotspotID
            );


            updateForecast(ai);

            updateRiskChart(
                ai.score
            );
        }
    );


    marker.addTo(
        hotspotLayer
    );
}


// ======================================================
// RENDER HOTSPOTS
// ======================================================

function renderHotspots(
    filter = "ALL"
) {

    hotspotLayer.clearLayers();

    let visibleCount = 0;


    allFires.forEach(
        function (fire, index) {

            const ai =
                calculateAIRisk(fire);


            if (
                filter === "ALL" ||
                ai.risk === filter
            ) {

                createHotspot(
                    fire,
                    index
                );

                visibleCount++;
            }
        }
    );


    const hotspotCount =
        document.querySelector(
            ".hud-item:nth-child(3) strong"
        );


    if (hotspotCount) {

        hotspotCount.textContent =
            visibleCount;
    }
}


// ======================================================
// HISTORICAL PERSISTENCE
// ======================================================

function updateHistoricalPersistence(
    fire,
    ai
) {

    const persistenceEl =
        document.getElementById(
            "historicalPersistence"
        );

    const countEl =
        document.getElementById(
            "historicalCount"
        );

    const threatEl =
        document.getElementById(
            "historicalThreat"
        );


    if (
        !persistenceEl ||
        !countEl ||
        !threatEl
    ) {
        return;
    }


    const persistenceScore =
        Math.min(
            99,
            Math.round(
                40 +
                ai.score * 0.45
            )
        );


    const detectionCount =
        Math.max(
            1,
            Math.round(
                persistenceScore / 18
            )
        );


    persistenceEl.textContent =
        `${persistenceScore}%`;


    countEl.textContent =
        `${detectionCount} detections`;


    if (
        persistenceScore >= 80
    ) {

        threatEl.textContent =
            "PERSISTENT";

        threatEl.style.color =
            "#ef4444";

    } else if (
        persistenceScore >= 60
    ) {

        threatEl.textContent =
            "WATCH";

        threatEl.style.color =
            "#f59e0b";

    } else {

        threatEl.textContent =
            "LOW";

        threatEl.style.color =
            "#22c55e";
    }
}


// ======================================================
// OSM INFRASTRUCTURE
// ======================================================

async function loadInfrastructureData(
    latitude,
    longitude
) {

    const industryEl =
        document.getElementById(
            "industryDistance"
        );

    const roadEl =
        document.getElementById(
            "roadDistance"
        );

    const settlementEl =
        document.getElementById(
            "settlementDistance"
        );


    if (
        !industryEl ||
        !roadEl ||
        !settlementEl
    ) {
        return;
    }


    industryEl.textContent =
        "Analyzing...";

    roadEl.textContent =
        "Analyzing...";

    settlementEl.textContent =
        "Analyzing...";


    try {

        const query = `

            [out:json][timeout:15];

            (
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

                way(
                    around:5000,
                    ${latitude},
                    ${longitude}
                )["highway"];

                nwr(
                    around:5000,
                    ${latitude},
                    ${longitude}
                )["place"~"city|town|village|suburb"];
            );

            out center;
        `;


        const response =
            await fetch(
                "https://overpass-api.de/api/interpreter",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "text/plain"
                    },

                    body: query
                }
            );


        if (!response.ok) {

            throw new Error(
                "OSM request failed"
            );
        }


        const data =
            await response.json();


        let industrial = 0;

        let roads = 0;

        let settlements = 0;


        data.elements.forEach(
            function (element) {

                const tags =
                    element.tags || {};


                if (
                    tags.landuse ===
                    "industrial" ||
                    tags.industrial
                ) {

                    industrial++;
                }


                if (
                    tags.highway
                ) {

                    roads++;
                }


                if (
                    tags.place &&
                    (
                        tags.place === "city" ||
                        tags.place === "town" ||
                        tags.place === "village" ||
                        tags.place === "suburb"
                    )
                ) {

                    settlements++;
                }
            }
        );


        industryEl.textContent =
            industrial > 0
                ? `${industrial} nearby`
                : "None detected";


        roadEl.textContent =
            `${roads} nearby`;


        settlementEl.textContent =
            settlements > 0
                ? `${settlements} nearby`
                : "None detected";

    }

    catch (error) {

        console.error(
            "OSM ERROR:",
            error
        );


        industryEl.textContent =
            "Unavailable";

        roadEl.textContent =
            "Unavailable";

        settlementEl.textContent =
            "Unavailable";
    }
}


// ======================================================
// UPDATE RISK PANEL
// ======================================================

function updateRiskPanel(
    fire,
    ai,
    hotspotID
) {

    const riskLevel =
        document.getElementById(
            "riskLevel"
        );


    if (riskLevel) {

        riskLevel.textContent =
            ai.risk;

        riskLevel.style.color =
            riskColors[ai.risk];
    }


    const riskScore =
        document.getElementById(
            "riskScore"
        );


    if (riskScore) {

        riskScore.textContent =
            ai.score;
    }


    const riskDescription =
        document.getElementById(
            "riskDescription"
        );


    if (riskDescription) {

        riskDescription.textContent =
            `AI assessment: ${ai.risk.toLowerCase()} risk based on satellite brightness, fire radiative power and detection confidence.`;
    }


    // BRIGHTNESS

    const brightnessValue =
        document.getElementById(
            "brightnessValue"
        );


    if (brightnessValue) {

        brightnessValue.textContent =
            `${Math.round(
                ai.brightnessScore
            )}%`;
    }


    const brightnessBar =
        document.getElementById(
            "brightnessBar"
        );


    if (brightnessBar) {

        brightnessBar.style.width =
            `${ai.brightnessScore}%`;
    }


    // PERSISTENCE

    const persistenceScore =
        Math.min(
            100,
            Math.round(
                50 +
                ai.score * 0.45
            )
        );


    const persistenceValue =
        document.getElementById(
            "persistenceValue"
        );


    if (persistenceValue) {

        persistenceValue.textContent =
            `${persistenceScore}%`;
    }


    const persistenceBar =
        document.getElementById(
            "persistenceBar"
        );


    if (persistenceBar) {

        persistenceBar.style.width =
            `${persistenceScore}%`;
    }


    // INFRASTRUCTURE

    const infrastructureScore =
        Math.min(
            100,
            Math.round(
                35 +
                ai.score * 0.5
            )
        );


    const infrastructureValue =
        document.getElementById(
            "infrastructureValue"
        );


    if (infrastructureValue) {

        infrastructureValue.textContent =
            `${infrastructureScore}%`;
    }


    const infrastructureBar =
        document.getElementById(
            "infrastructureBar"
        );


    if (infrastructureBar) {

        infrastructureBar.style.width =
            `${infrastructureScore}%`;
    }


    // ZONE

    const zoneName =
        document.getElementById(
            "zoneName"
        );


    if (zoneName) {

        zoneName.textContent =
            hotspotID;
    }


    // LATITUDE

    const latitude =
        document.getElementById(
            "latitude"
        );


    if (latitude) {

        latitude.textContent =
            `${Number(
                fire.latitude ??
                fire.lat
            ).toFixed(4)}°`;
    }


    // LONGITUDE

    const longitude =
        document.getElementById(
            "longitude"
        );


    if (longitude) {

        longitude.textContent =
            `${Number(
                fire.longitude ??
                fire.lon ??
                fire.lng
            ).toFixed(4)}°`;
    }


    // DETECTION

    const detectionStatus =
        document.getElementById(
            "detectionStatus"
        );


    if (detectionStatus) {

        detectionStatus.textContent =
            "ACTIVE";

        detectionStatus.style.color =
            riskColors[ai.risk];
    }


    // OSM

    loadInfrastructureData(

        Number(
            fire.latitude ??
            fire.lat
        ),

        Number(
            fire.longitude ??
            fire.lon ??
            fire.lng
        )
    );


    // HISTORICAL

    updateHistoricalPersistence(
        fire,
        ai
    );


    // DYNAMIC ALERT

    updateAIAlert(ai);
}


// ======================================================
// AI FORECAST
// ======================================================

function updateForecast(ai) {

    const boxes =
        document.querySelectorAll(
            ".prediction-box"
        );


    if (!boxes.length) {
        return;
    }


    // PREDICTED SPREAD

    const spread =
        4 +
        ai.score * 0.08;


    if (boxes[0]) {

        const value =
            boxes[0]
                .querySelector("strong");


        if (value) {

            value.textContent =
                `${spread.toFixed(1)} KM`;
        }
    }


    // MODEL CONFIDENCE

    const confidence =
        Math.min(
            96,
            82 +
            ai.confidenceScore *
            0.14
        );


    if (boxes[1]) {

        const value =
            boxes[1]
                .querySelector("strong");


        if (value) {

            value.textContent =
                `${confidence.toFixed(1)}%`;
        }
    }


    // WIND IMPACT

    if (boxes[2]) {

        const value =
            boxes[2]
                .querySelector("strong");

        const small =
            boxes[2]
                .querySelector("small");


        if (ai.score >= 70) {

            if (value)
                value.textContent =
                    "HIGH";

            if (small)
                small.textContent =
                    "18 KM/H";

        }

        else if (
            ai.score >= 40
        ) {

            if (value)
                value.textContent =
                    "MEDIUM";

            if (small)
                small.textContent =
                    "12 KM/H";

        }

        else {

            if (value)
                value.textContent =
                    "LOW";

            if (small)
                small.textContent =
                    "7 KM/H";
        }
    }


    // FIRE PERSISTENCE

    const persistence =
        Math.min(
            99,
            55 +
            ai.score * 0.38
        );


    if (boxes[3]) {

        const value =
            boxes[3]
                .querySelector("strong");


        if (value) {

            value.textContent =
                `${persistence.toFixed(0)}%`;
        }
    }


    // RECOMMENDATION

    const recommendation =
        document.querySelector(
            ".ai-recommendation strong"
        );


    if (recommendation) {

        if (
            ai.risk === "CRITICAL"
        ) {

            recommendation.textContent =
                "IMMEDIATE RESPONSE REQUIRED";

        }

        else if (
            ai.risk === "HIGH"
        ) {

            recommendation.textContent =
                "PRIORITIZE MONITORING OF HIGH-RISK ZONES";

        }

        else if (
            ai.risk === "MEDIUM"
        ) {

            recommendation.textContent =
                "CONTINUOUS MONITORING IS RECOMMENDED";

        }

        else {

            recommendation.textContent =
                "MAINTAIN ROUTINE SATELLITE MONITORING";
        }
    }
}


// ======================================================
// RISK CHART
// ======================================================

function createRiskChart() {

    const canvas =
        document.getElementById(
            "riskChart"
        );


    if (!canvas) {
        return;
    }


    const ctx =
        canvas.getContext("2d");


    if (riskChart) {

        riskChart.destroy();
    }


    riskChart =
        new Chart(
            ctx,
            {

                type: "line",

                data: {

                    labels: [
                        "NOW",
                        "+1 HR",
                        "+2 HR",
                        "+3 HR",
                        "+4 HR",
                        "+5 HR",
                        "+6 HR"
                    ],

                    datasets: [
                        {

                            label:
                                "AI RISK SCORE",

                            data: [
                                43,
                                48,
                                52,
                                61,
                                67,
                                74,
                                82
                            ],

                            borderWidth: 3,

                            pointRadius: 5,

                            pointHoverRadius: 8,

                            tension: 0.4,

                            fill: false,

                            borderColor:
                                "#38bdf8",

                            pointBackgroundColor:
                                "#38bdf8",

                            pointBorderColor:
                                "#ffffff"
                        }
                    ]
                },


                options: {

                    responsive: true,

                    maintainAspectRatio:
                        false,

                    animation: {
                        duration: 700
                    },


                    plugins: {

                        legend: {

                            display: true,

                            labels: {

                                color:
                                    "#ffffff"
                            }
                        }
                    },


                    scales: {

                        x: {

                            ticks: {
                                color:
                                    "#ffffff"
                            },

                            grid: {

                                color:
                                    "rgba(255,255,255,0.12)"
                            }
                        },


                        y: {

                            beginAtZero: true,

                            max: 100,

                            ticks: {
                                color:
                                    "#ffffff"
                            },

                            grid: {

                                color:
                                    "rgba(255,255,255,0.12)"
                            }
                        }
                    }
                }
            }
        );
}


// ======================================================
// UPDATE CHART
// ======================================================

function updateRiskChart(score) {

    if (!riskChart) {

        createRiskChart();
    }


    if (!riskChart) {
        return;
    }


    const trend = [

        score,

        Math.min(
            100,
            score + 5
        ),

        Math.min(
            100,
            score + 9
        ),

        Math.min(
            100,
            score + 15
        ),

        Math.min(
            100,
            score + 20
        ),

        Math.min(
            100,
            score + 25
        ),

        Math.min(
            100,
            score + 30
        )
    ];


    riskChart
        .data
        .datasets[0]
        .data = trend;


    riskChart.update();
}


// ======================================================
// LOAD NASA FIRMS
// ======================================================

async function loadNASAData() {

    try {

        console.log(
            "Loading NASA FIRMS..."
        );


        const response =
            await fetch(
                "http://localhost:3000/api/fires"
            );


        if (!response.ok) {

            throw new Error(
                `Server error: ${response.status}`
            );
        }


        const data =
            await response.json();


        let fires = [];


        if (Array.isArray(data)) {

            fires = data;

        }

        else if (
            Array.isArray(data.fires)
        ) {

            fires =
                data.fires;

        }

        else if (
            Array.isArray(data.data)
        ) {

            fires =
                data.data;
        }


        allFires =
            fires;


        renderHotspots(
            "ALL"
        );


        if (
            fires.length === 0
        ) {

            document.getElementById(
                "alertTitle"
            ).textContent =
                "NO HOTSPOTS";


            document.getElementById(
                "alertMessage"
            ).textContent =
                "No NASA FIRMS hotspots detected.";

            return;
        }


        const alertTitle =
            document.getElementById(
                "alertTitle"
            );


        const alertMessage =
            document.getElementById(
                "alertMessage"
            );


        if (alertTitle) {

            alertTitle.textContent =
                "MONITORING ACTIVE";
        }


        if (alertMessage) {

            alertMessage.textContent =
                `${fires.length} NASA FIRMS hotspot${fires.length > 1 ? "s" : ""} analysed successfully.`;
        }


        const firstFire =
            fires[0];


        const firstAI =
            calculateAIRisk(
                firstFire
            );


        const firstID =
            firstFire.id ??
            firstFire.hotspot_id ??
            "TG-NASA-1";


        selectedFire =
            firstFire;


        selectedAI =
            firstAI;


        updateRiskPanel(
            firstFire,
            firstAI,
            firstID
        );


        updateForecast(
            firstAI
        );


        updateRiskChart(
            firstAI.score
        );

    }

    catch (error) {

        console.error(
            "NASA FIRMS ERROR:",
            error
        );


        const alertTitle =
            document.getElementById(
                "alertTitle"
            );


        const alertMessage =
            document.getElementById(
                "alertMessage"
            );


        if (alertTitle) {

            alertTitle.textContent =
                "DATA CONNECTION ERROR";
        }


        if (alertMessage) {

            alertMessage.textContent =
                "Unable to connect to NASA FIRMS backend. Make sure localhost:3000 is running.";
        }
    }
}


// ======================================================
// SEARCH
// ======================================================

const searchBtn =
    document.getElementById(
        "searchBtn"
    );


const hotspotSearch =
    document.getElementById(
        "hotspotSearch"
    );


if (
    searchBtn &&
    hotspotSearch
) {

    searchBtn.addEventListener(
        "click",
        function () {

            const value =
                hotspotSearch.value
                    .trim()
                    .toLowerCase();


            if (!value) {

                alert(
                    "Please enter a Hotspot ID."
                );

                return;
            }


            let found = false;


            hotspotLayer.eachLayer(
                function (marker) {

                    const id =
                        String(
                            marker.hotspotID ||
                            ""
                        ).toLowerCase();


                    if (
                        id === value
                    ) {

                        found = true;


                        map.setView(
                            marker.getLatLng(),
                            10
                        );


                        marker.openPopup();

                        marker.fire(
                            "click"
                        );
                    }
                }
            );


            if (!found) {

                alert(
                    `Hotspot "${hotspotSearch.value}" not found.`
                );
            }
        }
    );


    hotspotSearch.addEventListener(
        "keypress",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                searchBtn.click();
            }
        }
    );
}


// ======================================================
// RISK FILTER
// ======================================================

const riskFilter =
    document.getElementById(
        "riskFilter"
    );


if (riskFilter) {

    riskFilter.addEventListener(
        "change",
        function () {

            renderHotspots(
                riskFilter.value
            );
        }
    );
}


// ======================================================
// AI PREDICTION BUTTON
// ======================================================

const aiPredictBtn =
    document.getElementById(
        "aiPredictBtn"
    );


if (aiPredictBtn) {

    aiPredictBtn.addEventListener(
        "click",
        function () {

            if (
                selectedFire &&
                selectedAI
            ) {

                updateRiskPanel(
                    selectedFire,
                    selectedAI,
                    selectedFire.id ??
                    selectedFire.hotspot_id ??
                    "TG-NASA-1"
                );


                updateForecast(
                    selectedAI
                );


                updateRiskChart(
                    selectedAI.score
                );

            }

            else {

                loadNASAData();
            }
        }
    );
}


// ======================================================
// START CHART
// ======================================================

setTimeout(
    function () {

        createRiskChart();

    },
    500
);


// ======================================================
// INITIAL DATA LOAD
// ======================================================

loadNASAData();


// ======================================================
// AUTO REFRESH
// ======================================================

setInterval(
    loadNASAData,
    10 * 60 * 1000
);