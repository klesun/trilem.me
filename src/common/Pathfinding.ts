import {BoardState, Tile} from "../server/TypeDefs";
import {countTurnsSkipped, getNeighborTiles} from "../FightSession";
const util = require('util')

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
    bestRoute: PathNodeResolved | null;
}

type PathNode = PathNodeStarted | PathNodeResolved;

const MAX_DEPTH = 15;

const flattenPath = (node: PathNodeResolved | null) => {
    const nodes: PathNodeResolved[] = [];
    while (node) {
        const {bestRoute, ...baseData} = node;
        nodes.push({...baseData, bestRoute: null});
        node = bestRoute;
    };
    return nodes;
};

export const getPathToClosestCapturableTile = ({startTile, possibleTurns, boardState}: {
    boardState: BoardState, startTile: Tile, possibleTurns: Tile[],
}): PathNodeResolved | null => {
    const colToRowToNode: Record<number, Record<number, {depth: number, node: PathNode}>> = {
        [startTile.col]: {
            [startTile.row]: {depth: 0, node: {resolved: false}},
        },
    };

    const makePathNode = (tile: Tile, depth: number): PathNodeResolved | null => {
        colToRowToNode[tile.col] = colToRowToNode[tile.col] || {};

        const cached = colToRowToNode[tile.col][tile.row] || null;
        if (cached && cached.depth <= depth) {
            if (cached.node.resolved) {
                return cached.node;
            } else {
                // circular path or dead end
                return null;
            }
        } else if (depth > MAX_DEPTH) {
            return null;
        }
        colToRowToNode[tile.col][tile.row] = {depth, node: {resolved: false}};

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
            const options = getNeighborTiles(tile, boardState)
                .map(tile => makePathNode(tile, depth + 1))
                .flatMap(node => node ? [node] : [])
                .sort((a, b) => a.bestRouteTurns - b.bestRouteTurns)
                .map(bestRoute => <PathNodeResolved>({
                    resolved: true,
                    col: tile.col,
                    row: tile.row,
                    bestRouteTurns: turnsSkipped + bestRoute.bestRouteTurns,
                    bestRoute: bestRoute,
                }));

            result = options[0] || null;
        }
        colToRowToNode[tile.col][tile.row] = {depth, node: result || {resolved: false}};
        return result;
    };

    const options = possibleTurns
        .map(tile => makePathNode(tile, 0))
        .flatMap(node => node ? [node] : []);

    return options.sort((a, b) => {
        return a.bestRouteTurns - b.bestRouteTurns;
    })[0] || null;
};