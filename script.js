document.addEventListener('DOMContentLoaded', () => {
    // Load saved keybinds from localStorage
    document.querySelectorAll('.keybind').forEach(button => {
        const savedKey = localStorage.getItem(button.id);
        const isLocked = localStorage.getItem(button.id + '-locked');
        if (savedKey) {
            button.textContent = savedKey; // Set saved keybind if available
        }
        if (isLocked === 'true') {
            button.classList.add('locked'); // Apply locked class if previously locked
        }
    });

    // Function to remove duplicate keybinds from other buttons
    const removeDuplicateKeybinds = (newKey, currentButtonId) => {
        let foundLocked = false;
        document.querySelectorAll('.keybind').forEach(button => {
            if (button.id !== currentButtonId && button.textContent === newKey) {
                // Check if the button is locked
                if (button.classList.contains('locked')) {
                    foundLocked = true;
                    blinkLockedButton(button); // Blink the locked button
                } else {
                    button.textContent = '';  // Clear the duplicate keybind
                    localStorage.removeItem(button.id);  // Remove from localStorage
                }
            }
        });
        return foundLocked;
    };

    // Function to make the locked button blink for 2 seconds
    const blinkLockedButton = (button) => {
        button.classList.add('blink');  // Add the blinking class
        setTimeout(() => {
            button.classList.remove('blink');  // Remove the blinking class after 2 seconds
        }, 2000);  // Blink for 2 seconds
    };

    // Function to format key combinations, including mouse buttons with modifiers
    const formatKeyCombo = (key, event) => {
        // Check if the key is a number, ensure the number is used, not the shifted character
        if (event.shiftKey && key.match(/[!@#$%^&*()]/)) {
            const shiftNumbers = {
                '!': '1',
                '@': '2',
                '#': '3',
                '$': '4',
                '%': '5',
                '^': '6',
                '&': '7',
                '*': '8',
                '(': '9',
                ')': '0'
            };
            key = shiftNumbers[key] || key; // Replace the shifted character with its number equivalent
        }

        let keyCombo = key;

        // Check if both Ctrl and Alt are pressed and simplify the combo to ignore Alt
        if (event.ctrlKey && event.altKey) {
            keyCombo = 'C' + key;  // Only use Ctrl when both Ctrl and Alt are pressed
        } else {
            // Apply regular key combinations
            if (event.shiftKey) keyCombo = 'S' + keyCombo; // S for Shift
            if (event.ctrlKey) keyCombo = 'C' + keyCombo;  // C for Control
            if (event.altKey) keyCombo = 'A' + keyCombo;   // A for Alt
        }

        return keyCombo;
    };

    // Function to handle mouse buttons and modifiers
    const getMouseButton = (event) => {
        let mouseButton = '';
        if (event.button === 1) mouseButton = 'M3';  // Middle Mouse Button
        if (event.button === 2) return '';           // Ignore Mouse 2 (right-click) for keybinds
        if (event.button === 3) mouseButton = 'M4';  // Mouse 4 (forward button)

        // Format the mouse button with modifiers
        return formatKeyCombo(mouseButton, event);
    };

    // Add event listeners to each button for mouseover
    document.querySelectorAll('.keybind').forEach(button => {
        const handleKeydown = (event) => {
            event.preventDefault();  // Prevent default actions like tab switching

            // If the button is locked, do nothing
            if (button.classList.contains('locked')) {
                return;
            }

            // Handle Escape key to clear the button
            if (event.key === 'Escape') {
                button.textContent = '';  // Clear the button text
                localStorage.removeItem(button.id);  // Remove the keybind from localStorage
                return;  // Stop further execution
            }

            // Handle mouse buttons (Middle click, Mouse 4, Mouse 5)
            let keyCombo = '';
            if (event.type === 'mousedown') {
                keyCombo = getMouseButton(event);
                if (!keyCombo) return;  // Ignore if it's not Mouse 3, 4, or 5
            } else {
                // Handle regular key bindings
                let key = event.key.toUpperCase();

                // Ignore modifier keys alone (Shift, Control, Alt)
                if (key === "SHIFT" || key === "CONTROL" || key === "ALT") {
                    return;
                }

                keyCombo = formatKeyCombo(key, event);
            }

            // Check if this key is locked elsewhere
            const foundLocked = removeDuplicateKeybinds(keyCombo, button.id);

            if (foundLocked) {
                // Do nothing if a locked key was found
                return;
            }

            // Set the keybind for this button
            button.textContent = keyCombo;

            // Save keybind to localStorage
            localStorage.setItem(button.id, keyCombo);

            document.removeEventListener('keydown', handleKeydown);  // Remove event listener
            document.removeEventListener('mousedown', handleKeydown);  // Remove mouse event listener
        };

        button.addEventListener('mouseover', function() {
            // Add the "active" class to show the blue border
            button.classList.add('active');

            // Add event listener for keydown or mouse buttons when the mouse hovers over the button
            window.addEventListener('keydown', handleKeydown);
            window.addEventListener('mousedown', handleKeydown);  // Capture mouse button presses
        });

        // Remove event listeners and "active" class when the mouse leaves the button
        button.addEventListener('mouseout', function() {
            button.classList.remove('active');
            window.removeEventListener('keydown', handleKeydown);  // Remove event listeners when mouse leaves
            window.removeEventListener('mousedown', handleKeydown);
        });

        // Handle mouse wheel event for MWU (mouse wheel up) and MWD (mouse wheel down)
        button.addEventListener('wheel', function(event) {
            // If the button is locked, do nothing
            if (button.classList.contains('locked')) {
                return;
            }

            event.preventDefault();  // Prevent default scrolling behavior

            let keyCombo = '';
            if (event.deltaY < 0) {
                keyCombo = 'MWU';  // Mouse wheel up
            } else if (event.deltaY > 0) {
                keyCombo = 'MWD';  // Mouse wheel down
            }

            // Remove any previous bindings with this key combination
            removeDuplicateKeybinds(keyCombo, button.id);

            // Set the keybind for this button
            button.textContent = keyCombo;

            // Save keybind to localStorage
            localStorage.setItem(button.id, keyCombo);
        });

        // Handle right-click to lock/unlock the button
        button.addEventListener('contextmenu', function(event) {
            event.preventDefault();  // Prevent default right-click context menu

            // Toggle the lock state
            if (button.classList.contains('locked')) {
                button.classList.remove('locked');
                localStorage.removeItem(button.id + '-locked');  // Remove lock state from localStorage
            } else {
                button.classList.add('locked');
                localStorage.setItem(button.id + '-locked', 'true');  // Save lock state to localStorage
            }
        });
    });

    // Clear all keybinds
    const clearAllButton = document.getElementById('clear-all');
    clearAllButton.addEventListener('click', () => {
        document.querySelectorAll('.keybind').forEach(button => {
            if (!button.classList.contains('locked')) {
                button.textContent = '';  // Clear the text on all unlocked buttons
                localStorage.removeItem(button.id);  // Remove the saved keybind from localStorage
            }
        });
    });
});
