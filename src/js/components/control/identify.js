document.addEventListener('DOMContentLoaded', () => {
    const identifyButton = document.getElementById('identifyButton');

    if (!identifyButton) {
        console.error("identifyButton not found in DOM");
        return;
    }

    identifyButton.addEventListener('click', () => {
        console.log("button event fired");
    });
});