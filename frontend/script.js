// MOHAWK MAINLINE OPERATIONS CENTER
// Camera Mapping System




const map = L.map('map', {

    zoomControl: false,

    attributionControl: false

}).setView(

    [43.1000, -75.2300],

    9

);



// Dark tactical map

L.tileLayer(

'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',

{

    maxZoom: 19

}

).addTo(map);


let currentTrainIndex = 0;
let currentFreightIndex = 0;

let allTrains = [];
let allFreightTrains = [];

let showingFreight = false;

// Track the last backend update we received
let lastTrainUpdate = "";
let lastFreightUpdate = "";

// Custom Camera Icon

const cameraIcon = L.divIcon({

    className: "camera-marker",

    html: `
        <div class="camera-symbol">
            📷
        </div>
    `,

    iconSize: [22,22],

    iconAnchor: [11,11]

});

// =====================================
// MAP LEGEND
// =====================================

const mapLegend = L.control({
    position: "bottomleft"
});

mapLegend.onAdd = function () {

    const div = L.DomUtil.create(
        "div",
        "map-legend"
    );

    div.innerHTML = `

        <div class="legend-title">
            LEGEND
        </div>

        <div class="legend-divider"></div>

        <!-- AMTRAK -->

        <div class="legend-item">

            <div class="legend-icon legend-amtrak">
                <span></span>
            </div>

            <div class="legend-text">
                <strong>AMTRAK TRAIN</strong>
                <small>Passenger train</small>
            </div>

        </div>


        <!-- FREIGHT -->

        <div class="legend-item">

            <div class="legend-icon legend-freight">
                <span></span>
            </div>

            <div class="legend-text">
                <strong>FREIGHT TRAIN</strong>
                <small>Freight train</small>
            </div>

        </div>


        <!-- CAMERA -->

        <div class="legend-item">

            <div class="legend-camera">
                📷
            </div>

            <div class="legend-text">
                <strong>TRACKSIDE CAMERA</strong>
                <small>Live camera location</small>
            </div>

        </div>


        <!-- RAILROAD -->

        <div class="legend-item">

            <div class="legend-rail">
                <span></span>
            </div>

            <div class="legend-text">
                <strong>RAILROAD</strong>
                <small>Mohawk Subdivision</small>
            </div>

        </div>

    `;

    // Prevent the legend from interfering with map movement
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);

    return div;
};

mapLegend.addTo(map);

// Live Train Layer

let trainMarkers = [];

const trainLayer = L.layerGroup().addTo(map);
const freightLayer = L.layerGroup().addTo(map);


// Train Icon

function createTrainIcon(type = "amtrak", direction = "E", featured = false){

    const color =
        type === "freight"
            ? "#ff8c00"
            : "#32ff5c";

    const rotation =
        direction === "W"
            ? "180deg"
            : "0deg";

    return L.divIcon({

        className: "train-marker",

        html: `

        <div style="
            position:relative;
            width:34px;
            height:34px;
            transform:rotate(${rotation});
        ">

            ${
                featured ?
                `<div style="
                    position:absolute;
                    left:50%;
                    top:50%;
                    width:34px;
                    height:34px;
                    margin-left:-17px;
                    margin-top:-17px;
                    border:2px solid white;
                    border-radius:50%;
                    box-shadow:0 0 14px white;
                    animation:pulse 1.8s infinite;
                "></div>`
                : ""
            }

            <svg width="34" height="34" viewBox="0 0 32 32">

                <polygon
                    points="6,6 26,16 6,26"
                    fill="${color}"
                    stroke="white"
                    stroke-width="2"/>

            </svg>

        </div>

        `,

        iconSize:[34,34],
        iconAnchor:[17,17]

    });

}



// Camera Locations

const cameras = [

{
    name:"Fairport Camera",
    lat:43.10266298247503,
    lon:-77.44071835473396
},

{
    name:"I-481 Camera",
    lat:43.06338135939698,
    lon:-76.05180088053967
},

{
    name:"Sauquoit Creek Bridge",
    lat:43.11963613995789,
    lon:-75.27999957566468
},

{
    name:"Utica Station Camera",
    lat:43.104343614009146,
    lon:-75.22393708966904
}

];

function distanceMiles(lat1, lon1, lat2, lon2){

    const R = 3958.8;

    const dLat = (lat2-lat1) * Math.PI/180;
    const dLon = (lon2-lon1) * Math.PI/180;

    const a =
        Math.sin(dLat/2)**2 +
        Math.cos(lat1*Math.PI/180) *
        Math.cos(lat2*Math.PI/180) *
        Math.sin(dLon/2)**2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R*c;

}




// Add cameras to map

cameras.forEach(camera => {

 

L.marker(

[camera.lat,camera.lon],

{

icon:cameraIcon

}

)

.addTo(map)

.bindTooltip(

camera.name,

{

direction:"top"

}

);


});

// =====================================
// LOAD MOHAWK SUBDIVISION GEOJSON
// =====================================


fetch("data/mohawk.geojson")

.then(response => response.json())

.then(data => {




// Railroad Glow Layer

const railGlow = L.geoJSON(data, {

    style:function(feature){

        return {

            color:"#006eff",

            weight:3,

            opacity:0.08,

            lineCap:"round",

            lineJoin:"round"

        };

    }

});


railGlow.addTo(map);




// Main Railroad Layer

const railLine = L.geoJSON(data, {

    style:function(feature){

        return {

            color:"#1683ff",

            weight:3,

            opacity:0.85,

            lineCap:"round",

            lineJoin:"round"

        };

    }

});


railLine.addTo(map);


// Automatically frame Fairport → Fonda corridor

map.fitBounds(
    railLine.getBounds(),
    {
        padding:[40,40]
    }
);


});

// =====================================
// CAMERA NETWORK STATUS
// =====================================


const cameraStatus = [

{
name:"Fairport",
status:"ONLINE"
},

{
name:"I-481",
status:"ONLINE"
},

{
name:"Sauquoit",
status:"OFFLINE"
},

{
name:"Utica",
status:"ONLINE"
}

];


console.log(cameraStatus);

// =====================================
// HLS CAMERA SYSTEM
// =====================================


function loadHLSCamera(videoID, streamURL){

    const video = document.getElementById(videoID);


    if(Hls.isSupported()){

        const hls = new Hls({

            lowLatencyMode:true

        });


        hls.loadSource(streamURL);

        hls.attachMedia(video);


    }


    else if(video.canPlayType('application/vnd.apple.mpegurl')){

        video.src = streamURL;

    }

}




loadHLSCamera(
    "i481-camera",
    "https://s51.nysdot.skyvdn.com/rtplive/R3_003/playlist.m3u8"
);



loadHLSCamera(

"sauquoit-camera",

"https://s7.nysdot.skyvdn.com/rtplive/R2_035/playlist.m3u8"

);

async function loadTrainData(){

    try{

        const response = await fetch(
            "data/trains.json?" + Date.now()
        );

        const data = await response.json();

        console.log("Loaded trains:", data.trains);

        allTrains = data.trains || [];

        const container =
            document.getElementById("train-data");

        if(!container){
            return;
        }

        if(allTrains.length === 0){

            container.innerHTML = `
                <div class="train-status">
                    NO ACTIVE TRAINS
                </div>
            `;

            return;
        }

        if(currentTrainIndex >= allTrains.length){
            currentTrainIndex = 0;
        }

        const train =
            allTrains[currentTrainIndex];

        // =================================
        // PROGRESS
        // =================================

        const percent =
            train.totalStops > 0
                ? Math.round(
                    (train.completedStops /
                    train.totalStops) * 100
                )
                : 0;

        // =================================
        // DIRECTION
        // =================================

        const directionText =
            train.direction === "W"
                ? "⬅️ WESTBOUND"
                : "➡️ EASTBOUND";

        // =================================
        // REPORT TIME
        // =================================

        let reportTime = "Unknown";
        let relativeTime = "";

        if(train.spottedOn){

            const reportDate =
                new Date(train.spottedOn * 1000);

            reportTime =
                reportDate.toLocaleTimeString(
                    [],
                    {
                        hour: "numeric",
                        minute: "2-digit"
                    }
                );

            const ageSeconds =
                Math.floor(
                    (Date.now() -
                    reportDate.getTime()) / 1000
                );

            if(ageSeconds < 60){

                relativeTime = "just now";

            }

            else{

                const minutes =
                    Math.floor(ageSeconds / 60);

                if(minutes < 60){

                    relativeTime =
                        `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

                }

                else{

                    const hours =
                        Math.floor(minutes / 60);

                    relativeTime =
                        `${hours} hour${hours === 1 ? "" : "s"} ago`;
                }
            }
        }

        // =================================
        // LOCOMOTIVE
        // =================================

        let locomotiveText = "Unknown";

        if(
            train.locomotives &&
            train.locomotives.length > 0
        ){

            const locomotive =
                train.locomotives[0];

            const parts =
                locomotive.split(" - ");

            if(parts.length >= 2){

                locomotiveText = `
                    ${parts[0]}<br>
                    <span>
                        ${parts.slice(1).join(" - ")}
                    </span>
                `;

            }

            else{

                locomotiveText =
                    locomotive;
            }
        }

        // =================================
        // AMTRAK CARD
        // =================================

        container.innerHTML = `

            <div class="train-card amtrak-card">

                <div class="train-card-content">

                    <div class="train-details">

                        <div class="train-title">
                            🚆 ${train.trainNum}
                        </div>

                        <div class="train-divider"></div>

                        <div class="train-detail">
                            <span>Railroad</span>
                            <strong>
                                ${train.provider}
                            </strong>
                        </div>

                        <div class="train-detail">
                            <span>Direction</span>
                            <strong>
                                ${directionText}
                            </strong>
                        </div>

                        <div class="train-detail">
                            <span>Next Stop</span>
                            <strong>
                                ${train.nextStop || "Unknown"}
                            </strong>
                        </div>

                        <div class="train-detail">
                            <span>Status</span>
                            <strong>
                                ${train.status || "ACTIVE"}
                            </strong>
                        </div>

                        <div class="train-detail">
                            <span>Source</span>

                            <strong>
                                ${train.source || "Live Train Data"}
                            </strong>
                        </div>

                        <!-- ========================= -->
                        <!-- PROGRESS -->
                        <!-- ========================= -->

                        <div class="train-progress-section">

                            <div class="train-progress-header">

                                <span>ROUTE PROGRESS</span>

                                <strong>
                                    ${percent}%
                                </strong>

                            </div>

                            <div class="train-progress-bar">

                                <div
                                    class="train-progress-fill"
                                    style="width:${percent}%"
                                ></div>

                            </div>

                            <div class="train-progress-stops">

                                <span>
                                    ${train.completedStops || 0}
                                    completed
                                </span>

                                <span>
                                    ${train.totalStops || 0}
                                    total stops
                                </span>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        `;

    }

    catch(error){

        console.error(
            "Amtrak card loading error:",
            error
        );

    }

}

async function loadFreightData(){

    try{

        const response = await fetch(
            "data/freight.json?" + Date.now()
        );

        const data = await response.json();

        console.log(
            "Loaded freight:",
            data.trains
        );

        allFreightTrains =
            data.trains || [];


        const container =
            document.getElementById(
                "train-data"
            );


        if(allFreightTrains.length === 0){
            console.log("No heritage trains available.");
            return;
        }


        if(
            currentFreightIndex >=
            allFreightTrains.length
        ){

            currentFreightIndex = 0;

        }


        const train =
            allFreightTrains[
                currentFreightIndex
            ];


        const directionText =
            train.direction === "W"
                ? "⬅ WESTBOUND"
                : train.direction === "E"
                ? "➡ EASTBOUND"
                : train.direction;


        // -----------------------------------------
        // HERITAGE REPORT TIME
        // -----------------------------------------

        let reportTime =
            "Unknown";


        let relativeTime =
            "";


        if(train.spottedOn){

            const reportDate =
                new Date(
                    train.spottedOn * 1000
                );


            reportTime =
                reportDate.toLocaleTimeString(
                    [],
                    {
                        hour: "numeric",
                        minute: "2-digit"
                    }
                );


            const ageSeconds =
                Math.floor(
                    (
                        Date.now()
                        -
                        reportDate.getTime()
                    ) / 1000
                );


            if(ageSeconds < 60){

                relativeTime =
                    "just now";

            }

            else{

                const minutes =
                    Math.floor(
                        ageSeconds / 60
                    );


                if(minutes < 60){

                    relativeTime =
                        `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

                }

                else{

                    const hours =
                        Math.floor(
                            minutes / 60
                        );


                    relativeTime =
                        `${hours} hour${hours === 1 ? "" : "s"} ago`;

                }

            }

        }


        // -----------------------------------------
        // LEAD LOCOMOTIVE
        // -----------------------------------------

        let locomotiveText =
            "Unknown";


        if(
            train.locomotives &&
            train.locomotives.length > 0
        ){

            const locomotive =
                train.locomotives[0];


            const parts =
                locomotive.split(
                    " - "
                );


            if(parts.length >= 2){

                locomotiveText = `

                    ${parts[0]}<br>

                    <span>
                        ${parts.slice(1).join(" - ")}
                    </span>

                `;

            }

            else{

                locomotiveText =
                    locomotive;

            }

        }


        // -----------------------------------------
        // FREIGHT CARD
        // -----------------------------------------

        container.innerHTML = `

            <div class="train-card freight-card">

                <div class="train-title">

                    🚂 ${train.trainNum}

                </div>


                <div class="train-divider"></div>


                <div class="train-detail">

                    <span>
                        Railroad
                    </span>

                    <strong>
                        ${train.provider}
                    </strong>

                </div>


                <div class="train-detail">

                    <span>
                        Direction
                    </span>

                    <strong>
                        ${directionText}
                    </strong>

                </div>


                <div class="train-detail">

                    <span>
                        Current Location
                    </span>

                    <strong>
                        ${train.location}
                    </strong>

                </div>


                <div class="train-detail">

                    <span>
                        Lead Locomotive
                    </span>

                    <strong>
                        ${locomotiveText}
                    </strong>

                </div>


                <div class="train-detail">

                    <span>
                        Last Report
                    </span>

                    <strong>

                        ${reportTime}

                        ${
                            relativeTime
                                ? `<small>(${relativeTime})</small>`
                                : ""
                        }

                    </strong>

                </div>


                <div class="train-detail">

                    <span>
                        Source
                    </span>

                    <strong>
                        ${train.source || "Heritage Units"}
                    </strong>

                </div>

            </div>

        `;

    }

    catch(error){

        console.error(
            "Freight card loading error:",
            error
        );

    }

}

// =====================================
// TRAIN MAP MARKERS
// =====================================

// =====================================
// LIVE TRAIN MAP
// =====================================

async function loadTrains(){

    try{

        const response = await fetch("data/trains.json?t=" + Date.now());

        const data = await response.json();

        trainLayer.clearLayers();

        data.trains.forEach((train,index)=>{

            const marker = L.marker(

                [train.latitude, train.longitude],

                {
                   icon: createTrainIcon(

    train.type,

    train.direction,

    index === currentTrainIndex && !showingFreight

)
                }

            );

            marker.bindTooltip(`

<b>${train.route}</b><br>

Train ${train.trainNum}<br>

${train.status}

`);

            marker.addTo(trainLayer);

            // Find nearest camera

            let nearest = null;
            let nearestDistance = Infinity;

            cameras.forEach(camera=>{

                const d = distanceMiles(

                    train.latitude,
                    train.longitude,

                    camera.lat,
                    camera.lon

                );

                if(d < nearestDistance){

                    nearestDistance = d;
                    nearest = camera;

                }

            });

            if(nearestDistance < 5){

                console.log(

                    `${train.trainNum} near ${nearest.name}`

                );

            }

        });

    }

    catch(error){

        console.log(error);

    }

}

// =====================================
// LIVE FREIGHT TRAIN MAP
// =====================================

async function loadFreightTrains(){

    try{

        const response = await fetch(
            "data/freight.json?t=" + Date.now()
        );

        const data = await response.json();

        freightLayer.clearLayers();

        if(!data.trains || data.trains.length === 0){

            console.log("No freight trains currently detected.");

            return;

        }

        data.trains.forEach((train,index)=>{

        let markerLat = train.latitude;
        let markerLon = train.longitude;

         if (index > 0) {
        markerLat += 0.001;
    }

    const marker = L.marker(

        [
            markerLat,
            markerLon
        ],

        {
            icon: createTrainIcon(
                "freight",
                train.direction,
                index === currentFreightIndex && showingFreight
            )
        }

    );
            // Freight tooltip

            marker.bindTooltip(`

                <b>${train.provider}</b><br>

                ${train.trainNum}<br>

                ${train.direction === "E"
                    ? "EASTBOUND"
                    : train.direction === "W"
                    ? "WESTBOUND"
                    : train.direction
                }<br>

                ${train.location}

            `);


            marker.addTo(freightLayer);

        });

    }

    catch(error){

        console.error(
            "Freight loading error:",
            error
        );

    }

}

// =====================================
// SILENT DATA REFRESH
// =====================================

async function checkForUpdates() {

    try {

        // -----------------------
        // Check Amtrak
        // -----------------------

        const trainResponse = await fetch(
            "data/trains.json?t=" + Date.now(),
            { cache: "no-store" }
        );

        const trainData = await trainResponse.json();

        if (
            trainData.updated &&
            trainData.updated !== lastTrainUpdate
        ) {

            console.log("New Amtrak data detected.");

            lastTrainUpdate = trainData.updated;

            allTrains = trainData.trains || [];

            await loadTrains();

            if (!showingFreight) {
                await loadTrainData();
            }

        }

        // -----------------------
        // Check Freight
        // -----------------------

        const freightResponse = await fetch(
            "data/freight.json?t=" + Date.now(),
            { cache: "no-store" }
        );

        const freightData = await freightResponse.json();

        if (
            freightData.updated &&
            freightData.updated !== lastFreightUpdate
        ) {

            console.log("New Freight data detected.");

            lastFreightUpdate = freightData.updated;

            allFreightTrains = freightData.trains || [];

            await loadFreightTrains();

            if (showingFreight) {
                await loadFreightData();
            }

        }

    }

    catch (err) {

        console.error(
            "Automatic refresh failed:",
            err
        );

    }

}

// =====================================
// ACTIVE TRAIN CARD ROTATION + FADE
// =====================================

async function rotateTrainCard() {
    const container = document.getElementById("train-data");

    if (!container) {
        return;
    }

    container.classList.add("train-card-fade-out");

    await new Promise(resolve => setTimeout(resolve, 500));

    // Amtrak → first Heritage unit
    if (!showingFreight) {
        showingFreight = true;
        currentFreightIndex = 0;

        await loadFreightData();

        // If there are no freight units, move to the next Amtrak train.
        if (allFreightTrains.length === 0) {
            showingFreight = false;

            if (allTrains.length > 0) {
                currentTrainIndex =
                    (currentTrainIndex + 1) % allTrains.length;

                await loadTrainData();
            }
        }
    }

    // Heritage 1 → Heritage 2 → Heritage 3...
    else if (currentFreightIndex < allFreightTrains.length - 1) {
        currentFreightIndex++;
        await loadFreightData();
    }

    // Last Heritage unit → next Amtrak train
    else {
        showingFreight = false;
        currentFreightIndex = 0;

        if (allTrains.length > 0) {
            currentTrainIndex =
                (currentTrainIndex + 1) % allTrains.length;

            await loadTrainData();
        }
    }

    // Redraw marker highlights for the currently displayed train.
    loadTrains();
    loadFreightTrains();

    container.classList.remove("train-card-fade-out");
    container.classList.add("train-card-fade-in");

    setTimeout(() => {
        container.classList.remove("train-card-fade-in");
    }, 500);
}

setInterval(rotateTrainCard, 10000);

// =====================================
// INITIAL TRAIN DATA
// =====================================

showingFreight = false;

loadTrainData();
loadTrains();
loadFreightTrains();

// Remember the first timestamps
fetch("data/trains.json")
    .then(r => r.json())
    .then(d => lastTrainUpdate = d.updated);

fetch("data/freight.json")
    .then(r => r.json())
    .then(d => lastFreightUpdate = d.updated);

// Check for backend updates every minute
setInterval(checkForUpdates, 60000);

// =====================================
// LATENCY
// =====================================

async function updateLatency() {

    const start = performance.now();

    try {

        await fetch(
            "data/trains.json?t=" + Date.now(),
            {
                cache: "no-store"
            }
        );

        const end = performance.now();

        const latency =
            Math.round(end - start);

        const element =
            document.getElementById("latency");

        if (element) {
            element.textContent =
                latency + " ms";
        }

    }

    catch (error) {

        console.error(
            "Latency check failed:",
            error
        );

        const element =
            document.getElementById("latency");

        if (element) {
            element.textContent =
                "OFFLINE";
        }

    }
}

// =====================================
// EASTERN TIME CLOCK
// =====================================

function updateClock(){

    const now = new Date();

    const easternTime = new Intl.DateTimeFormat(
        "en-US",
        {
            timeZone: "America/New_York",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        }
    ).format(now);

    const clock = document.getElementById("clock");

    if(clock){
        clock.textContent = easternTime + " ET";
    }

}

window.addEventListener("load", () => {

    updateLatency();

    setInterval(updateLatency,10000);

    // Start Eastern Time clock
    updateClock();

    setInterval(updateClock,1000);

});