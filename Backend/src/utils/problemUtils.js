// Language names the app uses, mapped to Judge0 CE language ids.
// Full list: GET <JUDGE0_URL>/languages
const LANGUAGE_IDS = {
    "c": 50,           // C (GCC 9.2.0)
    "c++": 54,         // C++ (GCC 9.2.0)
    "java": 62,        // Java (OpenJDK 13.0.1)
    "javascript": 63,  // JavaScript (Node.js 12.14.0)
    "python": 71       // Python (3.8.1)
};

// The editor sends "cpp", "js" and "py"; store them under one name each.
const ALIASES = { "cpp": "c++", "js": "javascript", "py": "python", "python3": "python" };

const normalizeLanguage = (lang) => {
    const key = String(lang || "").trim().toLowerCase();
    return ALIASES[key] || key;
};

const getLanguageById = (lang) => LANGUAGE_IDS[normalizeLanguage(lang)];

module.exports = { getLanguageById, normalizeLanguage, LANGUAGE_IDS };
