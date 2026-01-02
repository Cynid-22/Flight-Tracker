/**
 * Map Labels Module
 * Airport label creation and positioning
 */

/**
 * Creates HTML content for InfoWindow labels matching the UI theme
 * @param {Object} airport - Airport object
 * @param {string} direction - 'bottom' | 'top' | 'left' | 'right' for notch position
 */
export function createLabelContent(airport, direction = 'bottom') {
    // Notch styles based on direction (notch points toward the airport)
    const notchStyles = {
        bottom: `
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 16px;
            height: 10px;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            clip-path: polygon(50% 100%, 0% 0%, 100% 0%);
            pointer-events: none;
        `,
        top: `
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 16px;
            height: 10px;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
            pointer-events: none;
        `,
        left: `
            position: absolute;
            left: -8px;
            top: 50%;
            transform: translateY(-50%);
            width: 10px;
            height: 16px;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            clip-path: polygon(0% 50%, 100% 0%, 100% 100%);
            pointer-events: none;
        `,
        right: `
            position: absolute;
            right: -8px;
            top: 50%;
            transform: translateY(-50%);
            width: 10px;
            height: 16px;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            clip-path: polygon(100% 50%, 0% 0%, 0% 100%);
            pointer-events: none;
        `
    };

    const marginStyle = {
        bottom: 'margin-bottom: 8px;',
        top: 'margin-top: 8px;',
        left: 'margin-left: 8px;',
        right: 'margin-right: 8px;'
    };

    return `
        <div style="position: relative; ${marginStyle[direction]} pointer-events: none;" tabindex="-1">
            <!-- Pointer notch -->
            <div style="${notchStyles[direction]}"></div>
            <!-- Main content -->
            <div style="
                position: relative;
                background: rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border-radius: 8px;
                padding: 8px 12px;
                color: white;
                font-family: 'Inter', sans-serif;
                font-size: 12px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3);
                pointer-events: none;
            ">
                <strong>${airport.code}</strong> - ${airport.city || airport.name}
            </div>
        </div>
    `;
}

/**
 * Calculate pixel offsets for labels to avoid overlapping
 * @param {Object[]} airports - Array of airport objects
 * @returns {Array<{x: number, y: number, direction: string}>}
 */
export function calculateLabelOffsets(airports) {
    const threshold = 0.8; // Degree threshold for "near"

    return airports.map((airport, i) => {
        // Find neighbors
        const neighbors = airports.filter((other, j) => {
            if (i === j) return false;
            const latDiff = Math.abs(airport.lat - other.lat);
            const lonDiff = Math.abs(airport.lon - other.lon);
            return latDiff < threshold && lonDiff < threshold;
        });

        if (neighbors.length === 0) {
            // No neighbors, default Up
            return { x: 0, y: -5, direction: 'bottom' };
        }

        // Calculate centroid of neighbors
        const avgLat = neighbors.reduce((sum, n) => sum + n.lat, 0) / neighbors.length;
        const avgLon = neighbors.reduce((sum, n) => sum + n.lon, 0) / neighbors.length;

        // Vector from centroid to this airport
        const dLat = airport.lat - avgLat;
        const dLon = airport.lon - avgLon;

        // Determine dominant direction
        if (Math.abs(dLat) > Math.abs(dLon)) {
            // Vertical separation dominant
            if (dLat > 0) {
                return { x: 0, y: -5, direction: 'bottom' };
            } else {
                return { x: 0, y: 60, direction: 'top' };
            }
        } else {
            // Horizontal separation dominant
            if (dLon > 0) {
                return { x: 65, y: 27, direction: 'left' };
            } else {
                return { x: -65, y: 27, direction: 'right' };
            }
        }
    });
}
