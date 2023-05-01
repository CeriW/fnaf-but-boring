// TESTING VARIABLES
const nightToSimulate = 5;
let secondLength = 1; // How long we want a real life 'second' to be in milliseconds. Used to speed up testing.
const Freddy = {
    name: 'Freddy',
    possibleLocations: ['1A'],
    startingPosition: '1A',
    currentPosition: '1A',
    movementOpportunityInterval: 3.02,
    aiLevels: [null, 0, 0, 1, Math.ceil(Math.random() * 2), 3, 4], // Freddy randomly starts at 1 or 2 on night 4
};
const Chica = {
    name: 'Bonnie',
    possibleLocations: ['1A'],
    startingPosition: '1A',
    currentPosition: '1A',
    movementOpportunityInterval: 4.97,
    aiLevels: [null, 0, 3, 0, 2, 5, 10],
};
const Bonnie = {
    name: 'Chica',
    possibleLocations: ['1A', '1B', '7', '6', '4A', '4B'],
    startingPosition: '1A',
    currentPosition: '1A',
    movementOpportunityInterval: 4.98,
    aiLevels: [null, 0, 1, 5, 4, 7, 12],
};
// import { Animatronic, animatronics } from './animatronics';
/* Time related variables */
let currentFrame = 0;
let currentSecond = -1; // We start at -1 as 12AM is 89 real seconds long whereas all the others are 90 seconds
let framesPerSecond = 60;
/* Time related page elements */
const framesDisplay = document.querySelector('#frames');
const secondsDisplay = document.querySelector('#real-time');
const inGameHourDisplay = document.querySelector('#in-game-time');
// General page elements
const simulator = document.querySelector('#simulator');
const sidebar = document.querySelector('#sidebar');
// ========================================================================== //
// TIMER BASED FUNCTIONS
// These are split off separately as they each need to update at
// different rates.
// ========================================================================== //
// We are running at 60fps
const updateFrames = () => {
    currentFrame++;
    framesDisplay.textContent = `${currentFrame} frames at ${framesPerSecond}fps`;
};
const updateTime = () => {
    currentSecond++;
    // REAL TIME
    let realMinutes = Math.floor(currentSecond / 60);
    let realRemainingSeconds = currentSecond % 60;
    secondsDisplay.textContent = `
    ${realMinutes} : ${String(realRemainingSeconds).padStart(2, '0')}
  `;
    // IN GAME TIME
    // One in game hour is 90 real-life seconds (with the exception of 12AM which is 89 seconds)
    let inGameMinutes = Math.ceil(currentSecond * 0.666666666667) > 0 ? Math.ceil(currentSecond * 0.666666666667) : 0;
    let inGameHours = Math.floor(inGameMinutes / 60) > 0 ? Math.floor(inGameMinutes / 60) : 12;
    let inGameRemainingMinutes = inGameMinutes % 60;
    inGameHourDisplay.innerHTML = `
    <span class="in-game-hour">${inGameHours}</span>
    <span class="in-game-minutes">${String(inGameRemainingMinutes).padStart(2, '0')}</span>
    <span class="am-marker">AM</span>
  `;
    // console.log(
    //   `Real time: ${realMinutes}:${realRemainingSeconds} (${currentSecond})     In-game time: ${inGameHours}:${String(
    //     inGameRemainingMinutes
    //   ).padStart(2, '0')}`
    // );
    updateFrames();
    if (currentSecond === 539) {
        clearInterval(timeUpdate);
        clearInterval(frameUpdate);
        clearInterval(freddyInterval);
    }
};
// ========================================================================== //
// ANIMATRONIC BASED FUNCTIONS
// ========================================================================== //
const generateAnimatronics = () => {
    [Freddy, Bonnie, Chica].forEach((animatronic) => {
        // Create the icons
        let icon = document.createElement('span');
        icon.classList.add('animatronic');
        icon.setAttribute('id', animatronic.name);
        icon.setAttribute('position', animatronic.startingPosition);
        simulator.appendChild(icon);
        // Create the report
        let animatronicReport = document.createElement('div');
        animatronicReport.classList.add('animatronic-report');
        animatronicReport.setAttribute('animatronic', animatronic.name);
        animatronicReport.innerHTML = `
      ${animatronic.name}<br>
      Starting AI level: ${animatronic.aiLevels[nightToSimulate]}
    `;
        sidebar.querySelector('#animatronic-report').appendChild(animatronicReport);
    });
};
const moveFreddy = () => {
    const success = Freddy.aiLevels[nightToSimulate] >= Math.random() * 20;
    // console.log(success);
    if (success) {
        if (Freddy.currentPosition === '1A') {
            Freddy.currentPosition = '1B';
            moveAnimatronic('Freddy', '1B');
            addReport('Freddy', 'Freddy has passed his AI check and has moved from 1A to 1B', success);
        }
    }
    else {
        addReport('Freddy', `Freddy has failed to move and remains at ${Freddy.currentPosition}`, success);
    }
};
const moveAnimatronic = (name, position) => {
    var _a;
    (_a = document.querySelector(`.animatronic#${name}`)) === null || _a === void 0 ? void 0 : _a.setAttribute('position', position);
};
// ========================================================================== //
// REPORTING
// ========================================================================== //
const addReport = (animatronicName, message, success) => {
    var _a;
    let reportToAddTo = document.querySelector(`.animatronic-report[animatronic="${animatronicName}"]`);
    if (reportToAddTo) {
        reportToAddTo.innerHTML = `

    ${(_a = reportToAddTo === null || reportToAddTo === void 0 ? void 0 : reportToAddTo.innerHTML) !== null && _a !== void 0 ? _a : ''}
    <div class="report-item" type="${success}">${message}</div>
  `;
    }
};
// ========================================================================== //
// INITIALISE THE PAGE
// ========================================================================== //
const timeUpdate = window.setInterval(updateTime, secondLength); // Update the frames every 1/60th of a second
const frameUpdate = window.setInterval(updateFrames, secondLength / framesPerSecond);
const freddyInterval = window.setInterval(moveFreddy, secondLength * Freddy.movementOpportunityInterval);
generateAnimatronics();
export {};
