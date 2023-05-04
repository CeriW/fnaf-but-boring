// TESTING VARIABLES
const nightToSimulate = 6;
let secondLength: number = 600; // How long we want a real life 'second' to be in milliseconds. Used to speed up testing.
const defaultCamera = '4B' as Camera;

// TODO - PUT THIS IN A MODULE

type MovementCheck = {
  animatronicName: string;
  canMove: boolean;
  scoreToBeat: number;
  aiLevel: number;
};

type Animatronic = {
  name: string;
  // possibleLocations: string[]; // The cameras where they can be
  startingPosition: Camera; // The camera where they start
  currentPosition: Position; // The camera the animatronic is currently at
  subPosition: number; // Used for Foxy. He will almost always be in 1C, but he goes thrsough multiple steps before he's able to leave. -1 is the equivalent of null.
  startingSubPosition: number; // Used for Foxy. The subposition he starts at.
  movementOpportunityInterval: number; // How often in seconds this animatronic gets a movement opportunity
  aiLevels: [null, number, number, number, number, number, number]; // The starting AI levels on nights 1-6. To make the code more readable, null is at the start so night 1 is at index 1 and so on
  currentCountdown: number; // How many milliseconds they've got left before a special move
  pronouns: ['he' | 'she', 'his' | 'her']; // For FNAF 1 this is relatively simple. In other FNAF games the genders of some animatronics are complicated (I'm looking at you, Mangle and 'Trash and the gang'), so this makes for easier forwards compatibility than just checking whether we're dealing with Chica (the only female animatronic in FNAF 1)
};

type Camera = '1A' | '1B' | '1C' | '2A' | '2B' | '2C' | '3' | '4A' | '4B' | '4C' | '5' | '6' | '7';
// Cameras 2C and 4C do not actually exist. I will use these names to denote the areas between cameras 2B/4B and the office.

type Position = Camera | 'office';

const Freddy: Animatronic = {
  name: 'Freddy',
  // possibleLocations: ['1A'],
  startingPosition: '1A',
  currentPosition: '1A',
  movementOpportunityInterval: 3.02,
  // aiLevels: [null, 0, 0, 1, Math.ceil(Math.random() * 2), 3, 4], // Freddy randomly starts at 1 or 2 on night 4
  aiLevels: [null, 0, 0, 1, Math.ceil(Math.random() * 2), 3, 9], // Freddy randomly starts at 1 or 2 on night 4
  currentCountdown: 0,
  pronouns: ['he', 'his'],
  subPosition: -1,
  startingSubPosition: -1,
};

const Chica: Animatronic = {
  name: 'Bonnie',
  // possibleLocations: ['1A'],
  startingPosition: '1A',
  currentPosition: '1A',
  movementOpportunityInterval: 4.97,
  aiLevels: [null, 0, 3, 0, 2, 5, 10],
  currentCountdown: 0,
  pronouns: ['she', 'her'],
  subPosition: -1,
  startingSubPosition: -1,
};

const Bonnie: Animatronic = {
  name: 'Chica',
  // possibleLocations: ['1A', '1B', '7', '6', '4A', '4B'],
  startingPosition: '1A',
  currentPosition: '1A',
  movementOpportunityInterval: 4.98,
  aiLevels: [null, 0, 1, 5, 4, 7, 12],
  currentCountdown: 0,
  pronouns: ['he', 'his'],
  subPosition: -1,
  startingSubPosition: -1,
};

const Foxy: Animatronic = {
  name: 'Foxy',
  startingPosition: '1C',
  currentPosition: '1C',
  subPosition: 0,
  startingSubPosition: 0,
  movementOpportunityInterval: 5.01,
  aiLevels: [null, 0, 1, 2, 6, 5, 16],
  currentCountdown: 0,
  pronouns: ['he', 'his'],
};

const cameraNames = {
  '1A': 'Show stage',
  '1B': 'Dining area',
  '1C': 'Pirate cove',
  '2A': 'West hall',
  '2B': 'W. hall corner',
  '2C': 'Between 2B and office',
  '3': 'Supply closet',
  '4A': 'East hall',
  '4B': 'E. hall corner',
  '4C': 'Between 4B and office',
  '5': 'Backstage',
  '6': 'Kitchen',
  '7': 'Restrooms',
};

const paths = {
  assets: '../assets',
};

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
  [Foxy, Freddy, Bonnie, Chica].forEach((animatronic: Animatronic) => {
    // Create the icons
    let icon = document.createElement('span');
    icon.classList.add('animatronic');
    icon.setAttribute('id', animatronic.name);
    icon.setAttribute('position', animatronic.startingPosition);

    icon.setAttribute('sub-position', animatronic.startingSubPosition.toString() ?? 'none');
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

const makeMovementCheck = (animatronic: Animatronic): MovementCheck => {
  const comparisonNumber = Math.random() * 20;
  return {
    animatronicName: animatronic.name,
    canMove: animatronic.aiLevels[nightToSimulate] >= comparisonNumber,
    scoreToBeat: comparisonNumber,
    aiLevel: animatronic.aiLevels[nightToSimulate],
  };
};

// ========================================================================== //
// FOXY
// ========================================================================== //

const moveFoxy = () => {
  const movementCheck = makeMovementCheck(Foxy);

  // Foxy will fail all movement checks while the cameras are on
  if (user.camerasOn) {
    addReport(Foxy, 'camera auto fail');

    // If Foxy fails a movement check while at 1C, he will not be able to make any more movement checks for a random amount of time between 0.83 and 16.67 seconds
  } else if (!movementCheck.canMove && Foxy.currentPosition === '1C' && Foxy.subPosition < 3) {
    let cooldownInSeconds = Math.random() * (16.67 - 0.83) + 0.83;
    addReport(Foxy, 'foxy failed pirate cove movement check', movementCheck, cooldownInSeconds);
    clearInterval(foxyInterval);
    window.setTimeout(() => {
      foxyInterval = window.setInterval(moveFoxy, secondLength * Foxy.movementOpportunityInterval);
    }, cooldownInSeconds * secondLength);
  } else if (movementCheck.canMove && Foxy.currentPosition === '1C' && Foxy.subPosition < 3) {
    // Foxy needs to make 3 successful movement checks before he is able to leave 1C
    // addReport(Foxy, 'jumpscare');
    Foxy.subPosition++;
    addReport(Foxy, 'foxy successful pirate cove movement check', movementCheck);
    moveAnimatronic(Foxy, '1C', '1C', Foxy.subPosition, false);
  } else {
    addReport(Foxy, 'debug', movementCheck);
  }
};

// ========================================================================== //
// FREDDY
// ========================================================================== //

// Once Freddy is in the office he has a 25% chance of getting you every 1 second while the cameras are down
const makeFreddyJumpscareCheck = () => {
  clearInterval(freddyInterval);
  window.setInterval(() => {
    let comparisonNumber = Math.random();
    let jumpscare = {
      canMove: comparisonNumber > 0.75,
    };

    if (jumpscare.canMove && !user.camerasOn) {
      // gameOver();
      addReport(Freddy, 'jumpscare');
    } else {
      // Freddy is in your office but failed his movement check and was unable to jumpscare you.
      addReport(Freddy, 'freddy office failed movement check', {
        animatronicName: 'Freddy',
        canMove: true,
        scoreToBeat: 0.75 * 100,
        aiLevel: Math.floor(comparisonNumber * 100),
      });
    }
  }, secondLength);
};

// Freddy always follows a set path, and waits a certain amount of time before actually moving.
const moveFreddy = () => {
  const movementCheck = makeMovementCheck(Freddy);

  /*
    Developer note - I originally wrote this with nested if statements, but it got out of hand quite quickly
    trying to keep track of which combinations of factors where going on with each one.
    The if statements below all seem to have a lot of factors, many of which are shared, but this makes
    it much easier to keep track on each one exactly what Freddy should be doing.
  */

  // CAMERAS ON, HE'S NOT AT 4B
  // Freddy will automatically fail all movement checks while the cameras are up
  if (user.camerasOn && Freddy.currentPosition !== '4B') {
    addReport(Freddy, 'camera auto fail');

    // CAMERAS ON, HE'S AT 4B, USER IS LOOKING AT 4B. DOORS DON'T MATTER HERE
    // Freddy will fail all movement checks while both he and the camera are at 4B. Other cameras no longer count while Freddy is at 4B.
  } else if (user.camerasOn && user.currentCamera === '4B') {
    addReport(Freddy, 'freddy and camera at 4B');

    // ✓ CAMERAS ON    ✓ HE'S AT 4B    ✓ USER IS NOT LOOKING AT 4B    ✓ HE WANTS TO ENTER THE OFFICE     X THE RIGHT DOOR IS CLOSED
  } else if (
    user.camerasOn &&
    Freddy.currentPosition === '4B' &&
    user.currentCamera !== '4B' &&
    user.rightDoorIsClosed &&
    movementCheck.canMove
  ) {
    // Freddy can't get you when the right door is closed even if you're not looking at 4B
    // QUESTION - I HAVE ASSUMED HE RETURNS TO 4A WHEN THIS IS THE CASE?
    // QUESTION - DOES HE HAVE TO PASS A MOVEMENT CHECK BEFORE HE MOVES BACK TO 4A?
    // QUESTION - I ASSUME HE DOES A COUNTDOWN AND DOESN'T LEAVE IMMEDIATELY? Because that's not happening right here with this code
    addReport(Freddy, 'freddy right door closed');
    Freddy.currentPosition = '4A';
    moveAnimatronic(Freddy, '4B', '4A');

    // CAMERAS ON, HE'S AT 4B, USER IS NOT LOOKING AT 4B BUT HE'S FAILED HIS MOVEMENT CHECK
  } else if (
    user.camerasOn &&
    Freddy.currentPosition === '4B' &&
    user.currentCamera !== '4B' &&
    !user.rightDoorIsClosed &&
    !movementCheck.canMove
  ) {
    // QUESTION - I ASSUME HE DOESN'T MOVE BACK TO 4A ON THIS OCCASION?

    // Freddy could have entered the office but he failed his movement check. He will continue to wait at Cam 4B
    addReport(Freddy, 'enter office failed movement check', movementCheck);
  } else if (!user.camerasOn && Freddy.currentPosition === '4B' && movementCheck.canMove) {
    // QUESTION - I ASSUME HE DOESN'T MOVE BACK TO 4A ON THIS OCCASION?
    addReport(Freddy, 'enter office cameras off');

    // THE CAMERAS ARE ON, HE'S AT 4B, THE RIGHT DOOR IS OPEN, HE CAN GET INTO THE OFFICE!!!!!
  } else if (user.camerasOn && Freddy.currentPosition === '4B' && !user.rightDoorIsClosed) {
    addReport(Freddy, 'in the office');
    moveAnimatronic(Freddy, '4B', 'office', null, false);
  } else if (Freddy.currentPosition === 'office') {
    makeFreddyJumpscareCheck();
  } else if (movementCheck.canMove) {
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
    }

    // Round to a reasonable number of decimal points for the report, only if it's not an integer.
    let formattedWaitingTime = Number.isInteger(waitingTime / 60) ? waitingTime / 60 : (waitingTime / 60).toFixed(2);

    addReport(Freddy, 'freddy successful movement check', movementCheck, {
      formattedWaitingTime,
      startingPosition,
      endingPosition,
    });

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
        addReport(Freddy, 'waiting for cameras down');
      }
    }, secondLength / framesPerSecond);
  } else {
    addReport(Freddy, 'failed movement check', movementCheck);
  }
};

const moveAnimatronic = (
  animatronic: Animatronic,
  startingPosition: Position,
  endPosition: Position,
  subPosition: number | null = null,
  logThis: boolean = true
) => {
  animatronic.currentPosition = endPosition;

  if (logThis) {
    addReport(animatronic, 'has moved', null, { startingPosition, endPosition });
  }

  document.querySelector(`.animatronic#${animatronic.name}`)?.setAttribute('position', endPosition);
  document
    .querySelector(`.animatronic#${animatronic.name}`)
    ?.setAttribute('sub-position', subPosition?.toString() ?? 'none');
};

// ========================================================================== //
// REPORTING
// ========================================================================== //

type messagingType =
  | 'debug' // Used for debugging purposes to report something, anything
  | 'camera auto fail' // The animatronic automatically fails movement checks when cameras are on
  | 'failed movement check' // Generic failed movement check
  | 'freddy office failed movement check' // Failed movement check while animatronic is in the office
  | 'freddy and camera at 4B' // Freddy auto fails all movement checks while both he and the camera are at 4B
  | 'freddy right door closed'
  | 'enter office failed movement check' // Animatronic could have entered the office but failed their movement check
  | 'enter office cameras off' // Animatronic passed the check to enter the office but couldn't because the cameras were off
  | 'in the office' // Animatronic is in the office
  | 'waiting for cameras down' // Animatronic is ready to move but waiting for the cameras to go down
  | 'jumpscare' // Animatronic successfully achieved a jumpscare
  | 'has moved' // Animatronic is moving
  | 'freddy successful movement check' // Freddy has passed a movement check
  | 'foxy failed pirate cove movement check'
  | 'foxy successful pirate cove movement check'; // Foxy has passed a movement check while at Pirate Cove. Not one where he can leave.

const addReport = (
  animatronic: Animatronic,
  reason: messagingType,
  movementCheck: MovementCheck | null = null,
  additionalInfo: any = null // Some reports need to pass in some additional info. This can take different formats so is allowed to be an 'any' type
) => {
  // Figuring out what the message actually should be
  let message = '';
  let type: 'success' | 'fail' | 'info' = 'info';
  let preventDuplicates = false;
  const stats = movementCheck
    ? `<div class="report-calculation">Score to beat: ${Math.ceil(movementCheck.scoreToBeat)} ${
        animatronic.name
      }'s AI level: ${movementCheck.aiLevel}</div>`
    : '';

  switch (reason) {
    case 'debug':
      message = `Something happened`;
      break;
    case 'camera auto fail':
      message = `${animatronic.name} will automatically fail all movement checks while the cameras are on`;
      type = 'info';
      preventDuplicates = true;
      break;

    case 'failed movement check':
      message = `${animatronic.name} has failed ${animatronic.pronouns[1]} movement check and will remain at ${
        animatronic.currentPosition
      } (${cameraNames[animatronic.currentPosition as Camera]}) ${stats}`;
      type = 'fail';
      break;

    case 'freddy and camera at 4B':
      message = `Freddy will fail all movement checks while both he and the camera are at 4B. Other cameras no longer count while Freddy is at 4B.`;
      preventDuplicates = true;

    case 'freddy right door closed':
      `Freddy was ready to enter your office but the right door was closed. He will return to cam 4A (${cameraNames['4A']})`;
      type = 'fail';
      break;

    case 'freddy office failed movement check':
      message = `Freddy is in your office but failed his movement check and was unable to jumpscare you. 
          <div class="report-calculation">
          Score to beat: ${movementCheck?.scoreToBeat}/100   Freddy's score: ${movementCheck?.aiLevel}
          </div>`;
      type = 'fail';
      break;

    case 'enter office failed movement check':
      message = `${animatronic.name} could have entered the office but ${animatronic.pronouns[0]} failed ${
        animatronic.pronouns[1]
      } movement check. ${
        animatronic.pronouns[0].charAt(0).toUpperCase() + animatronic.pronouns[0].slice(1)
      } will continue to wait at cam ${animatronic.currentPosition} (${
        cameraNames[animatronic.currentPosition as Camera]
      }) ${stats}`;
      break;

    case 'enter office cameras off':
      message = `${animatronic.name} passed ${
        animatronic.pronouns[1]
      } movement check to enter the office but couldn't because the cameras were off. ${
        animatronic.pronouns[0].charAt(0).toUpperCase() + animatronic.pronouns[0].slice(1)
      } will continue to wait at cam ${animatronic.currentPosition} (${
        cameraNames[animatronic.currentPosition as Camera]
      }) ${stats}`;
      break;

    case 'in the office':
      message = `${animatronic.name.toUpperCase()} HAS ENTERED THE OFFICE`;
      type = 'success';
      preventDuplicates = true;
      break;

    case 'waiting for cameras down':
      message = `${animatronic.name} is ready to move but is waiting for the cameras to go down`;
      preventDuplicates = true;
      break;

    case 'freddy successful movement check':
      message = `Freddy has passed his movement check and will move from
      ${additionalInfo.startingPosition} (${cameraNames[additionalInfo.startingPosition as Camera]})
      to ${additionalInfo.endingPosition} (${cameraNames[additionalInfo.endingPosition as Camera]})
      in ${additionalInfo.formattedWaitingTime} seconds
      ${stats}`;
      type = 'success';
      break;

    case 'has moved':
      message = `${animatronic.name} has moved from cam ${additionalInfo.startingPosition} (${
        cameraNames[additionalInfo.startingPosition as Camera]
      }) to cam ${additionalInfo.endPosition} (${cameraNames[additionalInfo.endPosition as Camera]})`;
      type = 'success';
      break;

    case 'foxy successful pirate cove movement check':
      const stepsRemaining = 4 - Foxy.subPosition;
      let stepsPlural = stepsRemaining > 1 ? 'steps' : 'step';
      message = `Foxy has made a successful movement check while at 1C (${cameraNames['1C']}). He is ${stepsRemaining} ${stepsPlural} away from attempting to attack`;
      type = 'success';
      break;

    case 'foxy failed pirate cove movement check':
      message = `Foxy has failed his movement check and will remain inactive for ${additionalInfo.toFixed(2)} seconds`;
      type = 'fail';
      break;

    case 'jumpscare':
      message = `${animatronic.name} successfully jumpscared you`;
      type = 'success';
      break;
  }

  // return { message, type, preventDuplicates };

  let reportToAddTo = document.querySelector(
    `.animatronic-report[animatronic="${animatronic.name}"] .report-item-container`
  );

  let firstReport = reportToAddTo?.querySelector('.report-item');
  if (preventDuplicates && firstReport && firstReport.innerHTML.indexOf(message) > 0) {
    return;
    // Don't do anything here
  } else if (reportToAddTo) {
    const InGameTime = calculateInGameTime();

    reportToAddTo.innerHTML = `

    <div class="report-item" type="${type}">
    <span class="report-time">${InGameTime.hour}:${InGameTime.minute}AM</span>
    <div class="report-description">${message}</div></div>
    ${reportToAddTo?.innerHTML ?? ''}
  `;
  }
};

// ========================================================================== //
// CAMERAS
// ========================================================================== //

const toggleCameras = () => {
  user.camerasOn = !user.camerasOn;
  document.body.setAttribute('cameras-on', String(user.camerasOn));
  cameraButton.setAttribute('active', String(user.camerasOn));
  cameraStatusText.textContent = user.camerasOn ? 'CAMERAS ARE ON' : 'CAMERAS ARE OFF';

  let camerasOff = new Event('cameras-off');
  if (!user.camerasOn) {
    window.dispatchEvent(camerasOff);
  }
};

window.addEventListener('cameras-off', (e) => {
  console.log(e);
});

const generateCameraButtons = () => {
  for (const key in cameraNames) {
    const myCameraButton = document.createElement('button');
    myCameraButton.classList.add('camera-button');
    if (key === defaultCamera) {
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
      user.currentCamera = key as Camera;
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
let foxyInterval = window.setInterval(moveFoxy, secondLength * Foxy.movementOpportunityInterval);
// document.body.setAttribute('cameras-on', String(user.camerasOn));

document.body.setAttribute('cameras-on', 'false');

initialiseDoors();

// Since we're starting the time at -1 to accommodate 12AM being 89 seconds long, wait 1 second before starting the movement calculations
// window.setTimeout(() => {
//   freddyInterval = window.setInterval(moveFreddy, secondLength * Freddy.movementOpportunityInterval);
// }, 1000);

generateAnimatronics();

cameraButton.addEventListener('click', toggleCameras);
