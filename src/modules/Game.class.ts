// 'use strict';

import { Cell } from "./Cell.class";

const INITIAL_SCORE = 0;
const INITIAL_STATE: Cell[][] = [];

for (let row = 0; row < 4; row++) {
  const stateRow: Cell[] = [];

  for (let column = 0; column < 4; column++) {
    stateRow.push(new Cell(0));
  }

  INITIAL_STATE.push(stateRow);
}

export enum Status {
  "idle",
  "playing",
  "win",
  "lose",
}

const FOUR_PROBABILITY = 0.1;

function cloneState(state: Cell[][]) {
  return state.map((row) => row.map((column) => new Cell(column.value)));
}

function normalize(offset) {
  return offset > 0 ? 1 : -1;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export class Game {
  initialState: Cell[][];
  state: Cell[][];
  score: number;
  status: Status;

  constructor(initialState = INITIAL_STATE) {
    this.initialState = cloneState(initialState);

    this.state = initialState;
    this.score = INITIAL_SCORE;
    this.status = Status.idle;
  }

  private checkGameBoard() {
    let hasAvailableMoves = false;

    for (let row = 0; row < this.state.length; row++) {
      for (let column = 0; column < this.state[row].length; column++) {
        if (this.state[row][column].value === 2048) {
          this.status = Status.win;

          return;
        }

        let hasMovesVertically = false;

        if (this.state[row + 1]) {
          const canMergeVertically =
            this.state[row][column].value === this.state[row + 1][column].value;
          const canMoveVertically = this.state[row][column].value === 0;

          hasMovesVertically = canMergeVertically || canMoveVertically;
        }

        let hasMoveHorizonally = false;

        if (this.state[row][column + 1]) {
          const canMergeHorizontally =
            this.state[row][column].value === this.state[row][column + 1].value;

          const canMoveHorizontally = this.state[row][column].value === 0;

          hasMoveHorizonally = canMergeHorizontally || canMoveHorizontally;
        }

        if (hasMovesVertically || hasMoveHorizonally) {
          hasAvailableMoves = true;

          return;
        }
      }
    }

    if (!hasAvailableMoves) {
      this.status = Status.lose;
    }
  }

  private getEmptyCells() {
    const emptyCells: number[][] = [];

    for (let row = 0; row < this.state.length; row++) {
      for (let column = 0; column < this.state[row].length; column++) {
        const cellValue = this.state[row][column].value;

        if (cellValue === 0) {
          emptyCells.push([row, column]);
        }
      }
    }

    return emptyCells;
  }

  private randomSpawn() {
    const emptyCells = this.getEmptyCells();

    const randomEmptyCell = emptyCells[getRandomInt(emptyCells.length)];

    this.state[randomEmptyCell[0]][randomEmptyCell[1]] = new Cell(
      Math.random() <= FOUR_PROBABILITY ? 4 : 2,
      true,
    );
  }

  private move(
    targetRow: number,
    targetColumn: number,
    currentRow: number,
    currentColumn: number,
  ) {
    const targetCell = this.state[targetRow][targetColumn];
    const currentCell = this.state[currentRow][currentColumn];

    if (
      !targetCell.shouldMerge &&
      targetCell.prevRow !== null &&
      targetCell.prevColumn !== null
    ) {
      currentCell.setShouldMerge(targetCell.prevRow, targetCell.prevColumn);
    } else if (
      !targetCell.shouldMerge &&
      targetCell.value === currentCell.value
    ) {
      currentCell.setShouldMerge(targetRow, targetColumn);
    }

    currentCell.setPreviousPosition(currentRow, currentColumn);

    currentCell.setValue(targetCell.value + currentCell.value);

    this.state[targetRow][targetColumn] = currentCell;
    this.state[currentRow][currentColumn] = new Cell(0);
  }

  private merge(
    targetRow: number,
    targetColumn: number,
    currentRow: number,
    currentColumn: number,
  ) {
    this.move(targetRow, targetColumn, currentRow, currentColumn);

    this.score += this.state[targetRow][targetColumn].value;
  }

  private moveCells(offset: number, isRowMovement: boolean) {
    const direction = Math.sign(offset);
    const isMovingForward = direction === 1;
    const axisSize = isRowMovement ? this.state[0].length : this.state.length;
    const totalLines = isRowMovement ? this.state.length : this.state[0].length;

    for (let line = 0; line < totalLines; line++) {
      const mergedColumns = new Array(axisSize).fill(false);
      let writePosition = isMovingForward ? 0 : axisSize - 1;

      for (
        let readPosition = isMovingForward ? 0 : axisSize - 1;
        readPosition >= 0 && readPosition < axisSize;
        readPosition += direction
      ) {
        const [currentRow, currentCol] = isRowMovement
          ? [readPosition, line]
          : [line, readPosition];

        const currentCell = this.state[currentRow][currentCol];

        if (currentCell.value === 0) {
          continue;
        }

        let merged = false;

        if (writePosition !== (isMovingForward ? 0 : axisSize - 1)) {
          const prevWritePos = writePosition - direction;
          const [prevRow, prevCol] = isRowMovement
            ? [prevWritePos, line]
            : [line, prevWritePos];

          const prevCell = this.state[prevRow][prevCol];

          if (
            prevCell.value === currentCell.value &&
            !mergedColumns[prevWritePos]
          ) {
            this.merge(prevRow, prevCol, currentRow, currentCol);
            mergedColumns[prevWritePos] = true;
            merged = true;
          }
        }

        if (!merged) {
          if (writePosition !== readPosition) {
            const [targetRow, targetCol] = isRowMovement
              ? [writePosition, line]
              : [line, writePosition];

            this.move(targetRow, targetCol, currentRow, currentCol);
          }

          writePosition += direction;
        }
      }
    }
  }

  private moveRowWithOffset(offset: number) {
    this.moveCells(offset, true);
  }

  private moveColumnWithOffset(offset: number) {
    this.moveCells(offset, false);
  }

  private moveWithOffset(offsetColumn, offsetRow = 0) {
    if (this.status !== Status.playing && this.status !== Status.idle) {
      return;
    }

    const lastState = JSON.stringify(
      this.state.map((row) => row.map((cell) => cell.value)),
    );

    if (offsetRow) {
      this.moveRowWithOffset(offsetRow);
    } else {
      this.moveColumnWithOffset(offsetColumn);
    }

    const currentState = JSON.stringify(
      this.state.map((row) => row.map((cell) => cell.value)),
    );

    if (currentState === lastState) {
      return;
    }

    this.randomSpawn();
  }

  moveLeft() {
    this.moveWithOffset(1);
  }

  moveRight() {
    this.moveWithOffset(-1);
  }

  moveUp() {
    this.moveWithOffset(0, 1);
  }

  moveDown() {
    this.moveWithOffset(0, -1);
  }

  getScore() {
    return this.score;
  }

  getState() {
    return this.state;
  }

  updateStatus() {
    this.checkGameBoard();
  }

  getStatus() {
    return this.status;
  }

  start() {
    this.restart();
  }

  restart() {
    this.status = Status.playing;
    this.state = cloneState(this.initialState);
    this.score = INITIAL_SCORE;

    this.randomSpawn();
    this.randomSpawn();
  }
}
