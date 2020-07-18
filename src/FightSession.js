import {BUFF_SKIP_TURN, MOD_WALL, NO_RES_DEAD_SPACE, PLAYER_CODE_NAMES, RESOURCES} from "./Constants.js";

import DefaultBalance from './DefaultBalance.js';

/**
 * actual game logic is located here
 *
 * @param {BoardState} boardState
 * @param {AiPlayerSlot[]} aiPlayerSlots
 */
const FightSession = ({
    boardState,
    balance = DefaultBalance(),
    history = [],
}) => {

    /** @return {Tile} */
    const getTile = ({col, row}) => {
        // TODO: optimize - store as matrix!
        return boardState.tiles.find(t => t.col == col && t.row == row);
    };

    /** @param {Tile} oldPos */
    const getNeighborTiles = (oldPos) => {
        const isEven = (oldPos.col % 2 === 0) === (oldPos.row % 2 === 0);
        const pointsDown = isEven === boardState.firstPointsDown;
        return [
            {col: oldPos.col + 1, row: oldPos.row},
            {col: oldPos.col - 1, row: oldPos.row},
            !pointsDown
                ? {col: oldPos.col, row: oldPos.row + 1}
                : {col: oldPos.col, row: oldPos.row - 1},
        ].flatMap(pos => {
            const tile = getTile(pos);
            return tile ? [tile] : [];
        }).filter(tile => {
            return !tile.modifiers.includes(NO_RES_DEAD_SPACE);
        })
    };

    /** @return {Tile[]} */
    const getPossibleTurns = (codeName) => {
        const oldPos = boardState.playerToPosition[codeName];
        if (!oldPos) {
            return [];
        }
        return getNeighborTiles(oldPos).filter(
            turnPos => !Object.values(boardState.playerToPosition)
                .some(playerPos => {
                    return playerPos.col == turnPos.col
                        && playerPos.row == turnPos.row;
                })
        );
    };

    const checkTurnPlayersLeft = () => {
        if (boardState.turnPlayersLeft.length === 0) {
            while (boardState.turnsLeft > 0 && boardState.turnPlayersLeft.length === 0) {
                --boardState.turnsLeft;
                for (const codeName of PLAYER_CODE_NAMES) {
                    const buffIdx = boardState.playerToBuffs[codeName].indexOf(BUFF_SKIP_TURN);
                    if (buffIdx > -1) {
                        boardState.playerToBuffs[codeName].splice(buffIdx, 1);
                    } else if (getPossibleTurns(codeName).length > 0) {
                        boardState.turnPlayersLeft.push(codeName);
                    }
                }
            }
        }
    };

    const checkOnPlayerTurnEnd = () => {
        checkTurnPlayersLeft();
    };

    /** @param {Tile} newTile */
    const applyBuffs = (newTile, codeName) => {
        const buffs = [];

        const isResource = newTile.modifiers.some(mod => RESOURCES.includes(mod));
        let turnsSkipped = 0;
        if (!newTile.owner) {
            turnsSkipped = isResource
                ? balance.TURNS_SKIPPED_ON_STEP_NEUTRAL_EMPTY
                : balance.TURNS_SKIPPED_ON_STEP_NEUTRAL_RESOURCE;
        } else {
            if (newTile.owner === codeName) {
                if (newTile.modifiers.includes(MOD_WALL)) {
                    turnsSkipped = balance.TURNS_SKIPPED_ON_STEP_OWN_WALL;
                } else if (isResource) {
                    turnsSkipped = balance.TURNS_SKIPPED_ON_STEP_OWN_RESOURCE;
                } else {
                    turnsSkipped = balance.TURNS_SKIPPED_ON_STEP_OWN_EMPTY;
                }
            } else {
                if (newTile.modifiers.includes(MOD_WALL)) {
                    newTile.modifiers.splice(newTile.modifiers.indexOf(MOD_WALL), 1);
                    turnsSkipped = balance.TURNS_SKIPPED_ON_STEP_ENEMY_WALL;
                } else if (isResource) {
                    turnsSkipped = balance.TURNS_SKIPPED_ON_STEP_ENEMY_RESOURCE;
                } else {
                    turnsSkipped = balance.TURNS_SKIPPED_ON_STEP_ENEMY_EMPTY;
                }
            }
        }
        for (let i = 0; i < turnsSkipped; ++i) {
            buffs.push(BUFF_SKIP_TURN);
        }

        return buffs;
    };

    const skipTurn = ({codeName}) => {
        const turnPlayerIdx = boardState.turnPlayersLeft.indexOf(codeName);
        if (turnPlayerIdx < 0) {
            const msg = 'It is not your turn yet, ' + codeName +
                ', please wait for other players: ' + boardState.turnPlayersLeft.join(', ');
            throw new Error(msg);
        }

        boardState.turnPlayersLeft.splice(turnPlayerIdx, 1);
        const pos = boardState.playerToPosition[codeName];
        if (pos) {
            const tile = getTile(pos);
            if (RESOURCES.some(r => tile.modifiers.includes(r))) {
                ++tile.improvementsBuilt;
            } else if (!tile.modifiers.includes(MOD_WALL)) {
                tile.modifiers.push(MOD_WALL);
            }
            history.push({codeName, col: pos.col, row: pos.row});
        }
        checkOnPlayerTurnEnd();

        return boardState;
    };

    /** @param {MakeTurnParams} params */
    const makeTurn = (params) => {
        const {codeName, col, row} = params;
        const turnPlayerIdx = boardState.turnPlayersLeft.indexOf(codeName);
        if (turnPlayerIdx < 0) {
            const msg = 'It is not your turn yet, ' + codeName +
                ', please wait for other players: ' + boardState.turnPlayersLeft.join(', ');
            throw new Error(msg);
        }
        const possibleTurns = getPossibleTurns(codeName);
        const newTile = possibleTurns.find(tile => {
            return tile.col === col
                && tile.row === row;
        });
        if (!newTile) {
            throw new Error(`Chosen tile ${row}x${col} is not in the list of available options`);
        }

        boardState.playerToBuffs[codeName].push(...applyBuffs(newTile, codeName));

        newTile.owner = codeName;
        boardState.playerToPosition[codeName].row = newTile.row;
        boardState.playerToPosition[codeName].col = newTile.col;
        history.push({codeName, col, row});

        boardState.turnPlayersLeft.splice(turnPlayerIdx, 1);
        checkOnPlayerTurnEnd();

        return boardState;
    };

    return {
        getPossibleTurns: getPossibleTurns,
        getNeighborTiles: getNeighborTiles,
        skipTurn: skipTurn,
        makeTurn: makeTurn,
    };
};

export default FightSession;
