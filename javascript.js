let phraseGroups = [];
let totalAttempts = 0;
let currentGroupIndex = 0;
let currentItemIndex = 0;
let successCount = 0;
let failCount = 0;
let attempts = 0;
let isTranslatingToGerman = Math.random() < 0.5;
let failedPhrases = new Set();
let phraseAttempts = {};
loadPhrases();

function switchTest() {
const selectElement = document.getElementById("test-select");
currentGroupIndex = parseInt(selectElement.value); // Update the current group index
resetGame(); // Reset the game for the new group
}

async function loadPhrases() {
try {
    const response = await fetch("phrases.json"); // Path to your JSON file
    if (!response.ok) {
    throw new Error("Failed to load phrases");
    }
    phraseGroups = await response.json();
    populateDropdown();
    displayText();
} catch (error) {
    console.error("Error loading phrases:", error);
    alert("Failed to load phrases. Please check the JSON file.");
}
}

function populateDropdown() {
const selectElement = document.getElementById("test-select");
selectElement.innerHTML = "";
phraseGroups.forEach((group, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = group.title;
    selectElement.appendChild(option);
});
}

// Ensure the input box is always focused unless another input or the iframe is selected
const inputBox = document.getElementById("user-input");

// Focus the input box when the page loads
window.onload = function () {
inputBox.focus();
};

// Refocus the input box when it loses focus, unless another input or the iframe is focused
inputBox.addEventListener("blur", () => {
if (
    document.activeElement.tagName !== "INPUT" &&
    document.activeElement.tagName !== "TEXTAREA" &&
    !document.activeElement.closest("iframe")
) {
    inputBox.focus();
}
});

// Refocus the input box when clicking outside the iframe
document.addEventListener("click", (event) => {
if (
    !event.target.closest("iframe") &&
    document.activeElement.tagName !== "INPUT" &&
    document.activeElement.tagName !== "TEXTAREA"
) {
    inputBox.focus();
}
});

let lastInput = "";

document
.getElementById("user-input")
.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
    event.preventDefault();
    document.getElementById("user-input").value = lastInput;
    }
});

function displayText() {
const group = phraseGroups[currentGroupIndex].phrases;
currentItemIndex = Math.floor(Math.random() * group.length);
const item = group[currentItemIndex];
const textElement = document.getElementById("text-to-translate");
if (isTranslatingToGerman) {
    textElement.textContent = item.translation;
    document.getElementById(
    "instruction"
    ).textContent = `Translate the following from ${item.to} to ${item.from}`;
} else {
    textElement.textContent = item.text;
    document.getElementById(
    "instruction"
    ).textContent = `Translate the following from ${item.from} to ${item.to}`;
}

document.getElementById("context").textContent = item.additional;

const phraseKey = isTranslatingToGerman ? item.text : item.translation;
const incorrectAttempts = phraseAttempts[phraseKey] || 0;
textElement.style.color = `rgb(${Math.min(
    255,
    incorrectAttempts * 50
)}, 0, 0)`;

attempts = 0;
document.getElementById("hint-text").textContent = "";
updateProgressBar();
}

function checkTranslation() {
const userInput = document
    .getElementById("user-input")
    .value.trim()
    .toLowerCase();

lastInput = userInput;
const group = phraseGroups[currentGroupIndex].phrases;
const item = group[currentItemIndex];
const correctTranslation = isTranslatingToGerman
    ? item.text.toLowerCase()
    : item.translation.toLowerCase();

if (userInput === correctTranslation) {
    document.getElementById("last-answer").textContent = correctTranslation;
    document.getElementById("last-question").textContent = document.getElementById("text-to-translate").textContent;
    document.getElementById("result").textContent = "Correct!";
    document.getElementById("result").className = "success";
    successCount++;
    document.getElementById("success-count").textContent = successCount;
    isTranslatingToGerman = Math.random() < 0.5;
    totalAttempts++;
    displayText();
    document.getElementById("total-count").textContent = totalAttempts;
} else {
    const phraseKey = isTranslatingToGerman
    ? item.text
    : item.translation;
    phraseAttempts[phraseKey] = (phraseAttempts[phraseKey] || 0) + 1;
    document.getElementById("fail-count").textContent = failCount;

    if (!failedPhrases.has(phraseKey)) {
    failedPhrases.add(phraseKey);
    }
    if (attempts >= 2) {
    totalAttempts++;
    failCount++;
    document.getElementById(
        "result"
    ).textContent = `Incorrect. The correct translation is "${correctTranslation}".`;
    document.getElementById("result").className = "error";
    document.getElementById("fail-count").textContent = failCount;
    displayText();
    document
        .getElementById("progress-background")
        .classList.add("incorrect");
    document.getElementById("total-count").textContent = totalAttempts;
    } else {
    attempts++;
    document.getElementById("result").textContent =
        "Incorrect. Try again.";
    document.getElementById("result").className = "error";
    }
}

const percentageCorrect =
    totalAttempts === 0
    ? 0
    : Math.round((successCount / totalAttempts) * 100);
document.getElementById(
    "percentage-correct"
).textContent = `${percentageCorrect}%`;

document.getElementById("user-input").value = "";
updateProgressBar();
document.getElementById("submit-button").disabled = true;
}

function giveUp() {
document
    .getElementById("progress-background")
    .classList.add("incorrect");
totalAttempts++;
failCount++;
document.getElementById("fail-count").textContent = failCount;
const group = phraseGroups[currentGroupIndex].phrases;
const item = group[currentItemIndex];
const correctTranslation = isTranslatingToGerman
    ? item.text
    : item.translation;

// Count as a failed attempt
const phraseKey = isTranslatingToGerman ? item.text : item.translation;
if (!failedPhrases.has(phraseKey)) {
    failedPhrases.add(phraseKey);
}

document.getElementById(
    "result"
).textContent = `The correct translation is "${correctTranslation}".`;
document.getElementById("result").className = "error";
isTranslatingToGerman = Math.random() < 0.5;
displayText();

const percentageCorrect =
    totalAttempts === 0
    ? 0
    : Math.round((successCount / totalAttempts) * 100);
document.getElementById(
    "percentage-correct"
).textContent = `${percentageCorrect}%`;

document.getElementById("user-input").value = "";
updateProgressBar();
document.getElementById("submit-button").disabled = true;
document.getElementById("total-count").textContent = totalAttempts;
}

function showHint() {
const group = phraseGroups[currentGroupIndex].phrases;
const item = group[currentItemIndex];
const correctTranslation = isTranslatingToGerman
    ? item.text
    : item.translation;
const hint = `Hint: The translation starts with "${correctTranslation[0]}" and is ${correctTranslation.length} letters long.`;
document.getElementById("hint-text").textContent = hint;
}

function resetGame() {
successCount = 0;
failCount = 0;
totalAttempts = 0;
failedPhrases.clear();
phraseAttempts = {};
document.getElementById("success-count").textContent = successCount;
document.getElementById("fail-count").textContent = failCount;
document.getElementById("result").textContent = "";
document.getElementById("result").className = "";
document.getElementById("hint-text").textContent = "";
document
    .getElementById("progress-background")
    .classList.remove("incorrect");
document.getElementById("percentage-correct").textContent = "0%";
document.getElementById("total-count").textContent = "0";
displayText();
}

function updateProgressBar() {
const percentageCorrect =
    totalAttempts === 0 ? 0 : (successCount / totalAttempts) * 100;
document.getElementById(
    "progress-bar"
).style.width = `${percentageCorrect}%`;
}

// Enable/disable submit button based on input
document
.getElementById("user-input")
.addEventListener("input", function () {
    const submitButton = document.getElementById("submit-button");
    submitButton.disabled = this.value.trim() === "";
});

// Allow Enter key to submit the translation
document
.getElementById("user-input")
.addEventListener("keypress", function (event) {
    if (event.key === "Enter" && this.value.trim() !== "") {
    checkTranslation();
    }
});

populateDropdown();

function insertLetter(letter) {
const inputField = document.getElementById("user-input");
inputField.value += letter;
}

document
.getElementById("test-select")
.addEventListener("change", switchTest);

toggleSettings = 1;

document
.getElementById("settings-button")
.addEventListener("click", () => {
    if (toggleSettings) {
    toggleSettings--;
    document.getElementById("main-content").classList.add("hidden");
    document.getElementById("settings-menu").classList.remove("hidden");
    } else {
    toggleSettings++;
    document.getElementById("settings-menu").classList.add("hidden");
    document.getElementById("main-content").classList.remove("hidden");
    }
});

// Dark Mode Toggle
document
.getElementById("dark-mode-toggle")
.addEventListener("change", (event) => {
    document.body.classList.toggle("dark-mode", event.target.checked);
    localStorage.setItem("darkMode", event.target.checked);
});

// Timer Toggle
document
.getElementById("timer-toggle")
.addEventListener("change", (event) => {
    localStorage.setItem("timerEnabled", event.target.checked);
});

// Hint Toggle
document
.getElementById("hint-toggle")
.addEventListener("change", (event) => {
    localStorage.setItem("hintEnabled", event.target.checked);
});

// Load Saved Settings
function loadSettings() {
// Dark Mode
const darkMode = localStorage.getItem("darkMode") === "true";
document.getElementById("dark-mode-toggle").checked = darkMode;
document.body.classList.toggle("dark-mode", darkMode);

// Timer
const timerEnabled = localStorage.getItem("timerEnabled") === "true";
document.getElementById("timer-toggle").checked = timerEnabled;

// Hints
const hintEnabled = localStorage.getItem("hintEnabled") === "true";
document.getElementById("hint-toggle").checked = hintEnabled;
}

// Apply settings on page load
window.onload = function () {
loadSettings();
};




/////////timer ///
//#region 
// Timer Script
let timer;
let timeLeft = 300; // Default timer duration (5 minutes)
let totalTime = 300; // Total duration for progress bar
let isRunning = false;
let isPaused = false;
let isStopwatchMode = false; // Default to countdown mode

// DOM Elements
const timerDisplay = document.getElementById('timer-display');
const timerProgress = document.getElementById('timer-progress');
const startButton = document.getElementById('start-timer');
const pauseButton = document.getElementById('pause-timer');
const resetButton = document.getElementById('reset-timer');
const timerDurationInput = document.getElementById('timer-duration');
const modeToggleButton = document.getElementById('mode-toggle');
const timerSound = document.getElementById('timer-sound');

// Update the timer display and progress bar
function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    if (!isStopwatchMode) {
        const progressPercentage = (timeLeft / totalTime) * 100;
        timerProgress.style.width = `${progressPercentage}%`;
    }
}

// Start the timer
function startTimer() {
    if (!isRunning) {
        isRunning = true;
        isPaused = false;
        pauseButton.textContent = "Pause";
        timer = setInterval(() => {
            if (isStopwatchMode) {
                timeLeft++; // Count up in stopwatch mode
            } else {
                timeLeft--; // Count down in timer mode
            }
            updateTimerDisplay();
            if (!isStopwatchMode && timeLeft <= 0) {
                clearInterval(timer);
                isRunning = false;
                timerSound.play(); // Play sound
                alert("Time's up! Great job!");
            }
        }, 1000);
    }
}

// Pause or continue the timer
function pauseTimer() {
    if (isRunning) {
        clearInterval(timer);
        isRunning = false;
        isPaused = true;
        pauseButton.textContent = "Continue";
    } else if (isPaused) {
        startTimer();
    }
}

// Reset the timer
function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    isPaused = false;
    pauseButton.textContent = "Pause";
    if (!isStopwatchMode) {
        timeLeft = totalTime; // Reset to the total duration
    } else {
        timeLeft = 0; // Reset to 0 in stopwatch mode
    }
    updateTimerDisplay();
}

// Set the timer duration
function setTimerDuration(durationInSeconds) {
    if (!isStopwatchMode) {
        totalTime = durationInSeconds;
        timeLeft = durationInSeconds;
        updateTimerDisplay();
    }
}

// Toggle between timer and stopwatch modes
function toggleMode() {
    isStopwatchMode = !isStopwatchMode;
    resetTimer(); // Reset the timer when switching modes
    if (isStopwatchMode) {
        modeToggleButton.textContent = "Countdown";
        timerProgress.style.width = "0%"; // Hide progress bar in stopwatch mode
    } else {
        modeToggleButton.textContent = "Stopwatch";
        setTimerDuration(totalTime); // Reset to the total duration in timer mode
    }
}

// Event Listeners
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);
modeToggleButton.addEventListener('click', toggleMode);

// Initialize the timer with a default duration
setTimerDuration(totalTime);