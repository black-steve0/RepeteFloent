// Firebase Auth and Database state
let currentUser = null;
let wordBank = [];
let practiceSuccessCount = 0;
let practiceFailCount = 0;
let practiceTotalAttempts = 0;
let currentPracticeWord = null;
let practiceAttempts = 0;
  

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
// Initialize Firebase Auth listener
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        loadUserWordBank();
    } else {
        window.location.href = 'login.html';
    }
});

// Load user's word bank from Firebase
async function loadUserWordBank() {
    if (!currentUser) return;
    
    try {
        const snapshot = await firebase.database()
            .ref('users/' + currentUser.uid + '/wordBank')
            .once('value');
        
        const data = snapshot.val();
        wordBank = data || [];
        updateWordBankList();
    } catch (error) {
        console.error('Error loading word bank:', error);
        alert('Error loading your word bank. Please try again.');
    }
}

// Save word bank to Firebase
async function saveWordBank() {
    if (!currentUser) return;

    try {
        await firebase.database()
            .ref('users/' + currentUser.uid + '/wordBank')
            .set(wordBank);
    } catch (error) {
        console.error('Error saving word bank:', error);
        alert('Error saving your progress. Please try again.');
    }
}

// Word Bank Display Functions
function displayWordBank() {
    updateWordBankList();
}

function showAddWordForm() {
    document.getElementById('add-word-form').classList.remove('hidden');
    document.getElementById('add-word-button').classList.add('hidden');
}

function hideAddWordForm() {
    document.getElementById('add-word-form').classList.add('hidden');
    document.getElementById('add-word-button').classList.remove('hidden');
    // Clear input fields
    document.getElementById('word-input').value = '';
    document.getElementById('translation-input').value = '';
}

async function addWord() {
    const word = document.getElementById('word-input').value.trim();
    const translation = document.getElementById('translation-input').value.trim();

    if (word && translation) {
        wordBank.push({
            word,
            translation,
            attempts: 0,
            correct: 0,
            lastPracticed: null
        });
        
        await saveWordBank();
        updateWordBankList();
        hideAddWordForm();
    } else {
        alert('Please enter both a word and its translation.');
    }
}

function updateWordBankList() {
    const wordBankList = document.getElementById('word-bank-list');
    wordBankList.innerHTML = '';

    wordBank.forEach((item, index) => {
        const accuracy = item.attempts > 0 
            ? Math.round((item.correct / item.attempts) * 100) 
            : 0;
            
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.innerHTML = `
            <span>${item.word} → ${item.translation}</span>
            <span>Attempts: ${item.attempts}, Correct: ${item.correct} (${accuracy}%)</span>
            <span>Last Practiced: ${item.lastPracticed ? new Date(item.lastPracticed).toLocaleDateString() : 'Never'}</span>
            <button onclick="removeWord(${index})">Remove</button>
        `;
        wordBankList.appendChild(wordItem);
    });
}

async function removeWord(index) {
    wordBank.splice(index, 1);
    await saveWordBank();
    updateWordBankList();
}

// Practice Functions
function startPractice() {
    if (wordBank.length === 0) {
        alert('No words in the word bank to practice.');
        return;
    }

    document.getElementById('bank-display').classList.add('hidden');
    document.getElementById('practice-interface').classList.remove('hidden');
    resetPracticeStats();
    nextPracticeWord();
}

function resetPracticeStats() {
    practiceSuccessCount = 0;
    practiceFailCount = 0;
    practiceTotalAttempts = 0;
    practiceAttempts = 0;
    updatePracticeStats();
    document.getElementById('practice-result').textContent = '';
    document.getElementById('practice-hint-text').textContent = '';
}

function nextPracticeWord() {
    // Choose a word that hasn't been practiced recently
    const now = new Date().getTime();
    const weightedWords = wordBank.map(word => {
        const timeSinceLastPractice = word.lastPracticed 
            ? now - new Date(word.lastPracticed).getTime() 
            : now;
        const weight = timeSinceLastPractice / (word.attempts + 1);
        return { word, weight };
    });

    weightedWords.sort((a, b) => b.weight - a.weight);
    currentPracticeWord = weightedWords[0].word;
    practiceAttempts = 0;

    document.getElementById('practice-text-to-translate').textContent = currentPracticeWord.word;
    document.getElementById('practice-instruction').textContent = 'Translate the following from German to English:';
    document.getElementById('practice-user-input').value = '';
    document.getElementById('practice-submit-button').disabled = true;
}

async function checkPracticeTranslation() {
    const userInput = document.getElementById('practice-user-input').value.trim().toLowerCase();
    const correctTranslation = currentPracticeWord.translation.toLowerCase();

    if (userInput === correctTranslation) {
        handleCorrectAnswer();
    } else {
        handleIncorrectAnswer(correctTranslation);
    }

    currentPracticeWord.attempts++;
    currentPracticeWord.lastPracticed = new Date().toISOString();
    await saveWordBank();
    
    updatePracticeStats();
    if (practiceAttempts >= 2) {
        nextPracticeWord();
    }
}

function handleCorrectAnswer() {
    document.getElementById('last-answer').textContent = currentPracticeWord.translation;
    document.getElementById('last-question').textContent = currentPracticeWord.word;
    practiceTotalAttempts++;
    currentPracticeWord.correct++;
    practiceSuccessCount++;
    document.getElementById('practice-result').textContent = 'Correct!';
    document.getElementById('practice-result').className = 'success';
    document.getElementById('practice-user-input').value = '';
}

function handleIncorrectAnswer(correctTranslation) {
    practiceAttempts++;
    if (practiceAttempts >= 2) {
        document.getElementById('last-answer').textContent = correctTranslation;
        document.getElementById('last-question').textContent = currentPracticeWord.word;
        practiceTotalAttempts++;
        practiceFailCount++;
        document.getElementById('practice-result').textContent = 
            `Incorrect. The correct translation is "${correctTranslation}".`;
        document.getElementById('practice-result').className = 'error';
        document.getElementById('practice-fail-count').textContent = practiceFailCount;
        document.getElementById('practice-progress-background').classList.add('incorrect');
    } else {
        document.getElementById('practice-result').textContent = 'Incorrect. Try again.';
        document.getElementById('practice-result').className = 'error';
    }
    document.getElementById('practice-user-input').value = '';
}

function updatePracticeStats() {
    document.getElementById('practice-success-count').textContent = practiceSuccessCount;
    document.getElementById('practice-fail-count').textContent = practiceFailCount;
    document.getElementById('practice-total-count').textContent = practiceTotalAttempts;
    
    const percentageCorrect = practiceTotalAttempts === 0 ? 0 : 
        Math.round((practiceSuccessCount / practiceTotalAttempts) * 100);
    document.getElementById('practice-percentage-correct').textContent = `${percentageCorrect}%`;
    document.getElementById('practice-progress-bar').style.width = `${percentageCorrect}%`;
}

function returnToWordBank() {
    displayWordBank();
    document.getElementById('bank-display').classList.remove('hidden');
    document.getElementById('practice-interface').classList.add('hidden');
}

function practiceShowHint() {
    if (currentPracticeWord) {
        const hint = `Hint: The translation starts with "${currentPracticeWord.translation[0]}" and is ${currentPracticeWord.translation.length} letters long.`;
        document.getElementById('practice-hint-text').textContent = hint;
    }
}

async function practiceGiveUp() {
    if (currentPracticeWord) {
        practiceFailCount++;
        practiceTotalAttempts++;
        currentPracticeWord.attempts++;
        currentPracticeWord.lastPracticed = new Date().toISOString();
        
        await saveWordBank();
        
        document.getElementById('practice-result').textContent = 
            `The correct translation is "${currentPracticeWord.translation}".`;
        document.getElementById('practice-result').className = 'error';
        updatePracticeStats();
        nextPracticeWord();
    }
}

function practiceinsertLetter(letter) {
    const inputField = document.getElementById("practice-user-input");
    inputField.value += letter;
}

// Event Listeners
document.getElementById('bank-button').addEventListener('click', displayWordBank);

document.getElementById("practice-user-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter" && this.value.trim() !== "") {
        checkPracticeTranslation();
    }
});

document.getElementById("practice-user-input").addEventListener("input", function() {
    document.getElementById("practice-submit-button").disabled = this.value.trim() === "";
});

// Sign out functionality
function signOut() {
    firebase.auth().signOut()
        .then(() => {
            window.location.href = 'login.html';
        })
        .catch((error) => {
            console.error('Error signing out:', error);
        });
}

// Add sign out button to settings menu
const signOutButton = document.createElement('button');
signOutButton.textContent = 'Sign Out';
signOutButton.onclick = signOut;
document.querySelector('#settings-menu').appendChild(signOutButton);