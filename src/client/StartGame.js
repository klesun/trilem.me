import SoundManager from "./SoundManager.js";
import TileMapDisplay from "./TileMapDisplay.js";
import StatsTable, {calcScore, collectPlayerResources} from "./StatsTable.js";
import GetTurnInput from "./GetTurnInput.js";
import drawHint from "./ScoreHint.js";
import {RESOURCES} from "../Constants.js";

let releaseInput = () => {};

let firstBloodSpilled = false;

const setupBoard = async ({fightSession, gui}) => {
    const boardState = fightSession.getState();

    [...gui.gameRules.querySelectorAll('[data-balance-value]')].forEach(holder => {
        holder.textContent = boardState.balance[holder.getAttribute('data-balance-value')];
    });

    const matrix = TileMapDisplay(boardState, gui.tileMapHolder);
    const statsTable = StatsTable(gui.playerList, boardState);

    const getTile = ({col, row}) => {
        return (matrix[row] || {})[col] || null;
    };

    return {fightSession, getTile, statsTable};
};

const StartGame = async ({fightSession, codeName, gui}) => {
    releaseInput();
    const soundManager = SoundManager(gui.soundSwitches);
    const {getTile, statsTable} = await setupBoard({fightSession, gui});

    const updateComponents = (boardState) => {
        TileMapDisplay.updateTilesState(boardState, getTile);
        const currentTurnPlayer = boardState.turnPlayersLeft[0];
        statsTable.update(currentTurnPlayer, boardState);
    };

    const processTurn = async (codeName) => {
        while (true) {
            const input = GetTurnInput({
                currentSvgEl: gui.tileMapHolder.querySelector(`[data-stander=${codeName}]`),
                possibleTurns: (await fightSession.getPossibleTurns(codeName)).map(getTile),
                skipButton: gui.skip,
            });
            releaseInput = input.cancel;
            let newTile = null;
            try {
                newTile = await input.whenTile;
            } catch (exc) {
                // TODO: programmatic!
                if (exc === 'OLOLO_CANCELLED_BY_GAME') {
                    break;
                }
            }
            if (!newTile) {
                try {
                    await fightSession.skipTurn(codeName);
                    updateComponents(fightSession.getState());
                    break;
                } catch (exc) {
                    alert('Failed to skip this turn - ' + exc);
                    continue;
                }
            }
            const lastOwner = newTile.svgEl.getAttribute('data-owner');
            const interactionKind = lastOwner && lastOwner !== codeName
                ? newTile.svgEl.classList.contains('modifier--WALL')
                    ? 'BREAK_WALL'
                    : 'RETAKE_TILE'
                : newTile.svgEl.classList.contains('modifier--WALL')
                    ? 'VISIT_WALL'
                    : 'VISIT_TILE';
            const lastReses = collectPlayerResources(fightSession.getState())[codeName];
            const lastScore = calcScore(lastReses);
            try {
                await fightSession.makeTurn(codeName, newTile);
                updateComponents(fightSession.getState());

                const reses = collectPlayerResources(fightSession.getState())[codeName];
                const scoreDiff = calcScore(reses) - lastScore;

                const tile = fightSession.getState().tiles
                    .find( t => t.row === newTile.row && t.col === newTile.col );

                if (tile.modifiers.some(mod => RESOURCES.includes(mod)) && lastOwner !== codeName) {
                    drawHint(newTile.svgEl, codeName, scoreDiff >= 0 ? '+' + scoreDiff.toFixed() : scoreDiff.toFixed());
                }
            } catch (exc) {
                alert('Failed to make this turn - ' + exc);
                continue;
            }
            if (lastOwner && lastOwner !== codeName && !firstBloodSpilled) {
                firstBloodSpilled = true;
                soundManager.playFirstBloodSound();
            }
            soundManager.playMoveSound(interactionKind);

            break;
        }
    };

    /** sorry if this is a shitcode, I'm yet to learn how to work with such constructs properly */
    let discarded = false;
    const discard = () => discarded = true;

    const startGame = async () => {
        updateComponents(fightSession.getState());
        while (fightSession.getState().turnPlayersLeft.length > 0) {
            if (discarded) {
                return;
            }
            if (!fightSession.getState().turnPlayersLeft.includes(codeName)) {
                // TODO: pass web socket event here instead of this
                await new Promise((ok) => setTimeout(ok, 50));
                continue; // waiting for other players turns
            }
            gui.turnsLeftHolder.textContent = fightSession.getState().turnsLeft;
            updateComponents(fightSession.getState());

            await processTurn(codeName).catch(exc => {
                alert('Unexpected failure while processing turn - ' + exc);
                throw exc;
            });
        }

        const winners = statsTable.getWinners();

        alert('The winner is ' + winners.join(' and '));
    };

    const updateStateFromServer = async (boardState) => {
        updateComponents(boardState);
        releaseInput();
        releaseInput = () => {};
    };

    const whenFinished = startGame();

    return {
        whenFinished: whenFinished,
        updateStateFromServer: updateStateFromServer,
        discard: discard,
    };
};

export default StartGame;
