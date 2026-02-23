function initializeUpdates() {
    window.open('https://www.ese-llc.com/updates', '_blank', 'noopener,noreferrer');
}

function deinitializeUpdates() {
    // nothing needed
}

// expose globally so toggleable-menu can see it
window.initializeMapHelp = initializeMapHelp;
window.deinitializeMapHelp = deinitializeMapHelp;