
// import { streakAchieved } from "./javascript.js";

let currentUser = null;
let wordBank = [];
let practiceSuccessCount = 0;
let practiceFailCount = 0;
let practiceTotalAttempts = 0;
let currentPracticeWord = null;
let practiceAttempts = 0;

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
// Initialize Firebase Auth listener
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        loadUserWordBank();
    } else {
        window.location.href = 'index.html';
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
    currentPracticeWord = weightedWords[getRandomInt(0, wordBank.length)].word;
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
    if (practiceAttempts > 2) {
        nextPracticeWord();
    }
}

function handleNext() {
    updatePracticeStats();
    nextPracticeWord();
}

async function handleCorrectAnswer() {

    updateCorrect()

    streakUp()
    document.getElementById('last-answer').textContent = currentPracticeWord.translation;
    document.getElementById('last-question').textContent = currentPracticeWord.word;
    practiceTotalAttempts++;
    currentPracticeWord.correct++;
    practiceSuccessCount++;
    document.getElementById('practice-result').textContent = 'Correct!';
    document.getElementById('practice-result').className = 'success';
    document.getElementById('practice-user-input').value = '';
    handleNext();
}

async function updateCorrect() {
    const snapshot = await firebase.database()
        .ref('users/' + currentUser.uid + '/attempts')
        .once('value');
    const streakData = snapshot.val();
    let count = streakData?.correctAnswers || null;
    count++
    
    firebase.database().ref('users/' + currentUser.uid + '/attempts/correctAnswers').set(count);
    handleAttempt()
}

async function updateIncorrect() {
    const snapshot = await firebase.database()
        .ref('users/' + currentUser.uid + '/attempts')
        .once('value');
    const streakData = snapshot.val();
    let count = streakData?.incorrectAnswers || null;
    count++

    firebase.database()
        .ref('users/' + currentUser.uid + '/attempts/incorrectAnswers')
        .set(count);
    handleAttempt()
}

async function handleAttempt() {
    const snapshot = await firebase.database()
        .ref('users/' + currentUser.uid + '/attempts')
        .once('value');
    const streakData = snapshot.val();
    let count = streakData?.attempts || null;

    firebase.database()
        .ref('users/' + currentUser.uid + '/attempts/attempts')
        .set(count+1);
    count++;

    const snapshotcorrect = await firebase.database()
        .ref('users/' + currentUser.uid + '/attempts')
        .once('value');
    const streakDatacorrect = snapshotcorrect.val();
    let correct = streakDatacorrect?.correctAnswers || null;

    
    const snapshotincorrect = await firebase.database()
        .ref('users/' + currentUser.uid + '/attempts')
        .once('value');
    const streakDataincorrect = snapshotincorrect.val();
    let incorrect = streakDataincorrect?.incorrectAnswers || null;


    const newData = {
        labels: ["Incorrect", "Correct", "No attempts"],
        datasets: [{
            data: [incorrect, correct, count-correct-incorrect],
            backgroundColor: ["#dc3545", "#28a745", "#666"],
        }],
    };
    
    pieChart.data = newData;

    // Re-render the chart
    pieChart.update({ duration: 0 });
}

async function handleIncorrectAnswer(correctTranslation) {
    practiceAttempts++;
    if (practiceAttempts > 2) {
        updateIncorrect()

        document.getElementById('last-answer').textContent = correctTranslation;
        document.getElementById('last-question').textContent = currentPracticeWord.word;
        practiceTotalAttempts++;
        practiceFailCount++;
        document.getElementById('practice-result').textContent = 
            `Incorrect. The correct translation is "${correctTranslation}".`;
        document.getElementById('practice-result').className = 'error';
        document.getElementById('practice-fail-count').textContent = practiceFailCount;
        document.getElementById('practice-progress-background').classList.add('incorrect');
        handleNext();
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
        handleAttempt()
        practiceFailCount++;
        practiceTotalAttempts++;
        
        // await saveWordBank();
        
        document.getElementById('practice-result').textContent = 
            `The correct translation is "${currentPracticeWord.translation}".`;
        document.getElementById('practice-result').className = 'error';
        
        handleNext()
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
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error('Error signing out:', error);
        });
}

// Add sign out button to settings menu
const signOutButton = document.createElement('button');
signOutButton.textContent = 'Sign Out';
signOutButton.classList.add("sign-out-button")
signOutButton.onclick = signOut;
document.querySelector('#settings-menu').appendChild(signOutButton);


loadUserWordBank();

firebase.initializeApp(firebaseConfig);

// Google Auth Provider
const provider = new firebase.auth.GoogleAuthProvider();

  
  // Function to update the profile button with user data
  function updateProfileButton(user) {
    const userAvatar = document.getElementById("user-avatar");
    const userEmail = document.getElementById("user-email");
  
    if (user.photoURL) {
      userAvatar.src = user.photoURL; // Set the user's profile picture
    }
    if (user.email) {
      userEmail.textContent = user.displayName; // Set the user's email
    }
  }
  
  // Check auth state
  auth.onAuthStateChanged((user) => {
    if (user) {
      updateProfileButton(user); // Update the profile button if the user is already logged in
    }
  });

  async function streakUp() {
    const snapshot = await firebase.database()
    .ref('users/' + currentUser.uid + '/streak/requirements')
    .once('value');
  const data = snapshot.val();

  const today = new Date().toISOString().split("T")[0];
  const lastActivity = data?.lastActivity || null;
  let practiced = data?.practiced || 0;

  if (lastActivity !== today) {
    firebase.database()
        .ref('users/' + currentUser.uid + '/streak/requirements/lastActivity')
        .set(today.toString());
        firebase.database()
        .ref('users/' + currentUser.uid + '/streak/requirements/practiced')
        .set(0);
        practiced = 0;
  }
  practiced++

  firebase.database()
        .ref('users/' + currentUser.uid + '/streak/requirements/practiced')
        .set(practiced);

    document.getElementById("quest-1").textContent = practiced;
    console.log(practiced >= document.getElementById("quest-1-min").textContent)
  if (practiced == parseInt(document.getElementById("quest-1-min").textContent)-1) {
    localStorage.setItem("streakachieved", "true");
  }
}