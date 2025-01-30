export class Cell {
  value: number;
  shouldMerge: boolean;
  prevRow: number | null;
  prevColumn: number | null;
  otherCellRow: number | null;
  otherCellColumn: number | null;
  prevValue: number | null;

  constructor(value: number) {
    this.value = value;

    this.clearPreviousPosition();
    this.clearShouldMerge();
  }

  setShouldMerge(otherCellRow, otherCellColumn) {
    this.shouldMerge = true;
    this.otherCellRow = otherCellRow;
    this.otherCellColumn = otherCellColumn;
  }

  clearShouldMerge() {
    this.shouldMerge = false;
    this.prevValue = null;
    this.otherCellRow = null;
    this.otherCellColumn = null;
  }

  setPreviousPosition(row, column) {
    this.prevRow = row;
    this.prevColumn = column;
  }

  clearPreviousPosition() {
    this.prevRow = null;
    this.prevColumn = null;
  }

  setValue(value) {
    this.prevValue = this.value;
    this.value = value;
  }
}
