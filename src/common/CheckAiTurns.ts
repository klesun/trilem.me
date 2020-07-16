import {BoardState, Lobby, PlayerCodeName, Tile, TileModifier} from "../server/TypeDefs";
import FightSession from "../FightSession";
import {MOD_WALL, RES_GOLD, RES_OIL, RES_WHEAT, RESOURCES} from "../Constants";

const shouldImproveResource = (tile: Tile) => {
    if (tile.modifiers.includes(RES_GOLD)) {
        return Math.random() < 0.5;
    } else if (tile.modifiers.includes(RES_OIL)) {
        return Math.random() < 0.25;
    } else if (tile.modifiers.includes(RES_WHEAT)) {
        return Math.random() < 0.1;
    } else {
        return false;
    }
};

const shouldSecureTile = (owner: PlayerCodeName, neighborTiles: Tile[]) => {
    if (neighborTiles.length < 2) {
        // building a wall on a tile that has just on neighbor is effectively useless, as the
        // only way enemy can get here is from this exact neighbor tile you would try to secure
        return false;
    }
    const shouldBuildFactors = neighborTiles.map(neighbor => {
        if (neighbor.owner && neighbor.owner !== owner) {
            return 0.95;
        } else if (neighbor.modifiers.includes(RES_GOLD)) {
            return 0.9;
        } else if (neighbor.modifiers.includes(RES_OIL)) {
            return 0.45;
        } else if (neighbor.modifiers.includes(RES_WHEAT)) {
            return 0.25;
        } else if (neighbor.modifiers.includes(MOD_WALL)
                && neighbor.owner === owner
        ) {
            // if neighbor tile is already walled, it's nearly worthless from
            // strategic point of view when we decide whether it should be secured
            return 0.03;
        } else {
            return 0.09;
        }
    });
    let rollThreshold = 0;
    for (const factor of shouldBuildFactors) {
        rollThreshold += (1 - rollThreshold) * factor;
    }
    return Math.random() < rollThreshold;
};

const shouldSkipTurn = (tile: Tile, neighborTiles: Tile[]) => {
    if (tile.modifiers.includes(MOD_WALL)) {
        // can't build wall if there is already one
        return false;
    } else if (tile.modifiers.length > 0) {
        return shouldImproveResource(tile);
    } else {
        return shouldSecureTile(tile.owner, neighborTiles);
    }
};

const CheckAiTurns = ({boardState, lobby, fight}: {
    boardState: BoardState,
    lobby: Lobby,
    fight: ReturnType<typeof FightSession>,
}) => {
    const countTurnsSinceLastStep = (tile: Tile, codeName: PlayerCodeName) => {
        for (let i = 0; i < lobby.history.length; ++i) {
            const step = lobby.history[lobby.history.length - i - 1];
            if (step.col === tile.col &&
                step.row === tile.row &&
                step.codeName === codeName
            ) {
                return i;
            }
        }
        return Infinity;
    };

    const getSortValues = (tile: Tile, codeName: PlayerCodeName) => {
        const values = [];
        if (tile.owner === codeName) {
            values.push(true);
            values.push(-countTurnsSinceLastStep(tile, codeName));
        } else {
            values.push(false);
            values.push(tile.modifiers.includes(MOD_WALL));
            const resScore = RESOURCES.findIndex(r => {
                return tile.modifiers.includes(<TileModifier>r);
            });
            values.push(-resScore);
            // maybe not prioritize this player tile if he is losing?
            values.push(!tile.owner);
        }
        return values;
    };

    const compareTurns = (a: Tile, b: Tile, codeName: PlayerCodeName) => {
        const aSortValues = getSortValues(a, codeName);
        const bSortValues = getSortValues(b, codeName);
        for (let i = 0; i < Math.min(aSortValues.length, bSortValues.length); ++i) {
            const newVal = aSortValues[i];
            const oldVal = bSortValues[i];
            const sign =
                newVal > oldVal ? 1 :
                newVal < oldVal ? -1 : 0;
            if (sign) {
                return sign;
            }
        }
        return aSortValues.length - bSortValues.length;
    };

    const aiPlayerSlots = lobby.playerSlots
        .filter(slot => !lobby.players[slot.codeName]);
    let hadTurns = true;
    while (hadTurns) {
        hadTurns = false;
        for (const {codeName, aiBase} of aiPlayerSlots) {
            if (boardState.turnPlayersLeft.includes(codeName)) {
                hadTurns = true;
                const pos = boardState.playerToPosition[codeName];
                const tile = !pos ? null : boardState.tiles
                    .find(t => t.col === pos.col && t.row === pos.row);
                const possibleTurns = fight.getPossibleTurns(codeName);
                if (aiBase === 'SKIP_TURNS' || possibleTurns.length === 0) {
                    boardState = fight.skipTurn({codeName});
                } else if (aiBase === 'PURE_RANDOM') {
                    const {col, row} = possibleTurns[Math.floor(Math.random() * possibleTurns.length)];
                    boardState = fight.makeTurn({codeName, col, row});
                } else if (aiBase === 'LEAST_RECENT_TILES') {
                    if (tile && shouldSkipTurn(tile, fight.getNeighborTiles(tile))) {
                        boardState = fight.skipTurn({codeName});
                    } else {
                        const sorted = [...possibleTurns].sort((a, b) => {
                            return compareTurns(a, b, codeName);
                        });
                        const best = sorted.splice(0, 1)[0];
                        const sameWorth = sorted
                            .filter(t => compareTurns(best, t, codeName) === 0)
                            .concat([best]);

                        const {col, row} = sameWorth[Math.floor(Math.random() * sameWorth.length)];
                        boardState = fight.makeTurn({codeName, col, row});
                    }
                } else {
                    hadTurns = false;
                    throw new Error('Unsupported AI base - ' + aiBase);
                }
            }
        }
    }
    return boardState;

};

export default CheckAiTurns;