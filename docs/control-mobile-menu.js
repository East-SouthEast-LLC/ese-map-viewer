// docs/control-mobile-menu.js

document.addEventListener('DOMContentLoaded', () => {
    const hamburgerButton = document.getElementById('hamburger-button');
    const menu = document.getElementById('menu');
    const mapContainer = document.getElementById('map');

    if (!hamburgerButton || !menu) {
        return;
    }

    // this is the main logic to toggle the menu
    hamburgerButton.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('open');
        hamburgerButton.classList.toggle('active', isOpen);

        menu.style.display = isOpen ? 'flex' : 'none';
    });

    // new: prevent map from "swallowing" the click on the button
    hamburgerButton.addEventListener('mousedown', (e) => {
        e.stopPropagation(); // this stops the click from propagating to the map
    });
    
    // updated: ensures the menu closes correctly when clicking on the map
    mapContainer.addEventListener('click', () => {
        if (menu.classList.contains('open')) {
            menu.classList.remove('open');
            hamburgerButton.classList.remove('active'); // also deactivate button
            menu.style.display = 'none';
        }
    });
});