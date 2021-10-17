import { InfoResponse, GameState, MoveResponse, Game, Coord } from "./types"

export function info(): InfoResponse {
    console.log("INFO")
    const response: InfoResponse = {
        apiversion: "1",
        author: "IanG",
        color: "#68b7fc",
        head: "beluga",
        tail: "replit-notmark"
    }
    return response
}

export function start(gameState: GameState): void {
    console.log(`${gameState.game.id} START`)
}

export function end(gameState: GameState): void {
    console.log(`${gameState.game.id} END\n`)
}

function translate(point: Coord, delta: Coord): Coord {
  return {
    x: point.x + delta.x,
    y: point.y + delta.y
  };
}

function intersection(set1: any[], set2: any[], comparator: (lhs: any, rhs: any) => boolean = (x, y) => x === y): any[] {
  return set1.filter(x => set2.some(y => comparator(x, y)));
}

function calcMoveCoords(currentPos: Coord): { [key: string]: Coord } {
  return {
    left: translate(currentPos, { x: -1, y: 0 }),
    right: translate(currentPos, { x: 1, y: 0 }),
    down: translate(currentPos, { x: 0, y: -1 }),
    up: translate(currentPos, { x: 0, y: 1 }),
  };
}

function replicate(value: any, times: number, copy: (value: any) => any = value => value) {
  let list: any[] = [];
  for (let i = 0; i < times; i++) {
    list.push(copy(value));
  }
  return list;
}

function sum(list: number[]) {
  return list.reduce((sum, next) => sum + next, 0);
}
function average(list: number[]) {
  return sum(list) / list.length;
}

function coordArrayToBoard(coordArray: Coord[], widthHeight: number): number[][] {
  let board: number[][] = replicate(replicate(0, widthHeight), widthHeight, list => list.slice());
  for (const coord of coordArray) {
    board[coord.x][coord.y] = 1;
  }
  return board;
}

function boardToCoordArray(board: number[][]): Coord[] {
  let coordArray: Coord[] = [];
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      for (let val of board) {
        if (val) coordArray.push({ x: i, y: j });
      }
    }
  }
  return coordArray;
}

function sizeOfConnectedRegion(board: number[][], start: Coord): number {
  console.log(`size of board at:`);
  console.dir(start);
  let pos = {...start};
  let breadcrumbs = [pos];
  let output = coordArrayToBoard([], board.length);
  let regionSize = 1;

  const input = board;
  const sizex = board.length, sizey = board[0].length;
  const color = 0;

  if (pos.x < 0 || pos.y < 0 || pos.x >= sizex || pos.y >= sizey) {
    return 0;
  }
  
  do {
    // Process next point in stack.
    pos = breadcrumbs.pop()!;

    // Explore and mark.
    // Move if and only if
    //  (1) we would not go out of bounds,
    //  (2) we would move to a space with the same input color, AND
    //  (3) we have not already moved to (and marked) that space.
    if (pos.x > 0 && input[pos.x - 1][pos.y] == color && output[pos.x - 1][pos.y] == 0) {
      regionSize++;
      output[pos.x - 1][pos.y] = 1;
      breadcrumbs.push({ x: pos.x - 1, y: pos.y });
    }
    if (pos.x < sizex - 1 && input[pos.x + 1][pos.y] == color && output[pos.x + 1][pos.y] == 0) {
      regionSize++;
      output[pos.x + 1][pos.y] = 1;
      breadcrumbs.push({ x: pos.x + 1, y: pos.y });
    }
    if (pos.y > 0 && input[pos.x][pos.y - 1] == color && output[pos.x][pos.y - 1] == 0) {
      regionSize++;
      output[pos.x][pos.y - 1] = 1;
      breadcrumbs.push({ x: pos.x, y: pos.y - 1 });
    }
    if (pos.y < sizey - 1 && input[pos.x][pos.y + 1] == color && output[pos.x][pos.y + 1] == 0) {
      regionSize++;
      output[pos.x][pos.y + 1] = 1;
      breadcrumbs.push({ x: pos.x, y: pos.y + 1 });
    }
  } while (breadcrumbs.length);

  // console.dir(output);

  return regionSize;
}

export function move(gameState: GameState): MoveResponse {
    let possibleMoves: { [key: string]: boolean } = {
        up: true,
        down: true,
        left: true,
        right: true
    };
    let somewhatRiskyMoves: { [key: string]: boolean } = {
        up: false,
        down: false,
        left: false,
        right: false
    };
    let riskyMoves: { [key: string]: boolean } = {
        up: false,
        down: false,
        left: false,
        right: false
    };

    const me = gameState.you;
    const board = gameState.board;
    const boardWidth = board.width;
    const boardHeight = board.height;

    const allSnakeCoords = (() => {
      let coords: Coord[] = [];
      for (const snake of board.snakes) {
        coords.push(...snake.body);
        coords.pop();
      }
      return coords;
    })();
    const allSnakeCoordsBoard = coordArrayToBoard(allSnakeCoords, boardWidth);

    // Step 0: Don't let your Battlesnake move back on it's own neck
    const myHead = me.head;
    const myNeck = me.body[1];

    const moveCoords = calcMoveCoords(myHead);
    let inverseMoveCoords: Map<Coord,string> = new Map();
    for (const move in moveCoords) {
      inverseMoveCoords.set(moveCoords[move], move);
    }

    if (myNeck.x < myHead.x) {
        possibleMoves.left = false
    } else if (myNeck.x > myHead.x) {
        possibleMoves.right = false
    } else if (myNeck.y < myHead.y) {
        possibleMoves.down = false
    } else if (myNeck.y > myHead.y) {
        possibleMoves.up = false
    }

    // TODO: Step 1 - Don't hit walls.
    // Use information in gameState to prevent your Battlesnake from moving beyond the boundaries of the board.
    if (myHead.x == 0) possibleMoves.left = false;
    if (myHead.x + 1 == boardWidth) possibleMoves.right = false;
    if (myHead.y == 0) possibleMoves.down = false;
    if (myHead.y + 1 == boardHeight) possibleMoves.up = false;

    // TODO: Step 2 - Don't hit yourself.
    // Use information in gameState to prevent your Battlesnake from colliding with itself.
    // TODO: Step 3 - Don't collide with others.
    // Use information in gameState to prevent your Battlesnake from colliding with others.
    for (const them of board.snakes) {
      for (const bodyTile of them.body) {
        if (bodyTile.x == myHead.x) {
          if (bodyTile.y == myHead.y + 1) possibleMoves.up = false;
          else if (bodyTile.y == myHead.y - 1) possibleMoves.down = false;
        } else if (bodyTile.y == myHead.y) {
          if (bodyTile.x == myHead.x + 1) possibleMoves.right = false;
          else if (bodyTile.x == myHead.x - 1) possibleMoves.left = false;
        }
      }

      if (them.id !== me.id && them.body.length >= me.body.length) {
        const theirMoveCoords = calcMoveCoords(them.head);

        for (const possibleHeadToHeadCoord of intersection(
          Object.values(moveCoords),
          Object.values(theirMoveCoords),
          (mine, theirs) => mine.x === theirs.x && mine.y === theirs.y
        )) {
          // console.dir(possibleHeadToHeadCoord);
          // console.dir(me);
          // console.dir(them);
          riskyMoves[inverseMoveCoords.get(possibleHeadToHeadCoord)!] = true;
        }

        function isOutOfBounds(coord: Coord): boolean {
          return coord.x < 0 || coord.x >= boardWidth || coord.y < 0 || coord.y >= boardHeight;
        }
        for (const myMoveCoord of Object.values(moveCoords)) {
          if (isOutOfBounds(myMoveCoord) || allSnakeCoordsBoard[myMoveCoord.x][myMoveCoord.y]) {
            // We can't move here anyway, so don't be scared of our possible moves after this one.
            continue;
          }
          const myMoveMoveCoords = calcMoveCoords(myMoveCoord);
          for (const theirMoveCoord of Object.values(theirMoveCoords)) {
            if (isOutOfBounds(theirMoveCoord) || allSnakeCoordsBoard[theirMoveCoord.x][theirMoveCoord.y]) {
            // They can't move here anyway, so don't be scared of their possible moves after this one.
              continue;
            }
            for (const possibleLaterHeadToHeadCoord of intersection(
              Object.values(myMoveMoveCoords),
              Object.values(calcMoveCoords(theirMoveCoord)),
              (mine, theirs) => mine.x === theirs.x && mine.y === theirs.y
            )) {
              somewhatRiskyMoves[inverseMoveCoords.get(myMoveCoord)!] = true;
            }
          }
        }
      }
    }

    for (const move in moveCoords) {
      if (!possibleMoves[move]) continue;
      const coord = moveCoords[move];
      if (sizeOfConnectedRegion(allSnakeCoordsBoard, coord) < me.body.length) {
        riskyMoves[move] = true;
      }
    }

    const leastRiskyPossibleMoves: { [key: string]: boolean } = {
      up: possibleMoves.up && !riskyMoves.up && !somewhatRiskyMoves.up,
      down: possibleMoves.down && !riskyMoves.down && !somewhatRiskyMoves.down,
      left: possibleMoves.left && !riskyMoves.left && !somewhatRiskyMoves.left,
      right: possibleMoves.right && !riskyMoves.right && !somewhatRiskyMoves.right,
    };
    const somewhatRiskyPossibleMoves: { [key: string]: boolean } = {
      up: possibleMoves.up && !riskyMoves.up,
      down: possibleMoves.down && !riskyMoves.down,
      left: possibleMoves.left && !riskyMoves.left,
      right: possibleMoves.right && !riskyMoves.right,
    };
    const allMoveStrings = Object.keys(possibleMoves);
    let safeMoves = allMoveStrings.filter(key => leastRiskyPossibleMoves[key]);
    if (!safeMoves.length) {
      safeMoves = allMoveStrings.filter(key => somewhatRiskyPossibleMoves[key]);
      if (!safeMoves.length) {
        safeMoves = allMoveStrings.filter(key => possibleMoves[key]);
      }
    }
    console.log('least risky, somewhat risky, possible:');
    console.dir(leastRiskyPossibleMoves);
    console.dir(somewhatRiskyPossibleMoves);
    console.dir(possibleMoves);

    // TODO: Step 4 - Find food.
    // Use information in gameState to seek out and find food.
    function euclideanDistance(point1: Coord, point2: Coord): number {
      return Math.sqrt(
        Math.pow(point2.x - point1.x, 2) +
        Math.pow(point2.y - point1.y, 2)
      );
    }
    let closestFoodDistances = board.food.map(food => ({
      food: food,
      distanceFromMe: euclideanDistance(food, myHead)
    }));
    closestFoodDistances.sort((foodDistance1, foodDistance2) => {
      if (foodDistance1.distanceFromMe < foodDistance2.distanceFromMe) return -1;
      if (foodDistance1.distanceFromMe == foodDistance2.distanceFromMe) return 0;
      return 1;
    });
    
    let preferredMoves = safeMoves.map(move => ({
      move: move,
      coord: moveCoords[move]
    }));
    const centerOfBoard = { x: Math.floor(boardWidth / 2), y: Math.floor(boardHeight / 2) };
    function isAtEdge(coord: Coord): boolean {
      return coord.x == 0 || coord.x == boardWidth - 1 ||
             coord.y == 0 || coord.y == boardHeight - 1;
    }
    preferredMoves.sort((move1, move2) => {
      const move1Distance = isAtEdge(move1.coord) ? 0 : euclideanDistance(move1.coord, centerOfBoard);
      const move2Distance = isAtEdge(move2.coord) ? 0 : euclideanDistance(move2.coord, centerOfBoard);
      // Prefer moves that end up further from center.
      if (move1Distance < move2Distance) return 1;
      if (move1Distance == move2Distance) return 0;
      return -1;
    });
    if (board.food.length && me.health <= 6 * boardWidth) {
      preferredMoves.sort((move1, move2) => {
        const homeInDistanceThreshold = 4;
        let move1Distance = euclideanDistance(move1.coord, closestFoodDistances[0].food);
        if (move1Distance > homeInDistanceThreshold) move1Distance = average(closestFoodDistances.map(foodDistance => euclideanDistance(move1.coord, foodDistance.food)))// + 2 * Math.random();
        let move2Distance = euclideanDistance(move2.coord, closestFoodDistances[0].food);
        if (move2Distance > homeInDistanceThreshold) move2Distance = average(closestFoodDistances.map(foodDistance => euclideanDistance(move2.coord, foodDistance.food)))// + 2 * Math.random();
        if (move1Distance < move2Distance) return -1;
        if (move1Distance == move2Distance) return 0;
        return 1;
      });
    }
    function coordAsNum(coord: Coord): number {
      return 1000 * coord.x + coord.y;
    }
    const regionSizeCache: Map<number,number> = new Map();
    preferredMoves.sort((move1, move2) => {
      const move1Size = regionSizeCache.get(coordAsNum(move1.coord)) ?? sizeOfConnectedRegion(coordArrayToBoard(allSnakeCoords, boardWidth), move1.coord);
      regionSizeCache.set(coordAsNum(move1.coord), move1Size);
      const move2Size = regionSizeCache.get(coordAsNum(move2.coord)) ?? sizeOfConnectedRegion(coordArrayToBoard(allSnakeCoords, boardWidth), move2.coord);
      regionSizeCache.set(coordAsNum(move2.coord), move2Size);
      console.log(`region 1: ${move1Size}, region 2: ${move2Size}`);
      if (move1Size < move2Size) return 1;
      if (move1Size == move2Size) return 0;
      return -1;
    });

    console.dir(preferredMoves);

    // Finally, choose a move from the available safe moves.
    // TODO: Step 5 - Select a move to make based on strategy, rather than random.
    const response: MoveResponse = {
        move: preferredMoves[0].move, // Error on purpose if no moves available.
    };

    console.log(`${gameState.game.id} MOVE ${gameState.turn}: ${response.move}`);
    return response;
}
