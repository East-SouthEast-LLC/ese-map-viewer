// src/js/components/control/tooltip.js

(function() {
    const toolkitContainer = document.getElementById('geocoder-container');
    if (!toolkitContainer) {
        console.error('Tooltip manager: Toolkit container not found.');
        return;
    }

    // create a single tooltip element to be reused
    const tooltip = document.createElement('div');
    tooltip.id = 'custom-tooltip';
    document.body.appendChild(tooltip);

    let tooltipTimeout;

    // use event delegation to handle mouseover events on tooltip-enabled buttons
    toolkitContainer.addEventListener('mouseover', (e) => {
        // find the closest parent element with a data-tooltip attribute
        const target = e.target.closest('[data-tooltip]');
        if (!target) return;

        // set the tooltip text from the attribute
        tooltip.innerText = target.getAttribute('data-tooltip');
        const rect = target.getBoundingClientRect();

        // position the tooltip horizontally centered with the button
        tooltip.style.left = `${rect.left + window.scrollX + (rect.width / 2)}px`;
        
        // position it initially at the top of the button to calculate its height
        tooltip.style.top = `${rect.top + window.scrollY}px`;

        // use a micro-timeout to allow the browser to render the tooltip and get its height
        // then, correctly position it 5px above the button
        setTimeout(() => {
            tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 5}px`;
        }, 0);

        // clear any previous timeout to prevent flickering
        clearTimeout(tooltipTimeout);

        // show the tooltip after a 500ms delay
        tooltipTimeout = setTimeout(() => {
            tooltip.style.opacity = 1;
        }, 500);
    });

    // use event delegation to handle mouseout events
    toolkitContainer.addEventListener('mouseout', (e) => {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
             // immediately hide the tooltip and clear the timeout
            clearTimeout(tooltipTimeout);
            tooltip.style.opacity = 0;
        }
    });
})();