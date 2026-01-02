/**
 * Map Animation Module
 * Camera animation for flight path visualization
 */

import { getMap } from './core.js';

/**
 * Animates the camera to fit the given bounds
 * @param {google.maps.LatLngBounds} bounds
 */
export function animateCamera(bounds) {
    const map = getMap();
    if (!map) return;

    // Capture START State
    const startState = {
        center: map.getCenter(),
        zoom: map.getZoom(),
        tilt: map.getTilt(),
        heading: map.getHeading()
    };

    // Calculate rough diagonal of bounds for padding logic
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    // Calculate rough distance to determine padding
    let lngDiff = Math.abs(ne.lng() - sw.lng());
    if (lngDiff > 180) lngDiff = 360 - lngDiff;
    const latDiff = Math.abs(ne.lat() - sw.lat());
    const roughDistance = Math.sqrt(lngDiff * lngDiff + latDiff * latDiff);

    // Use larger padding to ensure zoom out
    const basePadding = 120;
    const leftPadding = 520;

    // Get target state from fitBounds by applying it and capturing result
    map.fitBounds(bounds, {
        top: basePadding,
        right: basePadding,
        bottom: basePadding,
        left: leftPadding
    });

    // Ensure minimum zoom level of 1.5
    if (map.getZoom() < 1.5) {
        map.setZoom(1.5);
    }

    // Capture the target state that fitBounds calculated
    const targetState = {
        center: map.getCenter(),
        zoom: map.getZoom(),
        tilt: 0,
        heading: 0
    };

    // Reset back to start position for animation
    map.moveCamera({
        center: startState.center,
        zoom: startState.zoom,
        tilt: startState.tilt,
        heading: startState.heading
    });

    // Check magnitude of move
    const startLat = startState.center.lat();
    const startLng = startState.center.lng();
    const targetLat = targetState.center.lat();
    const targetLng = targetState.center.lng();

    let animLngDiff = Math.abs(targetLng - startLng);
    if (animLngDiff > 180) animLngDiff = 360 - animLngDiff;
    const animLatDiff = Math.abs(targetLat - startLat);
    const totalDiff = Math.sqrt(animLngDiff * animLngDiff + animLatDiff * animLatDiff);

    // Use longer duration for large moves (>60 degrees)
    const isLargeMove = totalDiff > 60;

    // Animate from START to TARGET
    const startTime = performance.now();
    const duration = isLargeMove ? 3000 : 2500;

    // Calculate the shortest path for longitude (handle wrap-around at ±180)
    let targetLngForAnim = targetState.center.lng();
    const startLngForAnim = startState.center.lng();
    let lngDiffForAnim = targetLngForAnim - startLngForAnim;

    if (lngDiffForAnim > 180) {
        targetLngForAnim -= 360;
    } else if (lngDiffForAnim < -180) {
        targetLngForAnim += 360;
    }

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Cubic Ease-Out
        const ease = 1 - Math.pow(1 - progress, 3);

        if (progress < 1) {
            const curLat = startState.center.lat() + (targetState.center.lat() - startState.center.lat()) * ease;
            const curLng = startLngForAnim + (targetLngForAnim - startLngForAnim) * ease;
            const curTilt = startState.tilt + (targetState.tilt - startState.tilt) * ease;
            const curHeading = startState.heading + (targetState.heading - startState.heading) * ease;
            const curZoom = startState.zoom + (targetState.zoom - startState.zoom) * ease;

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
