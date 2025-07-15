// docs/control-mobile-menu.js

document.addEventListener('DOMContentLoaded', () => {
    const hamburgerButton = document.getElementById('hamburger-button');
    const menu = document.getElementById('menu');
    const mapContainer = document.getElementById('map');

    if (!hamburgerButton || !menu || !mapContainer) {
        return;
    }

    // function to position the button relative to the map
    function positionHamburgerButton() {
        const mapRect = mapContainer.getBoundingClientRect();
        
        // calculate position based on map's location and desired offset
        const topPosition = mapRect.top + window.scrollY + 10;
        const leftPosition = mapRect.left + window.scrollX + 10;

        hamburgerButton.style.top = `${topPosition}px`;
        hamburgerButton.style.left = `${leftPosition}px`;
    }

    // position the button on initial load
    positionHamburgerButton();
    // reposition the button if the window is resized
    window.addEventListener('resize', positionHamburgerButton);

    // logic to toggle the menu
    hamburgerButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menu.classList.toggle('open');
        hamburgerButton.classList.toggle('active', isOpen);
    });

    // logic to close the menu when clicking on the map
    mapContainer.addEventListener('click', () => {
        if (menu.classList.contains('open')) {
            menu.classList.remove('open');
            hamburgerButton.classList.remove('active');
        }
    });
});