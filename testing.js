// Word Bank functionality
let wordBank = JSON.parse(localStorage.getItem('wordBank')) || [];

// Function to display the word bank
function displayWordBank() {
    updateWordBankList();
}

// Function to show the add word form
function showAddWordForm() {
    document.getElementById('add-word-form').classList.remove('hidden');
    document.getElementById('add-word-button').classList.add('hidden');
}

// Function to hide the add word form
function hideAddWordForm() {
    document.getElementById('add-word-form').classList.add('hidden');
    document.getElementById('add-word-button').classList.remove('hidden');
}

// Function to add a word to the word bank
function addWord() {
    const word = document.getElementById('word-input').value.trim();
    const translation = document.getElementById('translation-input').value.trim();

    if (word && translation) {
        wordBank.push({ word, translation, attempts: 0, correct: 0 });
        localStorage.setItem('wordBank', JSON.stringify(wordBank));
        updateWordBankList();
        hideAddWordForm();
    } else {
        alert('Please enter both a word and its translation.');
    }
}

// Function to update the word bank list
function updateWordBankList() {
    const wordBankList = document.getElementById('word-bank-list');
    wordBankList.innerHTML = '';

    wordBank.forEach((item, index) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.innerHTML = `
            <span>${item.word} → ${item.translation}</span>
            <span>Attempts: ${item.attempts}, Correct: ${item.correct}</span>
            <button onclick="removeWord(${index})">Remove</button>
        `;
        wordBankList.appendChild(wordItem);
    });
}

// Function to remove a word from the word bank
function removeWord(index) {
    wordBank.splice(index, 1);
    localStorage.setItem('wordBank', JSON.stringify(wordBank));
    updateWordBankList();
}

// Function to start practicing words
// Function to start practicing words
// Function to start practicing words
function startPractice() {
    if (wordBank.length === 0) {
        alert('No words in the word bank to practice.');
        return;
    }

    // Hide the Word Bank display and show the Practice Interface
    document.getElementById('bank-display').classList.add('hidden');
    document.getElementById('practice-interface').classList.remove('hidden');

    // Reset practice stats
    resetPracticeStats();

    // Start the first practice session
    nextPracticeWord();
}

// Function to reset practice stats
function resetPracticeStats() {
    document.getElementById('total-count').textContent = 0;
    document.getElementById('percentage-correct').textContent = '0%';
    document.getElementById('success-count').textContent = 0;
    document.getElementById('fail-count').textContent = 0;
    document.getElementById('progress-bar').style.width = '0%';
    document.getElementById('result').textContent = '';
    document.getElementById('hint-text').textContent = '';
}

// Function to display the next word for practice
function nextPracticeWord() {
    // Filter words that need more practice (e.g., low correct/attempts ratio)
    const wordsToPractice = wordBank.filter(item => item.attempts === 0 || item.correct / item.attempts < 0.5);

    if (wordsToPractice.length === 0) {
        alert('All words have been practiced enough!');
        returnToWordBank();
        return;
    }

    // Randomly select a word to practice
    const randomIndex = Math.floor(Math.random() * wordsToPractice.length);
    const wordToPractice = wordsToPractice[randomIndex];

    // Display the word for translation
    document.getElementById('practice-text-to-translate').textContent = wordToPractice.word;
    document.getElementById('practice-instruction').textContent = `Translate the following from German to English:`;
    document.getElementById('practice-user-input').value = '';
    document.getElementById('practice-submit-button').disabled = true;

    // Update the submit button to handle word bank practice
    document.getElementById('practice-submit-button').onclick = function () {
        checkPracticeTranslation(wordToPractice);
    };
}

// Function to check the user's translation during practice
function checkPracticeTranslation(wordToPractice) {
    const userInput = document.getElementById('practice-user-input').value.trim().toLowerCase();
    const correctTranslation = wordToPractice.translation.toLowerCase();

    // Update total attempts
    const totalAttempts = parseInt(document.getElementById('practice-total-count').textContent) + 1;
    document.getElementById('practice-total-count').textContent = totalAttempts;

    if (userInput === correctTranslation) {
        wordToPractice.correct++;
        document.getElementById('practice-result').textContent = 'Correct!';
        document.getElementById('practice-result').className = 'success';
        document.getElementById('practice-success-count').textContent = parseInt(document.getElementById('success-count').textContent) + 1;
    } else {
        document.getElementById('practice-result').textContent = `Incorrect. The correct translation is "${correctTranslation}".`;
        document.getElementById('practice-result').className = 'error';
        document.getElementById('practice-fail-count').textContent = parseInt(document.getElementById('fail-count').textContent) + 1;
    }

    // Update word attempts
    wordToPractice.attempts++;

    // Save updated word bank to localStorage
    localStorage.setItem('wordBank', JSON.stringify(wordBank));

    // Update progress bar
    const successCount = parseInt(document.getElementById('success-count').textContent);
    const percentageCorrect = (successCount / totalAttempts) * 100;
    document.getElementById('practice-percentage-correct').textContent = `${Math.round(percentageCorrect)}%`;
    document.getElementById('practice-progress-bar').style.width = `${percentageCorrect}%`;

    // Move to the next word
    nextPracticeWord();
}

// Function to return to the Word Bank display
function returnToWordBank() {
    document.getElementById('practice-bank-display').classList.remove('hidden');
    document.getElementById('practice-practice-interface').classList.add('hidden');
}

// Function to show a hint for the current word
function showHint() {
    const wordToPractice = document.getElementById('practice-text-to-translate').textContent;
    const wordData = wordBank.find(item => item.word === wordToPractice);

    if (wordData) {
        const hint = `Hint: The translation starts with "${wordData.translation[0]}" and is ${wordData.translation.length} letters long.`;
        document.getElementById('practice-hint-text').textContent = hint;
    }
}

// Function to reset the current practice session
function resetGame() {
    resetPracticeStats();
    nextPracticeWord();
}

// Function to give up and show the correct translation
function giveUp() {
    const wordToPractice = document.getElementById('practice-text-to-translate').textContent;
    const wordData = wordBank.find(item => item.word === wordToPractice);

    if (wordData) {
        document.getElementById('practice-result').textContent = `The correct translation is "${wordData.translation}".`;
        document.getElementById('practice-result').className = 'error';
        wordData.attempts++;
        localStorage.setItem('wordBank', JSON.stringify(wordBank));
        nextPracticeWord();
    }
}

// Call displayWordBank when the Word Bank tab is clicked
document.getElementById('bank-button').addEventListener('click', displayWordBank);