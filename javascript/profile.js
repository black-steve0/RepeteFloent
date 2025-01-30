let userg = null;

async function fetchMilestones() {
  const response = await fetch("json/milestones.json");
  const data = await response.json();
  return data.streak_milestones;
}

function getCurrentMilestone(streak, milestones) {
  let currentMilestone = 0;
  let lastMilestone = 0;
  for (const milestone of milestones) {
    if ((streak <= milestone.days) && (milestone.days > 1)) {
      currentMilestone = milestone;
      break;
    } else {
      lastMilestone = milestone.days;
    }
  }
  return [lastMilestone, currentMilestone];
}

function updateStreakBar(streak, milestone) {
  const progressBar = document.querySelector(".streak-progress");

  const progressPercentage = ((streak-milestone[0]) / (milestone[1].days-milestone[0])) * 100;
  progressBar.style.width = `${progressPercentage}%`;
}

async function initializeStreak() {
  const milestones = await fetchMilestones();
  let streakCount = 0; // Replace with actual streak data from your app

  const currentMilestone = getCurrentMilestone(streakCount, milestones);

  updateStreakBar(streakCount, currentMilestone);

  document.getElementById("increase-streak")?.addEventListener("click", () => {
    streakCount++;
    const newMilestone = getCurrentMilestone(streakCount, milestones);
    updateStreakBar(streakCount, newMilestone);
  });
}

function updateStreakUI(streak) {
  const progressBar = document.querySelector(".streak-progress");
  const streakCountElement = document.querySelector(".streak-count");

  // Update progress bar width (e.g., for a 7-day milestone)
  const progressPercentage = (streak / 7) * 100;
  progressBar.style.width = `${progressPercentage}%`;

  // Update streak count text
  streakCountElement.textContent = `${streak} ${streak > 0 ? '🔥' : '🧊'}`;
}

initializeStreak();

firebase.initializeApp(firebaseConfig);
// Initialize Firebase Auth listener
firebase.auth().onAuthStateChanged((user) => {
  if (user) {

    getStreak(user.uid)
    .then((streakData) => {
      const streak = streakData?.currentStreak || 0;
      updateStreakUI(streak);
    })
    .catch((error) => {
      console.error("Error fetching streak:", error);
    });
    currentUser = user;

    async function loadChart() {
      const snapshot = await firebase.database()
          .ref('users/' + currentUser.uid + '/attempts')
          .once('value');
      const streakData = snapshot.val();
      let count = streakData?.attempts || null;

      const snapshot2 = await firebase.database()
          .ref('users/' + currentUser.uid + '/streak/requirements')
          .once('value');
      const streakData2 = snapshot2.val();
      let practiced = streakData2?.practiced || 0;
      document.getElementById("quest-1").textContent = practiced;
    
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
    
    loadChart()

async function streakUp() {
  if (window.streakAchieved) {
    updateStreak(currentUser)
  }
}
  } else {
      window.location.href = 'index.html';
  }
});

async function updateStreak(userId) {
  const snapshot = await firebase.database()
    .ref('users/' + currentUser.uid + '/streak')
    .once('value');
  const streakData = snapshot.val();

  const today = new Date().toISOString().split("T")[0];
  const lastActivityDate = streakData?.lastActivityDate || null;
  const currentStreak = streakData?.currentStreak || null;

  let newStreak = currentStreak;

  if (lastActivityDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = yesterday.toISOString().split("T")[0];

    if (lastActivityDate === yesterdayFormatted) {
      newStreak = currentStreak + 1;
    } else if (lastActivityDate !== today) {
      newStreak = 1;
    }
  } else {
    // First-time user: start a new streak
    newStreak = 1;
  }

  firebase.database()
    .ref('users/' + currentUser.uid + '/streak/lastActivityDate')
    .set(today.toString());

  
  firebase.database()
    .ref('users/' + currentUser.uid + '/streak/currentStreak')
    .set(newStreak);

    updateStreakUI(newStreak);
  return newStreak;
}

async function getStreak(userId) {
  const userRef = await firebase.database().ref(`users/${userId}/streak`);
  const snapshot = await firebase.database()
    .ref('users/' + currentUser.uid + '/streak')
    .once('value');
  return snapshot.val();
}

// Get the canvas element
const ctx = document.getElementById("pieChart").getContext("2d");

// Create the pie chart
const pieChart = new Chart(ctx, {
  type: "pie", // Specify the chart type
  data: [data[0],data[1],data[2]], // Pass the data
  options: {
    responsive: true, // Make the chart responsive
    plugins: {
      legend: {
        position: "none", // Position of the legend
      },
      title: {
        display: true,
      },
    },
  },
});


