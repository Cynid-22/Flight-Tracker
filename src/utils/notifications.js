/**
 * Notification System
 * Displays toast notifications to the user
 */

export function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;

    // Choose icon/symbol based on type
    let icon = 'ℹ️';
    if (type === 'error') icon = '⚠️';
    if (type === 'success') icon = '✅';

    toast.innerHTML = `<span style="font-size: 1.2em;">${icon}</span><span>${message}</span>`;

    container.appendChild(toast);

    // Auto remove after animation (3s total: 0.3s in + 2.4s wait + 0.3s out)
    setTimeout(() => {
        if (container.contains(toast)) {
            container.removeChild(toast);
        }
    }, 3000);
}
