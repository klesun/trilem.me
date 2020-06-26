import {BoardState, Lobby, PlayerCodeName, Tile, TileModifier} from "../server/TypeDefs";
import FightSession from "../FightSession";
import {MOD_WALL, RES_GOLD, RES_OIL, RES_WHEAT, RESOURCES} from "../Constants";

const shouldBuildWall = (tile: Tile) => {
    if (tile.modifiers.includes(MOD_WALL)) {
        return false;
    }
    return tile.modifiers.includes(RES_GOLD) && Math.random() < 0.9
        || tile.modifiers.includes(RES_OIL) && Math.random() < 0.45
        || tile.modifiers.includes(RES_WHEAT) && Math.random() < 0.15
        || Math.random() < 0.09;
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
                    if (tile && shouldBuildWall(tile)) {
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