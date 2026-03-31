// CATEGORY + UNITS
const categories = {
    Length: ["millimeter", "centimeter", "meter", "kilometer", "inch", "foot", "yard", "mile"],
    Weight: ["milligram", "gram", "kilogram", "pound"],
    Volume: ["milliliter", "liter", "gallon"],
    Temperature: ["celsius", "fahrenheit", "kelvin"]
};

// BASE CONVERSION (to meter / gram / liter)
const conversionRates = {
    // Length (meter base)
    millimeter: 0.001,
    centimeter: 0.01,
    meter: 1,
    kilometer: 1000,
    inch: 0.0254,
    foot: 0.3048,
    yard: 0.9144,
    mile: 1609.34,

    // Weight (gram base)
    milligram: 0.001,
    gram: 1,
    kilogram: 1000,
    pound: 453.592,

    // Volume (liter base)
    milliliter: 0.001,
    liter: 1,
    gallon: 3.78541
};

let currentCategory = "Length";
let mode = "convert";

//  CATEGORY SWITCH 
const cards = document.querySelectorAll(".card");

cards.forEach(card => {
    card.addEventListener("click", () => {
        cards.forEach(c => c.classList.remove("active"));
        card.classList.add("active");

        currentCategory = card.innerText.trim();
        updateUnits();
        convert();
    });
});

// MODE SWITCH 
const buttons = document.querySelectorAll(".toggle button");

buttons.forEach(btn => {
    btn.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        mode = btn.innerText.toLowerCase();
        convert();
    });
});

// UPDATE DROPDOWN 
function updateUnits() {
    const from = document.getElementById("fromUnit");
    const to = document.getElementById("toUnit");

    from.innerHTML = "";
    to.innerHTML = "";

    categories[currentCategory].forEach(unit => {
        from.innerHTML += `<option value="${unit}">${capitalize(unit)}</option>`;
        to.innerHTML += `<option value="${unit}">${capitalize(unit)}</option>`;
    });
}

// TEMPERATURE CONVERSION
function convertTemperature(value, from, to) {
    if (from === to) return value;

    // Convert to Celsius first
    let celsius;
    if (from === "fahrenheit") celsius = (value - 32) * 5/9;
    else if (from === "kelvin") celsius = value - 273.15;
    else celsius = value;

    // Convert from Celsius
    if (to === "fahrenheit") return (celsius * 9/5) + 32;
    if (to === "kelvin") return celsius + 273.15;

    return celsius;
}

//  MAIN CONVERT 
function convert() {
    let value = parseFloat(document.getElementById("fromValue").value);
    let fromUnit = document.getElementById("fromUnit").value;
    let toUnit = document.getElementById("toUnit").value;

    if (isNaN(value)) return;

    let result;

    if (currentCategory === "Temperature") {
        result = convertTemperature(value, fromUnit, toUnit);
    } else {
        let baseValue = value * conversionRates[fromUnit];
        result = baseValue / conversionRates[toUnit];
    }

    // COMPARE MODE
    if (mode === "compare") {
        let comparedValue = parseFloat(result.toFixed(4));

        if (value > comparedValue) {
            document.getElementById("toValue").value = "Greater";
        } else if (value < comparedValue) {
            document.getElementById("toValue").value = "Smaller";
        } else {
            document.getElementById("toValue").value = "Equal";
        }
    } else {
        document.getElementById("toValue").value = result.toFixed(4);
    }
}

// SWAP
function swap() {
    let fromUnit = document.getElementById("fromUnit");
    let toUnit = document.getElementById("toUnit");

    let temp = fromUnit.value;
    fromUnit.value = toUnit.value;
    toUnit.value = temp;

    convert();
}

// HELPERS
function capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

// EVENTS 
document.getElementById("fromValue").addEventListener("input", convert);
document.getElementById("fromUnit").addEventListener("change", convert);
document.getElementById("toUnit").addEventListener("change", convert);

// INIT
updateUnits();
convert();