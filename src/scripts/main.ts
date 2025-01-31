"use strict";

import { Game, Status } from "../modules/Game.class";

const game = new Game();

const cellsContainer = document.querySelector(".cells-container");
const rows = document.querySelectorAll(".field-row");
const button = document.querySelector(".button");
const gameScore = document.querySelector(".game-score");

const messageStart = document.querySelector(".message-start");
const messageWin = document.querySelector(".message-win");
const messageLose = document.querySelector(".message-lose");

const BUTTON_RESTART = "Restart";
const BUTTON_CLASS_RESTART = "restart";
const BUTTON_START = "Start";
const BUTTON_CLASS_START = "start";

let showStartButton = true;

const ANIMATION_TIMING: KeyframeAnimationOptions = {
  duration: 300,
  iterations: 1,
  easing: "ease-in-out",
  fill: "forwards",
};

function createCell(value) {
  if (!cellsContainer) {
    return;
  }

  const cellElement = document.createElement("div");

  cellElement.textContent = value;
  cellElement.classList.add("cell", `cell--${cellElement.textContent}`);

  cellsContainer.appendChild(cellElement);

  return cellElement;
}

function getCellRect(row: number, column: number) {
  return rows[row].children[column].getBoundingClientRect();
}

function calculateCellKeyframes(
  currentRow: number,
  currentColumn: number,
  targetRow: number,
  targetColumn: number,
  isMerging: boolean,
  isMergable: boolean,
) {
  if (!cellsContainer) {
    return;
  }

  const cellContainerRect = cellsContainer.getBoundingClientRect();

  const previousCellRect = getCellRect(currentRow, currentColumn);
  const currentCellRect = getCellRect(targetRow, targetColumn);

  const keyframes = [
    {
      top: `${previousCellRect.top - cellContainerRect.top}px`,

      left: `${previousCellRect.left - cellContainerRect.left}px`,
      transform: "scale(1)",
    },
    {
      transform: isMerging && !isMergable ? "scale(0.8)" : "scale(1)",
    },
    {
      offset: 0.99,
      transform: isMerging && isMergable ? "scale(1.2)" : "scale(1)",
    },
    {
      top: `${currentCellRect.top - cellContainerRect.top}px`,

      left: `${currentCellRect.left - cellContainerRect.left}px`,
      transform: "scale(1)",
    },
  ];

  return keyframes;
}

function cancelAllAnimations() {
  if (!cellsContainer) {
    return;
  }

  for (const child of cellsContainer.children) {
    child.getAnimations().forEach((animation) => animation.cancel());
  }
}

function update() {
  if (!cellsContainer) {
    return;
  }

  const state = game.getState();

  cellsContainer.replaceChildren();

  for (let row = 0; row < state.length; row++) {
    for (let column = 0; column < state[row].length; column++) {
      const cell = state[row][column];

      if (cell.value === 0) {
        continue;
      }

      const cellElement = createCell(
        cell.shouldMerge ? cell.prevValue : cell.value,
      );

      if (!cellElement) {
        return;
      }

      if (cell.prevColumn !== null && cell.prevRow !== null) {
        const cellKeyframes = calculateCellKeyframes(
          cell.prevRow,
          cell.prevColumn,
          row,
          column,
          cell.shouldMerge,
          false,
        );

        if (!cellKeyframes) {
          return;
        }

        if (cell.shouldMerge) {
          if (cell.otherCellRow === null || cell.otherCellColumn === null) {
            return;
          }

          const mergableCellElement = createCell(
            cell.shouldMerge ? cell.prevValue : cell.value,
          );

          if (!mergableCellElement) {
            return;
          }

          const mergableCellKeyframes = calculateCellKeyframes(
            cell.otherCellRow,
            cell.otherCellColumn,
            row,
            column,
            cell.shouldMerge,
            true,
          );

          if (!mergableCellKeyframes) {
            return;
          }

          const mergableCellAnimation = mergableCellElement.animate(
            mergableCellKeyframes,
            ANIMATION_TIMING,
          );

          const handleMergeAnimationEnd = () => {
            cell.clearShouldMerge();
            mergableCellElement.remove();
          };

          mergableCellAnimation.addEventListener(
            "finish",
            handleMergeAnimationEnd,
          );
          mergableCellAnimation.addEventListener(
            "cancel",
            handleMergeAnimationEnd,
          );
        }

        const animation = cellElement.animate(cellKeyframes, ANIMATION_TIMING);

        const handleAnimationEnd = () => {
          console.log("cancelled");
          cell.clearPreviousPosition();

          cellElement.classList.remove(`cell--${cellElement.textContent}`);

          cellElement.textContent = `${cell.value}`;

          cellElement.classList.add(`cell--${cellElement.textContent}`);
        };

        animation.addEventListener("finish", handleAnimationEnd);
        animation.addEventListener("cancel", handleAnimationEnd);

        continue;
      }

      if (cell.isNew) {
        const appearKeyframes = [
          {
            transform: "scale(0)",
          },
          {
            transform: "scale(1.2)",
          },
          {
            transform: "scale(1)",
          },
        ];

        const animation = cellElement.animate(
          appearKeyframes,
          ANIMATION_TIMING,
        );

        const resetCellState = () => {
          cell.removeIsNew();
        };

        animation.addEventListener("finish", resetCellState);
        animation.addEventListener("cancel", resetCellState);
      }

      cellElement.style.top = `${
        rows[row].children[column].getBoundingClientRect().top -
        cellsContainer.getBoundingClientRect().top
      }px`;

      cellElement.style.left = `${
        rows[row].children[column].getBoundingClientRect().left -
        cellsContainer.getBoundingClientRect().left
      }px`;
    }
  }

  game.updateStatus();

  if (!button || !messageStart || !messageWin || !messageLose) {
    return;
  }

  switch (game.getStatus()) {
    case Status.playing:
      button.textContent = BUTTON_RESTART;
      button.classList.remove(BUTTON_CLASS_START);
      button.classList.add(BUTTON_CLASS_RESTART);

      messageStart.classList.add("hidden");
      messageWin.classList.add("hidden");
      messageLose.classList.add("hidden");

      break;
    case Status.lose:
      messageLose.classList.remove("hidden");

      break;
    case Status.win:
      messageWin.classList.remove("hidden");

      break;
    default:
      break;
  }

  if (showStartButton) {
    button.textContent = BUTTON_START;
    button.classList.remove(BUTTON_CLASS_RESTART);
    button.classList.add(BUTTON_CLASS_START);
  }

  if (!gameScore) {
    return;
  }

  gameScore.textContent = `${game.getScore()}`;
}

if (button) {
  button.addEventListener("click", () => {
    if (
      game.getStatus() === Status.playing &&
      !showStartButton &&
      confirm("Are you sure you want to restart the game?")
    ) {
      game.restart();
    } else if (game.getStatus() !== Status.playing) {
      game.start();
    }

    update();
  });
}

let arrowsTimeout = false;

document.addEventListener("keydown", (e) => {
  if (game.getStatus() !== Status.playing) {
    return;
  }

  if (arrowsTimeout) {
    return;
  }

  let pressedArrows = true;

  switch (e.key) {
    case "ArrowUp":
      game.moveUp();
      break;
    case "ArrowDown":
      game.moveDown();
      break;
    case "ArrowLeft":
      game.moveLeft();
      break;
    case "ArrowRight":
      game.moveRight();
      break;
    default:
      pressedArrows = false;
  }

  if (pressedArrows) {
    arrowsTimeout = true;

    showStartButton = false;

    cancelAllAnimations();

    update();

    setTimeout(() => {
      arrowsTimeout = false;
    }, 50);
  }
});

document.addEventListener("touchstart", handleTouchStart, false);
document.addEventListener("touchmove", handleTouchMove, false);

let xDown = null;
let yDown = null;

function getTouches(evt) {
  return (
    evt.touches || // browser API
    evt.originalEvent.touches
  ); // jQuery
}

function handleTouchStart(evt) {
  const firstTouch = getTouches(evt)[0];

  xDown = firstTouch.clientX;
  yDown = firstTouch.clientY;
}

function handleTouchMove(evt) {
  if (!xDown || !yDown) {
    return;
  }

  const xUp = evt.touches[0].clientX;
  const yUp = evt.touches[0].clientY;

  const xDiff = xDown - xUp;
  const yDiff = yDown - yUp;

  if (Math.abs(xDiff) > Math.abs(yDiff)) {
    if (xDiff > 0) {
      game.moveLeft();
    } else {
      game.moveRight();
    }
  } else {
    if (yDiff > 0) {
      game.moveUp();
    } else {
      game.moveDown();
    }
  }

  update();

  xDown = null;
  yDown = null;
}
