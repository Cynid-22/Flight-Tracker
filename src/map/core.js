/**
 * Map Core Module
 * Google Maps initialization and loading
 */

let map = null;

/**
 * Gets the current map instance
 * @returns {google.maps.Map|null}
 */
export function getMap() {
    return map;
}

/**
 * Sets the map instance (used by initMap)
 * @param {google.maps.Map} mapInstance
 */
export function setMap(mapInstance) {
    map = mapInstance;
}

/**
 * Loads the Google Maps API script.
 * @param {string} key API Key
 * @returns {Promise<void>} Resolves when map is ready
 */
export function loadGoogleMapsScript(key) {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
            resolve();
            return;
        }

        window.initFlightMap = function () {
            resolve();
        };

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=initFlightMap&v=beta&libraries=geometry`;
        script.async = true;
        script.defer = true;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Initializes the map in the given container.
 * @param {HTMLElement} container 
 */
export function initMap(container) {
    console.log("Initializing 3D Map...");
    map = new google.maps.Map(container, {
        center: { lat: 30, lng: -40 },
        zoom: 3,
        minZoom: 1.5,
        mapId: "DEMO_MAP_ID",
        renderingType: "VECTOR",
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        backgroundColor: "#000000",
        isFractionalZoomEnabled: true,
        tilt: 0,
        disableDefaultUI: true,
        rotateControl: false,
        zoomControl: false,
        restriction: {
            latLngBounds: {
                north: 85,
                south: -85,
                west: -180,
                east: 180
            },
            strictBounds: true,
        },
    });

    // Custom Zoom Controls
    document.getElementById('zoom-in').addEventListener('click', () => {
        map.setZoom(map.getZoom() + 1);
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
        map.setZoom(map.getZoom() - 1);
    });
}
