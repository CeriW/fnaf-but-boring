// TESTING VARIABLES
const nightToSimulate = 6;
let secondLength: number = 200; // How long we want a real life 'second' to be in milliseconds. Used to speed up testing.
const defaultCamera = '4B' as Position;

// TODO - PUT THIS IN A MODULE

type Animatronic = {
  name: string;
  // possibleLocations: string[]; // The cameras where they can be
  startingPosition: Position; // The camera where they start
  currentPosition: Position; // The camera the animatronic is currently at
  movementOpportunityInterval: number; // How often in seconds this animatronic gets a movement opportunity
  aiLevels: [null, number, number, number, number, number, number]; // The starting AI levels on nights 1-6. To make the code more readable, null is at the start so night 1 is at index 1 and so on
  currentCountdown: number; // How many milliseconds they've got left before a special move
};

type Position = '1A' | '1B' | '1C' | '2A' | '2B' | '3' | '4A' | '4B' | '5' | '6' | '7';

const Freddy: Animatronic = {
  name: 'Freddy',
  // possibleLocations: ['1A'],
  startingPosition: '4A',
  currentPosition: '4A',
  movementOpportunityInterval: 3.02,
  aiLevels: [null, 0, 0, 1, Math.ceil(Math.random() * 2), 3, 4], // Freddy randomly starts at 1 or 2 on night 4
  // aiLevels: [null, 0, 0, 1, Math.ceil(Math.random() * 2), 3, 10], // Freddy randomly starts at 1 or 2 on night 4

  currentCountdown: 0,
};

const Chica: Animatronic = {
  name: 'Bonnie',
  // possibleLocations: ['1A'],
  startingPosition: '1A',
  currentPosition: '1A',
  movementOpportunityInterval: 4.97,
  aiLevels: [null, 0, 3, 0, 2, 5, 10],
  currentCountdown: 0,
};

const Bonnie: Animatronic = {
  name: 'Chica',
  // possibleLocations: ['1A', '1B', '7', '6', '4A', '4B'],
  startingPosition: '1A',
  currentPosition: '1A',
  movementOpportunityInterval: 4.98,
  aiLevels: [null, 0, 1, 5, 4, 7, 12],
  currentCountdown: 0,
};

const cameraNames = {
  '1A': 'Show stage',
  '1B': 'Dining area',
  '1C': 'Pirate cove',
  '2A': 'West hall',
  '2B': 'W. hall corner',
  '3': 'Supply closet',
  '4A': 'East hall',
  '4B': 'E. hall corner',
  '5': 'Backstage',
  '6': 'Kitchen',
  '7': 'Restrooms',
};

const paths = {
  assets: '../assets',
};

// import { Animatronic, animatronics } from './animatronics';

/* Time related variables */
let currentFrame: number = 0;
let currentSecond: number = -1; // We start at 1 as 12AM is 89 real seconds long whereas all the others are 90 seconds
let framesPerSecond: number = 60;

/* Time related page elements */
const framesDisplay: HTMLDivElement = document.querySelector('#frames')!;
const secondsDisplay: HTMLDivElement = document.querySelector('#real-time')!;
const inGameHourDisplay: HTMLDivElement = document.querySelector('#in-game-time')!;

// General page elements
const simulator: HTMLDivElement = document.querySelector('#simulator')!;
const sidebar: HTMLDivElement = document.querySelector('#sidebar')!;

// Camera related page elements
const cameraArea: HTMLDivElement = document.querySelector('#camera-display')!;
const cameraButton: HTMLButtonElement = cameraArea.querySelector('#camera-display button')!;
const cameraStatusText: HTMLDivElement = cameraArea.querySelector('#camera-status')!;
const cameraScreen: HTMLImageElement = cameraArea.querySelector('img#camera-screen')!;

/* Player choosable variables */

let user = {
  camerasOn: false,
  currentCamera: defaultCamera,
  leftDoorIsClosed: false,
  rightDoorIsClosed: false,
};

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

  const gameTime = calculateInGameTime();

  inGameHourDisplay.innerHTML = `
    <span class="in-game-hour">${gameTime.hour}</span>
    <span class="in-game-minutes">${String(gameTime.minute).padStart(2, '0')}</span>
    <span class="am-marker">AM</span>
  `;

  // console.log(
  //   `${realMinutes} : ${String(realRemainingSeconds).padStart(2, '0')}  ${JSON.stringify(calculateInGameTime())}`
  // );

  updateFrames();

  if (currentSecond === 535) {
    clearInterval(timeUpdate);
    clearInterval(frameUpdate);
    // clearInterval(freddyInssterval);
  }
};

const calculateInGameTime = () => {
  let inGameMinutes =
    Math.floor(currentSecond * 0.6741573033707866) > 0 ? Math.floor(currentSecond * 0.6741573033707866) : 0;

  return {
    hour: String(Math.floor(inGameMinutes / 60) > 0 ? Math.floor(inGameMinutes / 60) : 12),
    minute: String(inGameMinutes % 60).padStart(2, '0'),
  };
};

// ========================================================================== //
// ANIMATRONIC BASED FUNCTIONS
// ========================================================================== //

const generateAnimatronics = () => {
  [Freddy, Bonnie, Chica].forEach((animatronic: Animatronic) => {
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
      <div class="report-item-container"></div>
    `;
    sidebar.querySelector('#animatronic-report')!.appendChild(animatronicReport);
  });
};

// Freddy always follows a set path, and waits a certain amount of time before actually moving.
const moveFreddy = () => {
  const comparisonNumber = Math.random() * 20;
  const success = Freddy.aiLevels[nightToSimulate] >= comparisonNumber;
  let firstReport = document.querySelector('.animatronic-report[animatronic="Freddy"] .report-item');

  if (user.camerasOn) {
    let reportText = null;

    // NOT AT 4B, CAMERAS ARE UP
    // Freddy fails all movement checks if the cameras are on and he's not at 4B
    if (Freddy.currentPosition !== '4B') {
      reportText = 'Freddy will automatically fail all movement checks while the cameras are up';
    }

    // AT 4B, CAMERAS ARE UP, WE'RE LOOKING AT 4B
    // If Freddy is at 4B, he will only fail camera-related movement checks if you're looking at cam 4B. Other cameras no longer count.
    else if (user.currentCamera === '4B') {
      reportText =
        'Freddy will fail all movement checks while both he and the camera are at 4B. Other cameras no longer count while Freddy is at 4B.';
    }

    // AT 4B, CAMERAS ARE UP, WE'RE NOT LOOKING AT 4B, RIGHT DOOR IS CLOSED
    // Freddy can't get you when the right door is closed regardless of what camera you're looking at.
    // He will return to 4A when this is the case
    else if (user.rightDoorIsClosed) {
      reportText = `Freddy was ready to enter the office but the right door is closed. He will return to Cam 4A (${cameraNames['4A']})`;
      Freddy.currentPosition = '4A';
      moveAnimatronic(Freddy, '4B', '4A');
      // QUESTION - I ASSUME HE DOES A COUNTDOWN AND DOESN'T LEAVE IMMEDIATELY
      // TODO - MAKE HIM WAIT
    }

    // CAMERAS ARE UP, WE'RE NOT LOOKING AT 4B, RIGHT DOOR IS OPEN!!!!
    else if (success) {
      addReport('Freddy', 'FREDDY IS IN THE OFFICE');
      // gameOver();
      // TODO - He doesn't actually get you right away
    }

    // We don't want to flood the report feed. Only report if the top message isn't already this message.
    if (reportText && (!firstReport || firstReport.innerHTML?.indexOf(reportText) < 0)) {
      addReport('Freddy', reportText);
    }
  } else if (success) {
    let waitingTime = 1000 - Freddy.aiLevels[nightToSimulate] * 100; // How many FRAMES to wait before moving
    waitingTime = waitingTime >= 0 ? waitingTime : 0;
    let startingPosition = Freddy.currentPosition;
    let endingPosition = startingPosition;

    // Freddy always follows a set path
    switch (Freddy.currentPosition) {
      case '1A': // Show stage
        endingPosition = '1B';
        break;
      case '1B': // Dining area
        endingPosition = '7';
        break;
      case '7': // Restrooms
        endingPosition = '6';
        break;
      case '6': // Kitchen
        endingPosition = '4A';
        break;
      case '4A': // East hall
        endingPosition = '4B';
        break;
      case '4B': // East hall corner
        endingPosition = '4A';
        break;
      // TODO - outside/inside office?
    }

    // Round to a reasonable number of decimal points for the report, only if it's not an integer.
    let formattedWaitingTime = Number.isInteger(waitingTime / 60) ? waitingTime / 60 : (waitingTime / 60).toFixed(2);

    if (Freddy.currentPosition === '4B' && user.rightDoorIsClosed) {
      addReport(
        'Freddy',
        `
          Freddy has passed his movement check but the right door is closed.
          He will move from 4A (${cameraNames[startingPosition]})
          to 4B (${cameraNames[endingPosition]})
          in ${formattedWaitingTime} seconds 
        `
        //  QUESTION - I'M ASSUMING HE ACTUALLY WAITS ON THIS OCCASION AND DOESN'T MOVE IMMEDIATELY?
      );
    } else {
      addReport(
        'Freddy',
        `
          Freddy has passed his movement check and will move from ${startingPosition} (${cameraNames[startingPosition]})
          to ${endingPosition} (${cameraNames[endingPosition]}) in ${formattedWaitingTime} seconds
          ${generateCalculationText(Freddy, comparisonNumber)}
        `,
        success
      );
    }

    clearInterval(freddyInterval);

    // Freddy waits a certain amount of time between passing his movement check and actually moving.
    // The amount of time is dependent on his AI level.
    Freddy.currentCountdown = (waitingTime / framesPerSecond) * secondLength;

    // Freddy will not move while the cameras are up.
    // If his countdown expires while the cameras are up, he will wait until the cameras are down to move.
    let freddyCountdown = window.setInterval(() => {
      Freddy.currentCountdown--;
      if (Freddy.currentCountdown <= 0 && !user.camerasOn) {
        moveAnimatronic(Freddy, startingPosition, endingPosition);
        freddyInterval = window.setInterval(moveFreddy, secondLength * Freddy.movementOpportunityInterval);
        clearInterval(freddyCountdown);
      } else if (Freddy.currentCountdown <= 0 && user.camerasOn) {
        // We don't want to flood the report with the same message every millisecond.
        // Do this check so the message only appears once.
        let firstReportItem = document.querySelector(
          '.animatronic-report[animatronic="Freddy"] .report-item-container .report-item'
        );

        if (
          firstReportItem &&
          firstReportItem?.innerHTML?.indexOf('Freddy is ready to move but is waiting for the cameras to go down') < 0
        ) {
          addReport('Freddy', 'Freddy is ready to move but is waiting for the cameras to go down', null);
        }
      }
    }, secondLength / framesPerSecond);
  } else {
    addReport(
      'Freddy',
      `Freddy has failed his movement check and remains at cam ${Freddy.currentPosition} (${
        cameraNames[Freddy.currentPosition]
      }) ${generateCalculationText(Freddy, comparisonNumber)}`,
      success
    );
  }
};

const moveAnimatronic = (animatronic: Animatronic, startingPosition: Position, endPosition: Position) => {
  animatronic.currentPosition = endPosition;
  addReport(
    animatronic.name,
    `${animatronic.name} has moved from cam ${startingPosition} (${cameraNames[startingPosition]}) to cam ${endPosition} (${cameraNames[endPosition]})`,
    true
  );
  document.querySelector(`.animatronic#${animatronic.name}`)?.setAttribute('position', endPosition);
};

// ========================================================================== //
// REPORTING
// ========================================================================== //

const addReport = (animatronicName: string, message: string, success: boolean | null = null) => {
  let reportToAddTo = document.querySelector(
    `.animatronic-report[animatronic="${animatronicName}"] .report-item-container`
  );
  const InGameTime = calculateInGameTime();

  let reportType;
  if (reportToAddTo) {
    switch (success) {
      case true:
        reportType = 'success';
        break;
      case false:
        reportType = 'failure';
        break;
      default:
        reportType = 'info';
    }

    reportToAddTo.innerHTML = `

    
    <div class="report-item" type="${reportType}">
    <span class="report-time">${InGameTime.hour}:${InGameTime.minute}AM</span>
    <div class="report-description">${message}</div></div>
    ${reportToAddTo?.innerHTML ?? ''}
  `;
  }
};

const generateCalculationText = (animatronic: Animatronic, scoreToBeat: number) =>
  `<div class="report-calculation">Score to beat: ${Math.ceil(scoreToBeat)} ${animatronic.name}'s AI level: ${
    animatronic.aiLevels[nightToSimulate]
  }</div>`;

// ========================================================================== //
// CAMERAS
// ========================================================================== //

const toggleCameras = () => {
  user.camerasOn = !user.camerasOn;
  document.body.setAttribute('cameras-on', String(user.camerasOn));
  cameraButton.setAttribute('active', String(user.camerasOn));
  cameraStatusText.textContent = user.camerasOn ? 'CAMERAS ARE ON' : 'CAMERAS ARE OFF';
};

const generateCameraButtons = () => {
  for (const key in cameraNames) {
    const myCameraButton = document.createElement('button');
    myCameraButton.classList.add('camera-button');
    if (key === '1A') {
      // 1A is the default camera
      myCameraButton.classList.add('active');
    }
    myCameraButton.textContent = `CAM ${key}`;
    myCameraButton.setAttribute('camera', key);
    myCameraButton.addEventListener('click', () => {
      cameraScreen.src = `${paths.assets}/cameras/${key}-empty.webp`;
      document.querySelectorAll('.camera-button').forEach((btn) => {
        btn.classList.remove('active');
      });
      myCameraButton.classList.add('active');
      user.currentCamera = key as Position;
    });
    simulator.appendChild(myCameraButton);
  }

  cameraScreen.src = `${paths.assets}/cameras/${defaultCamera}-empty.webp`;
};
generateCameraButtons();

// ========================================================================== //
// DOORS
// ========================================================================== //

const initialiseDoors = () => {
  ['left', 'right'].forEach((direction) => {
    // Create door buttons
    let myButton = document.createElement('button');
    myButton.classList.add('door-button');
    myButton.textContent = `Close ${direction} door`;
    myButton.setAttribute('door', direction);
    document.querySelector('#door-controls')?.append(myButton);

    // Make the door buttons toggle the doors
    myButton.addEventListener('click', () => {
      myButton.classList.toggle('active');
      simulator.querySelector(`g#${direction}-door-close-icon`)?.classList.toggle('hidden');

      // Note - I could simplify this using else, but I'm leaving it like this to future proof it
      // Other FNAF games have doors in directions other than left and right.
      if (direction === 'left') {
        user.leftDoorIsClosed = !user.leftDoorIsClosed;
      }

      if (direction === 'right') {
        user.rightDoorIsClosed = !user.rightDoorIsClosed;
      }
    });
  });
};

// ========================================================================== //
// DEATH
// ========================================================================== //

const gameOver = () => {
  alert('You got jumpscared');
};

// ========================================================================== //
// INITIALISE THE PAGE
// ========================================================================== //

const timeUpdate = window.setInterval(updateTime, secondLength); // Update the frames every 1/60th of a second
const frameUpdate = window.setInterval(updateFrames, secondLength / framesPerSecond);
let freddyInterval = window.setInterval(moveFreddy, secondLength * Freddy.movementOpportunityInterval);
// document.body.setAttribute('cameras-on', String(user.camerasOn));

document.body.setAttribute('cameras-on', 'false');

initialiseDoors();

// Since we're starting the time at -1 to accommodate 12AM being 89 seconds long, wait 1 second before starting the movement calculations
// window.setTimeout(() => {
//   freddyInterval = window.setInterval(moveFreddy, secondLength * Freddy.movementOpportunityInterval);
// }, 1000);

generateAnimatronics();

cameraButton.addEventListener('click', toggleCameras);
