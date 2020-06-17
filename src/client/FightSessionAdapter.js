import Api from "./Api.js";
import GenerateBoard from "../GenerateBoard.js";
import FightSession from "../FightSession.js";

const FORCE_HOT_SEAT = true;

/** @return {BoardState} */
export const getBoardState = async () => {
    if (FORCE_HOT_SEAT) {
        return {...GenerateBoard(), hotSeat: true};
    }
    return fetch('./api/getBoardState')
        .then(rs => rs.status !== 200
            ? Promise.reject(rs.statusText)
            : rs.json())
        .then(config => ({...config, hotSeat: false}))
        .catch(exc => {
            alert('Failed to fetch data from server. Falling back to hot-seat board. ' + exc);
            return {...GenerateBoard(), hotSeat: true};
        });
};

/**
 * encapsulates the communication with server that can
 * be transparently switched to offline hot-seat game
 *
 * @param {BoardState} boardState
 * @param matrix = TileMapDisplay()
 */
const FightSessionAdapter = (initialBoardState) => {
    let boardState = initialBoardState;
    const api = Api();

    const makeTurn = async (codeName, newTile) => {
        /** @type {MakeTurnParams} */
        const params = {
            uuid: initialBoardState.uuid,
            codeName: codeName,
            col: newTile.col,
            row: newTile.row,
            svg: newTile.svgEl,
        };
        if (!initialBoardState.hotSeat) {
            return boardState = await api.makeTurn(params);
        } else {
            return boardState = await FightSession({boardState}).makeTurn(params);
        }
    };

    const skipTurn = async (codeName) => {
        const params = {
            uuid: initialBoardState.uuid,
            codeName: codeName,
        };
        if (!boardState.hotSeat) {
            return boardState = await api.skipTurn(params);
        } else {
            return boardState = await FightSession({boardState}).skipTurn(params);
        }
    };

    const checkForUpdates = async () => {
        boardState = await api.getBoardState({uuid: initialBoardState.uuid});
        return true; // should eventually return false if no changes happened
    };

    return {
        makeTurn: makeTurn,
        skipTurn: skipTurn,
        // TODO: better ask server to make sure we can handle non-standard balance
        getPossibleTurns: (codeName) => FightSession({boardState})
            .getPossibleTurns(codeName),
        getState: () => boardState,
        checkForUpdates: checkForUpdates,
    };
};

export default FightSessionAdapter;