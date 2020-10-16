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
  state: "dead",
});
const vivify = (cell: Cell): Cell & { state: "alive" } => ({
  ...cell,
  state: "alive",
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
      state: "dead",
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
    { x: x + 1, y: y + 1 },
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
      ...getDeadNeighborsOfLivingCells(world),
    ].map((cell) => getNextTickCell(world, cell)),
  };
}

const first: Cell[] = [
  { location: { x: 0, y: 0 }, state: "alive" },
  { location: { x: 1, y: 0 }, state: "alive" },
  { location: { x: 1, y: 1 }, state: "alive" },
  { location: { x: 2, y: -1 }, state: "alive" },
];

type GameOfLifeConfig = {
  initial: Cell[];
  tickRate: number;
};
function useGameOfLife({ initial = first, tickRate = 200 }: GameOfLifeConfig) {
  const [isRunning, setIsRunning] = React.useState<boolean>(false);
  const [world, setWorld] = React.useState<World>({
    time: 0,
    cells: initial,
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
    if (isRunning) {
      const timer = setTimeout(() => {
        next(world);
      }, tickRate);
      return () => clearTimeout(timer);
    }
  }, [isRunning, world, tickRate]);

  return { world, isRunning, start, stop, toggle, reset, next };
}

const root = 41; // must be odd
const numRows = root; // must be odd
const numColumns = root; // must be odd
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
const BoardCell = styled.div<{ x: number; y: number; isAlive: boolean }>(
  ({ x, y, isAlive }) => css`
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
    isAlive: isAlive(getCell(world, location)),
  }));
  return (
    <BoardContainer>
      {states.map(({ x, y, isAlive }) => {
        return <BoardCell key={`${x}/${y}`} x={x} y={y} isAlive={isAlive} />;
      })}
    </BoardContainer>
  );
}

type Pattern = (center?: Location) => Cell[];

const blinker2: Pattern = (center = { x: 0, y: 0 }): Cell[] => [
  { location: { x: center.x - 1, y: center.y }, state: "alive" },
  { location: { x: center.x, y: center.y }, state: "alive" },
  { location: { x: center.x + 1, y: center.y }, state: "alive" },
];

const glider: Pattern = (center = { x: 0, y: 0 }): Cell[] => [
  { location: { x: center.x - 1, y: center.y }, state: "alive" },
  { location: { x: center.x, y: center.y }, state: "alive" },
  { location: { x: center.x + 1, y: center.y }, state: "alive" },
  { location: { x: center.x + 1, y: center.y + 1 }, state: "alive" },
  { location: { x: center.x, y: center.y + 2 }, state: "alive" },
];

// pattern symmetries
const trans = (pattern: Pattern, relative: Location) => (center = { x: 0, y: 0 }) => pattern({ x: center.x + relative.x, y: center.y + relative.y })
const translate = (pattern: Pattern, relative: Location): Pattern => {
  const cells = pattern();
  return (center = { x: 0, y: 0 }): Cell[] => {
    const translated = cells.map((cell) => ({
      ...cell,
      location: {
        x: center.x + cell.location.x + relative.x,
        y: center.x + cell.location.y + relative.y,
      },
    }));
    return translated;
  };
};

const mirror = (pattern: Pattern, axis: "x" | "y"): Pattern => {
  const flip = axis === "x" ? 1 : -1;
  return (center: Location = { x: 0, y: 0 }): Cell[] => {
    const cells = pattern();
    const mirrored = cells.map((cell) => ({
      ...cell,
      location: {
        ...cell.location,
        x: flip * cell.location.x,
        y: -1 * flip * cell.location.y,
      },
    }));
    return mirrored;
  };
};
const mirrorX = (pattern: Pattern) => mirror(pattern, "x");
const mirrorY = (pattern: Pattern) => mirror(pattern, "y");

type RotationValue = 90 | 180 | 270 | -90 | -180 | -270;
type RotationDirection = "clockwise" | "counterclockwise";
type Rotation = {
  direction: RotationDirection;
  value: RotationValue;
  center: Location;
};
const rotate = (
  pattern: Pattern,
  value: RotationValue,
  direction: RotationDirection = "counterclockwise"
) => {
  return (center: Location = { x: 0, y: 0 }) =>
    pattern().map((p) => ({
      ...p,
      location: rotateLocation(p.location, { value, direction, center }),
    }));
};

function rotateLocation({ x, y }: Location, rotation: Rotation): Location {
  const flip = rotation.direction === "clockwise" ? 1 : -1;
  const rot90 = ({ x, y }: Location): Location => ({
    x: flip * (y - rotation.center.y),
    y: -1 * flip * (x - rotation.center.x),
  });
  const nrot90 = ({ x, y }: Location): Location => ({
    x: -1 * flip * (y - rotation.center.y),
    y: flip * (x - rotation.center.x),
  });
  const rot180 = ({ x, y }: Location): Location => ({ x: -y, y: -x });
  switch (rotation.value) {
    case 90:
    case -270:
      return rot90({ x, y });
    case -90:
    case 270:
      return nrot90({ x, y });
    case 180:
      return rot180({ x, y });
    default:
      throw new Error("");
  }
}

// const compose = (...cells: Cell[][]): Cell[] => {
//   return cells.flat(1);
// };
const compose = (...patterns: Pattern[]): Cell[] => {
  const cells = patterns.flatMap(pattern => pattern())
  return uniqueCells(cells.reverse())
};

const startingPattern: Cell[] = compose(
  // glider(),
  translate(glider, { x: 0, y: 6 }),
  rotate(glider, 90),
  rotate(trans(glider, { x: 6, y: 0 }), 90),
  // mirrorX(glider)({ x: 0, y: 6 })
  // mirrorY(glider)({ x: 0, y: 6 }),
  // blinker2({ x: -4, y: 3 }),
  // blinker2({ x: 4, y: -1 }),
  // rotate(blinker2, 90)({ x: 10, y: 10 }),
  // rotate(blinker2, 90)({ x: 12, y: 10 }),
  // rotate(blinker2, 90)({ x: 14, y: 10 })
);

export default function App() {
  const { world, isRunning, toggle, reset, next } = useGameOfLife({
    initial: startingPattern,
    tickRate: 10,
  });
  // React.useEffect(() => {
  //   console.log(`world: ${world.time.toString()}`, world);
  // }, [world]);
  return (
    <div className="App">
      <h1>Game of Life</h1>
      <Rules />
      <div>{world.time}</div>
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
