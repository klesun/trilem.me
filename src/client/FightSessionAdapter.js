import Api from "./Api.js";
import FightSession from "../FightSession.js";

/**
 * encapsulates the communication with server that can
 * be transparently switched to offline hot-seat game
 *
 * @param {BoardState} initialBoardState
 */
const FightSessionAdapter = ({initialBoardState, api}) => {
    let boardState = initialBoardState;

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

    const getPossibleTurns = async (codeName) => {
        const params = {
            uuid: initialBoardState.uuid,
            codeName: codeName,
        };
        if (!boardState.hotSeat) {
            return Api().getPossibleTurns(params);
        } else {
            return FightSession({boardState})
                .getPossibleTurns(codeName);
        }
    };

    return {
        makeTurn: makeTurn,
        skipTurn: skipTurn,
        getPossibleTurns: getPossibleTurns,
        getState: () => boardState,
        setState: (newState) => boardState = newState,
    };
};

export default FightSessionAdapter;