import GenerateBoard from "../GenerateBoard";
import * as http from "http";
import {randomBytes} from "crypto";
import FightSession from "../FightSession";
import {BoardState, BoardUuid, CreateLobbyParams, PlayerCodeName, PlayerId, SerialData, User} from "./TypeDefs";
import {PLAYER_CODE_NAMES, PLAYER_KEANU, PLAYER_MORPHEUS, PLAYER_TRINITY} from "../Constants";

const Rej = require('klesun-node-tools/src/Rej.js');
const {coverExc} = require('klesun-node-tools/src/Lang.js');

const uuidToBoard: Record<BoardUuid, BoardState> = {};
const authTokenToUserId: Record<string, number> = {};
const users: User[] = [];

type Lobby = CreateLobbyParams & {
    boardUuid: BoardUuid,
    players: Record<PlayerCodeName, PlayerId>,
};
const boardUuidToLobby: Record<BoardUuid, Lobby> = {};

const setupBoard = () => {
    const board = GenerateBoard();
    uuidToBoard[board.uuid] = board;
    return board;
};

const readPost = (rq: http.IncomingMessage) => new Promise<string>((ok, err) => {
    if (rq.method === 'POST') {
        let body = '';
        rq.on('data', (data: string) => body += data);
        rq.on('error', (exc: any) => err(exc));
        rq.on('end', () => ok(body));
    } else {
        ok('');
    }
});

const readJson = async (rq: http.IncomingMessage) => {
    const postStr = await readPost(rq);
    if (!postStr) {
        const msg = 'POST body missing, must be a JSON string';
        return Rej.BadRequest(msg);
    }
    return JSON.parse(postStr);
};

const addUserWithToken = (authToken: string) => {
    const id = users.length + 1;
    const name = 'anon' + id;
    users.push({name, id});
    authTokenToUserId[authToken] = id;
    return {name, id};
};

const generateAuthToken = () => {
    const authToken = randomBytes(32).toString('hex');
    const {name, id} = addUserWithToken(authToken);
    return {authToken, name, id};
};

const getUserByToken = (authToken: string) => {
    if (!authToken) {
        return Rej.BadRequest('authToken parameter not supplied');
    }
    const id = authTokenToUserId[authToken];
    if (!id) {
        return Rej.NotAuthorized('No users exist with such authToken');
    } else if (!users[id - 1]) {
        return Rej.InternalServerError('No data found for user #' + id);
    } else {
        return Promise.resolve(users[id - 1]);
    }
};

const validateAuthToken = async (rq: http.IncomingMessage) => {
    const {authToken} = await readJson(rq);
    return getUserByToken(authToken)
        .catch(coverExc([Rej.NotAuthorized], () => {
            return addUserWithToken(authToken);
        }));
};

const changeUserName = async (rq: http.IncomingMessage) => {
    const {authToken, name} = await readJson(rq);
    const user = await getUserByToken(authToken);
    if (!name) {
        return Rej.BadRequest('name parameter not supplied');
    } else if (typeof name !== 'string') {
        return Rej.BadRequest('name must be a string');
    } else if (name.length > 100) {
        return Rej.BadRequest('name length must not exceed 100 characters');
    }
    user.name = name;
    return Promise.resolve(user);
};

const leaveLobby = (user: User, lobby: Lobby) => {
    const boardUuid = lobby.boardUuid;
    const codeNames: PlayerCodeName[] = Object
        .keys(boardUuidToLobby[boardUuid].players)
        .map(k => <PlayerCodeName>k);
    for (const codeName of codeNames) {
        if (lobby.players[codeName] === user.id) {
            delete lobby.players[codeName];
        }
    }
    if (Object.keys(boardUuidToLobby[boardUuid].players).length === 0) {
        delete boardUuidToLobby[boardUuid];
    }
};

const leaveAllLobbies = (user: User) => {
    for (const [boardUuid, lobby] of Object.entries(boardUuidToLobby)) {
        leaveLobby(user, lobby);
    }
};

const createLobbyBy = async ({user, params}: {
    user: User, params: CreateLobbyParams,
}) => {
    const board = setupBoard();
    const players = <Record<PlayerCodeName, PlayerId>>{
        [PLAYER_KEANU]: user.id,
    };
    const lobby: Lobby = {
        ...params,
        boardUuid: board.uuid,
        players: players,
    };
    boardUuidToLobby[board.uuid] = lobby;
    return {lobby, board};
};

const createLobby = async (rq: http.IncomingMessage) => {
    const {authToken, ...params} = await readJson(rq);
    const user = await getUserByToken(authToken);
    leaveAllLobbies(user);
    return createLobbyBy({user, params});
};

const joinLobbyBy = async ({user, codeName, lobby}: {
    user: User, codeName: PlayerCodeName, lobby: Lobby,
}) => {
    if (!lobby) {
        return Rej.NotFound('Lobby not found');
    }
    const takenUserId = lobby.players[<PlayerCodeName>codeName];
    if (takenUserId) {
        return Rej.Locked('Slot ' + codeName + ' is already taken by player #' + takenUserId);
    }
    leaveAllLobbies(user);
    lobby.players[<PlayerCodeName>codeName] = user.id;
    return {lobby, board: uuidToBoard[lobby.boardUuid]};
};

const joinLobby = async (rq: http.IncomingMessage) => {
    const {authToken, codeName, boardUuid} = await readJson(rq);
    const user = await getUserByToken(authToken);
    const lobby = boardUuidToLobby[boardUuid];
    return joinLobbyBy({user, codeName, lobby});
};

const getLobby = async (rq: http.IncomingMessage) => {
    const {authToken} = await readJson(rq);
    const user = await getUserByToken(authToken);
    const availableLobbies = [];
    for (const [boardUuid, lobby] of Object.entries(boardUuidToLobby)) {
        const participantIds = Object.values(lobby.players);
        const availableSlots = (<PlayerCodeName[]>PLAYER_CODE_NAMES)
            .filter((codeName) => !lobby.players[codeName]);
        if (participantIds.includes(user.id)) {
            const board = uuidToBoard[boardUuid];
            if (board.turnsLeft <= 0) {
                leaveLobby(user, lobby);
            } else {
                return {lobby, board};
            }
        } else if (availableSlots.length > 0) {
            availableLobbies.push({lobby, availableSlots});
        }
    }
    if (availableLobbies.length > 0) {
        const {lobby, availableSlots} = availableLobbies[0];
        return joinLobbyBy({user, codeName: availableSlots[0], lobby});
    } else {
        return createLobbyBy({
            user, params: {
                name: 'by ' + user.name,
                playerSlots: [
                    {aiBase: 'PURE_RANDOM', codeName: PLAYER_TRINITY},
                    {aiBase: 'PURE_RANDOM', codeName: PLAYER_MORPHEUS},
                ],
            }
        })
    }
};

const getFight = async (rq: http.IncomingMessage) => {
    const {uuid, authToken, ...actionParams} = await readJson(rq);
    const boardState = uuidToBoard[uuid];
    if (!boardState) {
        return Rej.NotFound('Board ' + uuid + ' not found');
    }
    const lobby = boardUuidToLobby[boardState.uuid] || null;
    if (!lobby) {
        return Rej.NotFound('Lobby ' + boardState.uuid + ' does not exist');
    }
    const user = await getUserByToken(authToken);
    const codeName = Object.entries(lobby.players)
        .flatMap(([codeName, id]) => id === user.id ? [codeName] : [])[0];
    if (!codeName) {
        return Rej.BadRequest('You are not participating in this match');
    }
    const aiPlayerSlots = !lobby ? [] : lobby.playerSlots
        .filter(slot => !lobby.players[slot.codeName]);
    const fight = FightSession({boardState, Rej, aiPlayerSlots});

    return {fight, codeName, actionParams};
};

const makeTurn = async (rq: http.IncomingMessage) => {
    const {fight, codeName, actionParams} = await getFight(rq);
    return fight.makeTurn({...actionParams, codeName});
};

const skipTurn = async (rq: http.IncomingMessage) => {
    const {fight, codeName, actionParams} = await getFight(rq);
    return fight.skipTurn({...actionParams, codeName});
};

const getBoardState = (rq: http.IncomingMessage) => {
    const urlObj = new URL('https://zhopa.com' + rq.url).searchParams;
    const uuid = urlObj.get('uuid');
    if (uuid) {
        if (uuidToBoard[uuid]) {
            return uuidToBoard[uuid];
        } else {
            return Rej.NotFound('Board ' + uuid + ' not found');
        }
    }
    const firstBoard = Object.values(uuidToBoard)[0];
    if (firstBoard) {
        if (firstBoard.turnsLeft <= 0) {
            delete uuidToBoard[firstBoard.uuid];
        } else {
            return firstBoard;
        }
    }
    return setupBoard();
};

const getLobbyList = (rq: http.IncomingMessage) => ({
    boardUuidToLobby: boardUuidToLobby,
    uuidToBoard: uuidToBoard,
    users: users,
});

const getPossibleTurns = (rq: http.IncomingMessage) => {
    const {searchParams} = new URL('https://zhopa.com' + rq.url);
    const uuid = searchParams.get('uuid');
    const codeName = searchParams.get('codeName');
    if (!uuid) {
        return Rej.BadRequest('uuid GET parameter is required');
    } else if (!codeName || !PLAYER_CODE_NAMES.includes(codeName)) {
        return Rej.BadRequest('codeName GET parameter must be one of ' + PLAYER_CODE_NAMES.join(', '));
    }
    const boardState = uuidToBoard[uuid];
    if (!boardState) {
        return Rej.NotFound('Board ' + uuid + ' not found');
    }
    const fight = FightSession({boardState, Rej});
    return fight.getPossibleTurns(codeName);
};

export type GetLobbyListResult = ReturnType<typeof getLobbyList>;

const routes: Record<string, (rq: http.IncomingMessage) => Promise<SerialData> | SerialData> = {
    // auth required API-s
    '/api/generateAuthToken': generateAuthToken,
    '/api/validateAuthToken': validateAuthToken,
    '/api/changeUserName': changeUserName,
    '/api/createLobby': createLobby,
    '/api/joinLobby': joinLobby,
    '/api/getLobby': getLobby,
    '/api/makeTurn': makeTurn,
    '/api/skipTurn': skipTurn,

    // no auth API-s
    '/api/getBoardState': getBoardState,
    '/api/setupBoard': setupBoard,
    '/api/getLobbyList': getLobbyList,
    '/api/getPossibleTurns': getPossibleTurns,
};

const Api = {
    routes: routes,
};

export default Api;