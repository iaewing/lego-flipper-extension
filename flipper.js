/**
 * contentScript.js
 * Finds strings matching "M" followed by five numeric digits (MXXXXX),
 * reverses the digits, and converts the text node into a clickable link
 * that searches for the reversed number.
 */

(function() {
    const regex = /M(\d{5})/g;

    /**
     * Reverses a string of digits.
     * @param {string} digits The 5-digit string to reverse.
     * @returns {string} The reversed 5-digit string.
     */
    function reverseDigits(digits) {
        return digits.split('').reverse().join('');
    }

    /**
     * Creates a Google search URL for a given query.
     * @param {string} query The search term.
     * @returns {string} The complete search URL.
     */
    function createSearchUrl(query) {
        // Using Google as the default search engine
        return `https://www.lego.com/en-ca/product/${encodeURIComponent(query)}`;
    }

    /**
     * Processes a text node, looking for the MXXXXX pattern.
     * If found, it replaces the text node with a fragment containing
     * the original text and the new search link.
     * @param {Text} node The text node to process.
     */
    function processTextNode(node) {
        const text = node.nodeValue;
        if (!text || !regex.test(text)) {
            return; // Skip if no pattern is found
        }

        // Reset the regex index before a new global search
        regex.lastIndex = 0;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match;

        // Iterate over all matches in the text node
        while ((match = regex.exec(text)) !== null) {
            const fullMatch = match[0]; // e.g., "M12345"
            const digits = match[1];    // e.g., "12345"

            // 1. Append the text *before* the current match
            if (match.index > lastIndex) {
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
            }

            // 2. Reverse the digits
            const reversed = reverseDigits(digits);

            // 3. Create the anchor tag for the search link
            const link = document.createElement('a');
            link.href = createSearchUrl(reversed);
            link.textContent = fullMatch;
            link.target = '_blank'; // Open in a new tab
            link.style.cssText = 'color: #1a0dab; text-decoration: underline; cursor: pointer;'; // Basic link styling

            // 4. Append the link to the fragment
            fragment.appendChild(link);

            // Update the index to start after the current match
            lastIndex = regex.lastIndex;
        }

        // 5. Append any remaining text after the last match
        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }

        // Replace the original text node with the processed fragment
        node.parentNode.replaceChild(fragment, node);
    }

    /**
     * Traverses the DOM to find all text nodes and process them.
     */
    function findAndReplaceStrings() {
        // We use a TreeWalker for efficient DOM traversal
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT, // Only interested in Text nodes
            null,
            false
        );

        let node;
        const textNodesToProcess = [];

        // Collect all text nodes first, as replacing them during traversal
        // can mess up the walker's position.
        while (node = walker.nextNode()) {
            // Filter out script, style, and already-replaced elements
            if (node.parentNode.tagName !== 'SCRIPT' && node.parentNode.tagName !== 'STYLE') {
                textNodesToProcess.push(node);
            }
        }

        // Process the collected nodes
        textNodesToProcess.forEach(processTextNode);
    }

    // Run the main function when the document is fully loaded
    findAndReplaceStrings();

})();