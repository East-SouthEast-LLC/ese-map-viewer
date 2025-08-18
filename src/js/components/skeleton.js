// src/js/components/skeleton.js

(function() {
    'use strict';

    // since positioning is now handled in css, this script's only job
    // is to manage the 'is-loading' class and the hide function.
    document.body.classList.add('is-loading');
    
    /**
     * initiates the fade-out of the skeleton screen and reveals the main application content.
     */
    function hideSkeleton() {
        const skeleton = document.getElementById('skeleton-loader');
        if (!skeleton) {
            console.error('skeleton loader element not found.');
            document.body.classList.remove('is-loading');
            return;
        }

        skeleton.classList.add('fade-out');

        setTimeout(() => {
            document.body.classList.remove('is-loading');
            skeleton.style.display = 'none';
        }, 500); // this duration should match the css transition time
    }

    // attach the hide function to the window object to make it globally accessible.
    window.hideSkeleton = hideSkeleton;

})();