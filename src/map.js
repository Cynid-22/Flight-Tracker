
let map;
let flightPath = null;
let markers = [];

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
        center: { lat: 20, lng: 0 },
        zoom: 2,
        mapId: "DEMO_MAP_ID",
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        tilt: 45,
        disableDefaultUI: true,
        rotateControl: true,
        zoomControl: true,
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
}

export function drawPath(originAirport, destAirport) {
    if (!map) return;

    // Clear previous
    if (flightPath) flightPath.setMap(null);
    markers.forEach(m => m.setMap(null));
    markers = [];

    const origin = { lat: originAirport.lat, lng: originAirport.lon };
    const dest = { lat: destAirport.lat, lng: destAirport.lon };

    // Draw Polyline (Geodesic)
    flightPath = new google.maps.Polyline({
        path: [origin, dest],
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2,
        map: map,
    });

    // Add Markers
    const originMarker = new google.maps.Marker({
        position: origin,
        map: map,
        title: originAirport.code,
        label: {
            text: originAirport.code,
            color: "white",
            fontWeight: "bold"
        }
    });

    const destMarker = new google.maps.Marker({
        position: dest,
        map: map,
        title: destAirport.code,
        label: {
            text: destAirport.code,
            color: "white",
            fontWeight: "bold"
        }
    });

    markers.push(originMarker, destMarker);

    animateCamera(origin, dest);

    // Calculate distance
    const distanceMeters = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(origin),
        new google.maps.LatLng(dest)
    );
    return Math.round(distanceMeters / 1000);
}

/**
 * Calculate the appropriate zoom level to fit bounds in the viewport
 */
function calculateZoomForBounds(bounds, mapDiv) {
    const WORLD_DIM = { height: 256, width: 256 };
    const ZOOM_MAX = 21;

    function latRad(lat) {
        const sin = Math.sin(lat * Math.PI / 180);
        const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    function zoom(mapPx, worldPx, fraction) {
        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    const latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

    let lngDiff = ne.lng() - sw.lng();
    if (lngDiff < 0) {
        lngDiff += 360; // Handle wrap around
    }
    const lngFraction = lngDiff / 360;

    const mapHeight = mapDiv.offsetHeight;
    const mapWidth = mapDiv.offsetWidth;

    // Account for padding (100px on each side)
    const padding = 200;
    const effectiveHeight = mapHeight - padding;
    const effectiveWidth = mapWidth - padding;

    const latZoom = zoom(effectiveHeight, WORLD_DIM.height, latFraction);
    const lngZoom = zoom(effectiveWidth, WORLD_DIM.width, lngFraction);

    return Math.min(latZoom, lngZoom, ZOOM_MAX);
}

function animateCamera(origin, dest) {
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(origin);
    bounds.extend(dest);

    // Add intermediate points for geodesic curve
    const originLatLng = new google.maps.LatLng(origin);
    const destLatLng = new google.maps.LatLng(dest);
    if (google.maps.geometry && google.maps.geometry.spherical) {
        [0.25, 0.5, 0.75].forEach(frac => {
            bounds.extend(google.maps.geometry.spherical.interpolate(originLatLng, destLatLng, frac));
        });
    }

    // Capture START State
    const startState = {
        center: map.getCenter(),
        zoom: map.getZoom(),
        tilt: map.getTilt(),
        heading: map.getHeading()
    };

    // Calculate TARGET State mathematically (no map movement!)
    const targetCenter = bounds.getCenter();
    const mapDiv = map.getDiv();
    const targetZoom = calculateZoomForBounds(bounds, mapDiv);

    const targetState = {
        center: targetCenter,
        zoom: targetZoom,
        tilt: 0,
        heading: 0
    };

    // Animate from START to TARGET
    const startTime = performance.now();
    const duration = 2500;

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Cubic Ease-Out
        const ease = 1 - Math.pow(1 - progress, 3);

        if (progress < 1) {
            const curLat = startState.center.lat() + (targetState.center.lat() - startState.center.lat()) * ease;
            const curLng = startState.center.lng() + (targetState.center.lng() - startState.center.lng()) * ease;
            const curZoom = startState.zoom + (targetState.zoom - startState.zoom) * ease;
            const curTilt = startState.tilt + (targetState.tilt - startState.tilt) * ease;
            const curHeading = startState.heading + (targetState.heading - startState.heading) * ease;

            map.moveCamera({
                center: { lat: curLat, lng: curLng },
                zoom: curZoom,
                tilt: curTilt,
                heading: curHeading
            });

            requestAnimationFrame(animate);
        } else {
            map.moveCamera(targetState);
        }
    }

    requestAnimationFrame(animate);
}
