import { getRandomNumberExc } from '../helpers'
import { BOARD_ITEM } from './consts'
import { TypeHorsePos } from './horse'
import { TypeBoard, TypeBoardItemsType, TypeBoardItems } from './types'
import { getRandomInt } from '@/utils/helpers'

export interface IBoardOpt {
  length?: number
  board?: TypeBoard
  random?: boolean 
}

export class Board {
  static itemsList: TypeBoardItemsType[] = [BOARD_ITEM.cell, BOARD_ITEM.pill, BOARD_ITEM.brick]
  board: TypeBoard | null
  boardScore: number[][] | null
  prevPoint: TypeBoardItems | null
  lastPoint: TypeBoardItems | null

  constructor({ length, board, random }: IBoardOpt) {
    this.board = board || null
    this.boardScore = [] || null
    this.prevPoint = null
    this.lastPoint = null

    if (!board && length) this.initBoard(length, random)
    if (length) this.initBoardScore(length)
  }

  initBoard(length: number, random?: boolean): void {
    this.board = Board.createBoard(length, random)
  }

  static createBoard(length: number, random?: boolean) {
    const newBoard: TypeBoard = []

    let item: TypeBoardItems
    
    for (let i = 0; i < length; i++) {
      const row: TypeBoardItems[] = []

      for (let j = 0; j < length; j++) {
        if (random) {
          item = this.getRandomItem(i, j)
        } else {
          item = {
            row: i,
            col: j,
            user: null,
            type: BOARD_ITEM.pill,
          }
        }

        row.push(item)
      }

      newBoard.push(row)
    }

    return newBoard
  }

  initBoardScore(length: number): void {
    const newBoardScore: number[][] = []
    
    for (let i = 0; i < length; i++) {
      const rowScore: number[] = []

      for (let j = 0; j < length; j++) {
       
        rowScore.push(0)
      }

      newBoardScore.push(rowScore)
    }

    this.boardScore = newBoardScore
  }

  static getRandomItem(row: number, col: number): TypeBoardItems {
    return {
      row,
      col,
      user: null,
      type: Board.itemsList[getRandomNumberExc(Board.itemsList.length)]
    }
  }

  setHorseTo(point: TypeHorsePos, user: number): void {
    if (!this.board) return

    if (this.lastPoint) {
      this.board[this.lastPoint.row][this.lastPoint.col].type = BOARD_ITEM.cell
      this.board[this.lastPoint.row][this.lastPoint.col].user = null
      this.prevPoint = this.lastPoint
    }

    this.board[point[0]][point[1]].type = BOARD_ITEM.horse
    this.board[point[0]][point[1]].user = user

    this.lastPoint = this.board[point[0]][point[1]]
  }

  setCoin() {
    if (!this.board) return

    let point: [number, number]
  
    do {
      point = [getRandomInt(this.board.length - 1), getRandomInt(this.board.length - 1)]
    } while (!this.isCell(this.board, point))
  
    this.board[point[0]][point[1]].type = BOARD_ITEM.pill
  }

  isCell(board: TypeBoard, point: [number, number]): boolean {
    if (board[point[0]] && board[point[0]][point[1]] && board[point[0]][point[1]].type === BOARD_ITEM.cell) return true
    return false
  }
}
