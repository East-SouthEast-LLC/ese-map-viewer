function initializeMapHelp() {
    window.open('https://www.ese-llc.com/maphelp/map-help', '_blank', 'noopener,noreferrer');
}

function deinitializeMapHelp() {
    // nothing needed
}

// expose globally so toggleable-menu can see it
window.initializeMapHelp = initializeMapHelp;
window.deinitializeMapHelp = deinitializeMapHelp;