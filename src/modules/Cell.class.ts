export class Cell {
  value: number;
  shouldMerge: boolean;
  prevRow: number | null;
  prevColumn: number | null;
  otherCellRow: number | null;
  otherCellColumn: number | null;
  prevValue: number | null;
  isNew: boolean;

  constructor(value: number, isNew?: boolean) {
    this.value = value;

    this.isNew = isNew || false;

    this.clearPreviousPosition();
    this.clearShouldMerge();
  }

  removeIsNew() {
    this.isNew = false;
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
