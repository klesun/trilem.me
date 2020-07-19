import {BoardState, Tile} from "../server/TypeDefs";
import {countTurnsSkipped, getNeighborTiles} from "../FightSession";

type PathNodeStarted = {
    resolved: false;
}

type PathNodeResolved = {
    resolved: true;
    col: number;
    row: number;
    bestRouteTurns: number;
    /**
     * null means we reached the destination
     */
    bestRoute: PathNode | null;
}

type PathNode = PathNodeStarted | PathNodeResolved;

const MAX_DEPTH = 15;

export const getPathToClosestCapturableTile = ({startTile, possibleTurns, boardState}: {
    boardState: BoardState, startTile: Tile, possibleTurns: Tile[],
}): PathNodeResolved | null => {
    const colToRowToNode: Record<number, Record<number, PathNode>> = {
        [startTile.col]: {
            [startTile.row]: {resolved: false},
        },
    };

    const makePathNode = (tile: Tile, depth: number): PathNodeResolved | null => {
        colToRowToNode[tile.col] = colToRowToNode[tile.col] || {};

        const cached = colToRowToNode[tile.col][tile.row] || null;
        if (cached) {
            if (cached.resolved) {
                return cached;
            } else {
                // circular path or dead end
                return null;
            }
        } else if (depth > MAX_DEPTH) {
            return null;
        }
        colToRowToNode[tile.col][tile.row] = {resolved: false};

        const turnsSkipped = 1 + countTurnsSkipped({
            newTile: tile,
            codeName: startTile.owner,
            balance: boardState.balance,
        });
        let result: PathNodeResolved | null;
        if (tile.owner !== startTile.owner) {
            result = {
                resolved: true,
                col: tile.col,
                row: tile.row,
                bestRouteTurns: turnsSkipped,
                bestRoute: null,
            };
        } else {
            result = getNeighborTiles(tile, boardState)
                .map(tile => makePathNode(tile, depth + 1))
                .flatMap(node => node ? [node] : [])
                .sort((a, b) => a.bestRouteTurns - b.bestRouteTurns)
                .slice(0, 1)
                .map(bestRoute => <PathNodeResolved>({
                    resolved: true,
                    col: tile.col,
                    row: tile.row,
                    bestRouteTurns: turnsSkipped + bestRoute.bestRouteTurns,
                    bestRoute: bestRoute,
                }))[0] || null;
        }
        colToRowToNode[tile.col][tile.row] = result || {resolved: false};
        return result;
    };

    return possibleTurns
        .map(tile => makePathNode(tile, 0))
        .flatMap(node => node ? [node] : [])
        .sort((a, b) => {
            return a.bestRouteTurns - b.bestRouteTurns;
        })[0] || null;
};