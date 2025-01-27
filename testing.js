// Word Bank functionality
let wordBank = JSON.parse(localStorage.getItem('wordBank')) || [];
let practiceSuccessCount = 0;
let practiceFailCount = 0;
let practiceTotalAttempts = 0;

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
}

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

function removeWord(index) {
    wordBank.splice(index, 1);
    localStorage.setItem('wordBank', JSON.stringify(wordBank));
    updateWordBankList();
}

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
    document.getElementById('practice-total-count').textContent = '0';
    document.getElementById('practice-percentage-correct').textContent = '0%';
    document.getElementById('practice-success-count').textContent = '0';
    document.getElementById('practice-fail-count').textContent = '0';
    document.getElementById('practice-progress-bar').style.width = '0%';
    document.getElementById('practice-result').textContent = '';
    document.getElementById('practice-hint-text').textContent = '';
}

function nextPracticeWord() {
    const randomIndex = Math.floor(Math.random() * wordBank.length);
    const wordToPractice = wordBank[randomIndex];
    document.getElementById('practice-text-to-translate').textContent = wordToPractice.word;
    document.getElementById('practice-instruction').textContent = `Translate the following from German to English:`;
    document.getElementById('practice-user-input').value = '';
    document.getElementById('practice-submit-button').disabled = true;
}

document.getElementById("practice-user-input").addEventListener("keypress", function (event) {
    if (event.key === "Enter" && this.value.trim() !== "") {
        const activeWord = wordBank.find(item => 
            item.word === document.getElementById('practice-text-to-translate').textContent
        );
        if (activeWord) checkPracticeTranslation(activeWord);
    }
});

document.getElementById("practice-user-input").addEventListener("input", function () {
    document.getElementById("practice-submit-button").disabled = this.value.trim() === "";
});

function checkPracticeTranslation(wordToPractice) {
    const userInput = document.getElementById('practice-user-input').value.trim().toLowerCase();
    const correctTranslation = wordToPractice.translation.toLowerCase();

    if (userInput === correctTranslation) {
        document.getElementById("last-answer").textContent = correctTranslation;
        document.getElementById("last-question").textContent = document.getElementById("practice-text-to-translate").textContent;
        practiceTotalAttempts++;
        wordToPractice.correct++;
        practiceSuccessCount++;
        document.getElementById('practice-result').textContent = 'Correct!';
        document.getElementById('practice-result').className = 'success';
    } else {
        if (attempts >= 2) {
                document.getElementById("last-answer").textContent = correctTranslation
                ? item.text.toLowerCase()
                : item.translation.toLowerCase();
                document.getElementById("last-question").textContent = document.getElementById("practice-text-to-translate").textContent;
                
                practiceTotalAttempts++;
                practiceFailCount++;

                document.getElementById(
                    "practice-result"
                ).textContent = `Incorrect. The correct translation is "${correctTranslation}".`;
                document.getElementById("practice-result").className = "error";
                document.getElementById("practice-fail-count").textContent = practiceFailCount;
                
                displayText();

                document
                    .getElementById("progress-background")
                    .classList.add("incorrect");
                document.getElementById("total-count").textContent = practiceTotalAttempts;
            } else {
                attempts++;
                document.getElementById("practice-result").textContent = "Incorrect. Try again.";
                document.getElementById("practice-result").className = "error";
            }
    }

    wordToPractice.attempts++;
    localStorage.setItem('wordBank', JSON.stringify(wordBank));
    
    updatePracticeStats();
    nextPracticeWord();
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
    displayWordBank()
    document.getElementById('bank-display').classList.remove('hidden');
    document.getElementById('practice-interface').classList.add('hidden');
}

function practiceShowHint() {
    const currentWord = document.getElementById('practice-text-to-translate').textContent;
    const wordData = wordBank.find(item => item.word === currentWord);
    
    if (wordData) {
        const hint = `Hint: The translation starts with "${wordData.translation[0]}" and is ${wordData.translation.length} letters long.`;
        document.getElementById('practice-hint-text').textContent = hint;
    }
}

function practiceGiveUp() {
    const currentWord = document.getElementById('practice-text-to-translate').textContent;
    const wordData = wordBank.find(item => item.word === currentWord);
    
    if (wordData) {
        practiceFailCount++;
        practiceTotalAttempts++;
        wordData.attempts++;
        localStorage.setItem('wordBank', JSON.stringify(wordBank));
        document.getElementById('practice-result').textContent = `The correct translation is "${wordData.translation}".`;
        document.getElementById('practice-result').className = 'error';
        updatePracticeStats();
        nextPracticeWord();
    }
}

function practiceinsertLetter(letter) {
    const inputField = document.getElementById("practice-user-input");
    inputField.value += letter;
}

document.getElementById('bank-button').addEventListener('click', displayWordBank);