import * as React from "react";
import "./styles.css";
import { css } from "@emotion/core";
import styled from "@emotion/styled";

type Location = { x: number; y: number };
type Cell = {
  location: Location;
  state: "alive" | "dead";
};

const isAlive = (cell: Cell): boolean => cell.state === "alive";
const isDead = (cell: Cell): boolean => !isAlive(cell);
const kill = (cell: Cell): Cell & { state: "dead" } => ({
  ...cell,
  state: "dead"
});
const vivify = (cell: Cell): Cell & { state: "alive" } => ({
  ...cell,
  state: "alive"
});

type World = {
  time: number;
  cells: Cell[];
};

function isCellAtLocation(cell: Cell, location: Location): boolean {
  return cell.location.x === location.x && cell.location.y === location.y;
}
function getCell(world: World, location: Location): Cell {
  return (
    world.cells.find((c) => isCellAtLocation(c, location)) ?? {
      location,
      state: "dead"
    }
  );
}
function getCellNeighbors(world: World, cell: Cell): Cell[] {
  const { x, y } = cell.location;
  const neighborLocations = [
    { x: x - 1, y: y - 1 },
    { x: x, y: y - 1 },
    { x: x + 1, y: y - 1 },
    { x: x - 1, y: y },
    { x: x + 1, y: y },
    { x: x - 1, y: y + 1 },
    { x: x, y: y + 1 },
    { x: x + 1, y: y + 1 }
  ];
  return neighborLocations.map((location) => getCell(world, location));
}
function getLivingCellNeighbors(world: World, cell: Cell): Cell[] {
  const neighbors: Cell[] = getCellNeighbors(world, cell);
  const livingNeighbors: Cell[] = neighbors.filter(isAlive);
  return livingNeighbors;
}
function getDeadCellNeighbors(world: World, cell: Cell): Cell[] {
  const neighbors: Cell[] = getCellNeighbors(world, cell);
  const deadNeighbors: Cell[] = neighbors.filter(isDead);
  return deadNeighbors;
}

function getNextTickCell(world: World, cell: Cell): Cell {
  const livingNeighbors: Cell[] = getLivingCellNeighbors(world, cell);
  const numLivingNeighbors = livingNeighbors.length;
  if (isAlive(cell)) {
    switch (numLivingNeighbors) {
      case 2:
      case 3:
        return cell;
      default:
        return kill(cell);
    }
  } else {
    switch (numLivingNeighbors) {
      case 3:
        return vivify(cell);
      default:
        return cell;
    }
  }
}
function uniqueCells(cells: Cell[]): Cell[] {
  const index = new Map();
  cells.forEach((cell) => {
    const { location } = cell;
    index.set(`${location.x}/${location.y}`, cell);
  });
  return Object.values(Object.fromEntries(index));
}
function getLivingCells(world: World): Cell[] {
  const livingCells = world.cells.filter(isAlive);
  return livingCells;
}
function getDeadNeighborsOfLivingCells(world: World): Cell[] {
  const deadNeighborsOfLivingCells = uniqueCells(
    world.cells
      .filter(isAlive)
      .map((c) => getDeadCellNeighbors(world, c))
      .reduce((acc, curr) => [...acc, ...curr], [])
  );
  return deadNeighborsOfLivingCells;
}

function tick(world: World): World {
  return {
    time: world.time + 1,
    cells: [
      ...getLivingCells(world),
      ...getDeadNeighborsOfLivingCells(world)
    ].map((cell) => getNextTickCell(world, cell))
  };
}

const first: Cell[] = [
  { location: { x: 0, y: 0 }, state: "alive" },
  { location: { x: 1, y: 0 }, state: "alive" },
  { location: { x: 1, y: 1 }, state: "alive" },
  { location: { x: 2, y: -1 }, state: "alive" }
];

function useGameOfLife(initial: Cell[] = first) {
  const [isRunning, setIsRunning] = React.useState<boolean>(false);
  const [world, setWorld] = React.useState<World>({
    time: 0,
    cells: initial
  });
  const start = () => setIsRunning(true);
  const stop = () => setIsRunning(false);
  const toggle = () => (isRunning ? stop() : start());
  const reset = () => {
    setIsRunning(false);
    setWorld({ time: 0, cells: initial });
  };
  const next = (currentWorld: World) => {
    const nextWorld = tick(currentWorld);
    setWorld(nextWorld);
  };

  React.useEffect(() => {
    setTimeout(() => {
      if (isRunning) {
        next(world);
      }
    }, 500);
  }, [isRunning, world]);

  return { world, isRunning, start, stop, toggle, reset, next };
}

const numRows = 25; // must be odd
const numColumns = 25; // must be odd
const numRowsSigned = (numRows - 1) / 2;
const numColumnsSigned = (numColumns - 1) / 2;
const cellSize = 25;
const BoardContainer = styled.div`
  width: ${numRows * cellSize}px;
  height: ${numColumns * cellSize}px;
  display: grid;
  grid-template-rows: repeat(numRows, 1fr);
  grid-template-columns: repeat(numColumns, 1fr);
`;
const BoardCell = styled.div(
  ({ x, y, isAlive }: { x: number; y: number; isAlive: boolean }) => css`
    grid-row: ${-y + numRowsSigned + 1} / span 1;
    grid-column: ${x + numColumnsSigned + 1} / span 1;
    background: ${isAlive ? "lightgreen" : "black"};
    color: white;
  `
);
const getBoardCellLocations = (): Location[] => {
  const locations = [];
  for (let x = -numColumnsSigned; x <= numColumnsSigned; x++) {
    for (let y = -numRowsSigned; y <= numRowsSigned; y++) {
      locations.push({ x, y });
    }
  }
  return locations;
};
function Board({ world }: { world: World }) {
  const locations = React.useMemo(getBoardCellLocations, []);
  const states = locations.map((location) => ({
    ...location,
    isAlive: isAlive(getCell(world, location))
  }));
  return (
    <BoardContainer>
      {states.map(({ x, y, isAlive }) => {
        return <BoardCell key={`${x}/${y}`} x={x} y={y} isAlive={isAlive} />;
      })}
    </BoardContainer>
  );
}

const blinker2: Cell[] = [
  { location: { x: -1, y: 0 }, state: "alive" },
  { location: { x: 0, y: 0 }, state: "alive" },
  { location: { x: 1, y: 0 }, state: "alive" }
];

const glider: Cell[] = [
  { location: { x: -1, y: 0 }, state: "alive" },
  { location: { x: 0, y: 0 }, state: "alive" },
  { location: { x: 1, y: 0 }, state: "alive" },
  { location: { x: 1, y: 1 }, state: "alive" },
  { location: { x: 0, y: 2 }, state: "alive" }
];

export default function App() {
  const { world, isRunning, toggle, reset, next } = useGameOfLife(glider);
  React.useEffect(() => {
    console.log(`world: ${world.time.toString()}`, world);
  }, [world]);
  return (
    <div className="App">
      <h1>Game of Life</h1>
      <Rules />
      <Board world={world} />
      <button onClick={() => next(world)}>NEXT</button>
      <button onClick={toggle}>{isRunning ? "STOP" : "START"}</button>
      <button onClick={reset}>RESET</button>
    </div>
  );
}
const Rules = () => (
  <>
    <h2>Four simple rules:</h2>
    <div>
      <ol>
        <li>
          Any live cell with fewer than two live neighbours dies, as if by
          underpopulation.
        </li>
        <li>
          Any live cell with two or three live neighbours lives on to the next
          generation.
        </li>
        <li>
          Any live cell with more than three live neighbours dies, as if by
          overpopulation.
        </li>
        <li>
          Any dead cell with exactly three live neighbours becomes a live cell,
          as if by reproduction.
        </li>
      </ol>
    </div>
  </>
);
