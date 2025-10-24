/**
 * Helper functie om quote identifiers veilig te maken
 * Escapes dubbelen quotes door die te dubbelen (van " -> "")
 */
function qident(name) {
    return `"${String(name).replace(/"/g, '""')}"`;
}

module.exports = qident;