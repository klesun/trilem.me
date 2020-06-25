import {BUFF_SKIP_TURN, MOD_WALL, NO_RES_DEAD_SPACE, PLAYER_CODE_NAMES, RESOURCES} from "./Constants.js";

import DefaultBalance from './DefaultBalance.js';

const FallbackRej = {
    NotFound: msg => Promise.reject(msg + ' - NotFound'),
    Locked: msg => Promise.reject(msg + ' - Locked'),
    TooEarly: msg => Promise.reject(msg + ' - TooEarly'),
};

/**
 * actual game logic is located here
 *
 * @param {BoardState} boardState
 * @param {AiPlayerSlot[]} aiPlayerSlots
 */
const FightSession = ({
    boardState,
    Rej = FallbackRej,
    balance = DefaultBalance(),
    aiPlayerSlots = [],
}) => {

    /** @return {Tile} */
    const getTile = ({col, row}) => {
        // TODO: optimize - store as matrix!
        return boardState.tiles.find(t => t.col == col && t.row == row);
    };

    /** @return {Tile[]} */
    const getPossibleTurns = (codeName) => {
        const oldPos = boardState.playerToPosition[codeName];
        if (!oldPos) {
            return [];
        }
        const isEven = oldPos.col % 2 === 0;
        return [
            {col: oldPos.col + 1, row: oldPos.row},
            {col: oldPos.col - 1, row: oldPos.row},
            isEven
                ? {col: oldPos.col + 1, row: oldPos.row + 1}
                : {col: oldPos.col - 1, row: oldPos.row - 1},
        ].filter(
            turnPos => !Object.values(boardState.playerToPosition)
                .some(playerPos => {
                    return playerPos.col == turnPos.col
                        && playerPos.row == turnPos.row;
                })
        ).flatMap(pos => {
            const tile = getTile(pos);
            return tile ? [tile] : [];
        }).filter(tile => {
            return !tile.modifiers.includes(NO_RES_DEAD_SPACE);
        })
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

    const checkAiTurns = () => {
        for (const {codeName, aiBase} of aiPlayerSlots) {
            while (boardState.turnPlayersLeft.includes(codeName)) {
                const possibleTurns = getPossibleTurns(codeName);
                if (aiBase === 'SKIP_TURNS' || possibleTurns.length === 0) {
                    skipTurn({codeName});
                } else if (aiBase === 'PURE_RANDOM') {
                    const {col, row} = possibleTurns[Math.floor(Math.random() * possibleTurns.length)];
                    makeTurn({codeName, col, row});
                } else {
                    throw new Error('Unsupported AI base - ' + aiBase);
                }
            }
        }
    };

    const checkOnPlayerTurnEnd = () => {
        checkTurnPlayersLeft();
        try {
            checkAiTurns();
        } catch (exc) {
            exc.message = 'Failed to process AI turn - ' + exc;
        }
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
            if (!tile.modifiers.includes(MOD_WALL)) {
                tile.modifiers.push(MOD_WALL);
            }
        }
        checkOnPlayerTurnEnd();

        return boardState;
    };

    /** @param {MakeTurnParams} params */
    const makeTurn = (params) => {
        const {codeName, ...newPos} = params;
        const turnPlayerIdx = boardState.turnPlayersLeft.indexOf(codeName);
        if (turnPlayerIdx < 0) {
            const msg = 'It is not your turn yet, ' + codeName +
                ', please wait for other players: ' + boardState.turnPlayersLeft.join(', ');
            throw new Error(msg);
        }
        const possibleTurns = getPossibleTurns(codeName);
        const newTile = possibleTurns.find(tile => {
            return tile.col === newPos.col
                && tile.row === newPos.row;
        });
        if (!newTile) {
            throw new Error('Chosen tile is not in the list of available options');
        }

        boardState.playerToBuffs[codeName].push(...applyBuffs(newTile, codeName));

        newTile.owner = codeName;
        boardState.playerToPosition[codeName].row = newTile.row;
        boardState.playerToPosition[codeName].col = newTile.col;

        boardState.turnPlayersLeft.splice(turnPlayerIdx, 1);
        checkOnPlayerTurnEnd();

        return boardState;
    };

    return {
        getPossibleTurns: getPossibleTurns,
        skipTurn: skipTurn,
        makeTurn: makeTurn,
    };
};

export default FightSession;
