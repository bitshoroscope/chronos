var chronometerCount = 0;
var chronometers = {};
var maxChronometers = 10;

// Define the lightest and darkest colors in RGB
var lightestColor = { r: 0xcc, g: 0xf9, b: 0xff }; // #ccf9ff
var darkestColor = { r: 0x00, g: 0x80, b: 0xbf }; // #0080bf

// Load state from localStorage
window.onload = function() {
  loadState();
  updateTotalTime();
}

function addChronometer(id, data) {
  chronometerCount++;
  var chronoId = id || 'chrono' + chronometerCount;
  var chronometerDiv = document.createElement('div');
  chronometerDiv.className = 'chronometer';
  chronometerDiv.id = chronoId;

  // Calculate the background color based on the inverted chronometer count
  var ratio = (chronometerCount - 1) / (maxChronometers - 1);
  var r = Math.round(lightestColor.r + (darkestColor.r - lightestColor.r) * ratio);
  var g = Math.round(lightestColor.g + (darkestColor.g - lightestColor.g) * ratio);
  var b = Math.round(lightestColor.b + (darkestColor.b - lightestColor.b) * ratio);
  chronometerDiv.style.backgroundColor = 'rgb(' + r + ', ' + g + ', ' + b + ')';

  var input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Name';
  input.value = data && data.name ? data.name : '';
  input.onchange = function() {
    chronometers[chronoId].name = input.value;
    saveState();
  }

  var timeDisplay = document.createElement('div');
  timeDisplay.className = 'time-display';
  timeDisplay.textContent = '00:00:00.000';

  // Control Buttons with Icons
  var startBtn = document.createElement('button');
  startBtn.innerHTML = '&#9658;'; // Play icon
  startBtn.title = 'Start';
  startBtn.onclick = function() { startChrono(chronoId); };

  var pauseBtn = document.createElement('button');
  pauseBtn.innerHTML = '&#10074;&#10074;'; // Pause icon
  pauseBtn.title = 'Pause';
  pauseBtn.onclick = function() { pauseChrono(chronoId); };

  var resetBtn = document.createElement('button');
  resetBtn.innerHTML = '&#8635;'; // Reset icon
  resetBtn.title = 'Reset';
  resetBtn.onclick = function() { resetChrono(chronoId); };

  chronometerDiv.appendChild(input);
  chronometerDiv.appendChild(timeDisplay);
  chronometerDiv.appendChild(startBtn);
  chronometerDiv.appendChild(pauseBtn);
  chronometerDiv.appendChild(resetBtn);

  document.getElementById('chronometers').appendChild(chronometerDiv);

  chronometers[chronoId] = {
    intervalId: null,
    startTime: null,
    elapsedTime: data && data.elapsedTime ? data.elapsedTime : 0,
    running: data && data.running ? data.running : false,
    name: data && data.name ? data.name : ''
  };

  if (chronometers[chronoId].name) {
    input.value = chronometers[chronoId].name;
  }

  if (chronometers[chronoId].elapsedTime) {
    timeDisplay.textContent = formatTime(chronometers[chronoId].elapsedTime);
  }

  if (chronometers[chronoId].running) {
    startChrono(chronoId);
  }
}

function updateDisplay(chronoId) {
  var chrono = chronometers[chronoId];
  var now = Date.now();
  var diff = chrono.elapsedTime + (now - chrono.startTime);
  var timeDisplay = document.querySelector('#' + chronoId + ' .time-display');
  timeDisplay.textContent = formatTime(diff);
  updateTotalTime();
}

function updateTotalTime() {
  var total = 0;
  for (var id in chronometers) {
    var chrono = chronometers[id];
    if (chrono.running) {
      total += chrono.elapsedTime + (Date.now() - chrono.startTime);
    } else {
      total += chrono.elapsedTime;
    }
  }
  document.getElementById('totalTime').textContent = 'Total Time: ' + formatTime(total);
}

function formatTime(ms) {
  var totalSeconds = Math.floor(ms / 1000);
  var hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  var mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  var secs = String(totalSeconds % 60).padStart(2, '0');
  var millis = String(ms % 1000).padStart(3, '0');
  return hrs + ':' + mins + ':' + secs + '.' + millis;
}

function startChrono(chronoId) {
  // Stop other chronometers
  for (var id in chronometers) {
    if (id !== chronoId && chronometers[id].running) {
      pauseChrono(id);
    }
  }

  var chrono = chronometers[chronoId];
  if (!chrono.running) {
    chrono.startTime = Date.now();
    updateDisplay(chronoId); // Update immediately
    chrono.intervalId = setInterval(function() { updateDisplay(chronoId); }, 50);
    chrono.running = true;
    saveState();
  }
}

function pauseChrono(chronoId) {
  var chrono = chronometers[chronoId];
  if (chrono.running) {
    clearInterval(chrono.intervalId);
    chrono.elapsedTime += Date.now() - chrono.startTime;
    chrono.running = false;
    saveState();
    updateTotalTime();
  }
}

function resetChrono(chronoId) {
  pauseChrono(chronoId);
  chronometers[chronoId].elapsedTime = 0;
  document.querySelector('#' + chronoId + ' .time-display').textContent = '00:00:00.000';
  saveState();
  updateTotalTime();
}

function saveState() {
  var state = [];
  for (var id in chronometers) {
    var chrono = chronometers[id];
    state.push({
      id: id,
      elapsedTime: chrono.elapsedTime,
      running: chrono.running,
      name: chrono.name
    });
  }
  localStorage.setItem('chronometers', JSON.stringify(state));
}

function loadState() {
  var state = JSON.parse(localStorage.getItem('chronometers'));
  if (state && state.length > 0) {
    chronometerCount = 0;
    for (var i = 0; i < state.length; i++) {
      var data = state[i];
      addChronometer(data.id, data);
    }
  }
}

function deleteAllChronos() {
  if (confirm('Are you sure you want to delete all chronometers? This action cannot be undone.')) {
    // Stop all running timers
    for (var id in chronometers) {
      var chrono = chronometers[id];
      if (chrono.running) {
        clearInterval(chrono.intervalId);
      }
    }
    chronometers = {};
    chronometerCount = 0;
    document.getElementById('chronometers').innerHTML = '';
    localStorage.removeItem('chronometers');
    document.getElementById('totalTime').textContent = 'Total Time: 00:00:00.000';
  }
}

function generateGraph() {
  var labels = [];
  var dataValues = [];
  var total = 0;

  for (var id in chronometers) {
    var chrono = chronometers[id];
    var name = chrono.name || 'Unnamed';
    var elapsedTime = chrono.elapsedTime;
    if (chrono.running) {
      elapsedTime += Date.now() - chrono.startTime;
    }
    labels.push(name);
    dataValues.push(elapsedTime);
    total += elapsedTime;
  }

  if (total === 0) {
    alert('No time recorded to generate a graph.');
    return;
  }

  // Open a new window and send data using postMessage
  var chartWindow = window.open('chart.html', 'chartWindow', 'width=800,height=600');
  chartWindow.onload = function() {
    chartWindow.postMessage({
      labels: labels,
      dataValues: dataValues
    }, '*');
  };
}

document.getElementById('addChronoBtn').addEventListener('click', function() {
  addChronometer();
  saveState();
});

document.getElementById('deleteAllBtn').addEventListener('click', deleteAllChronos);
document.getElementById('generateGraphBtn').addEventListener('click', generateGraph);
