
const get = (route, params) => {
    return fetch(route + '?' + new URLSearchParams(params))
        .then(rs => rs.status !== 200
            ? Promise.reject(rs.statusText)
            : rs.json());
};

const post = (route, params) => {
    return fetch(route, {
        method: 'POST',
        body: JSON.stringify(params),
    }).then(rs => rs.status !== 200
        ? Promise.reject(rs.statusText)
        : rs.json());
};

/** public API, no auth required */
const Api = () => {
    return {
        /** @return {Promise<GetLobbyListResult>} */
        getLobbyList: () => get('/api/getLobbyList'),
        /** @return {Promise<BoardState>} */
        getBoardState: ({uuid = ''}) => get('/api/getBoardState', {uuid}),
        getPossibleTurns: (params) => get('/api/getPossibleTurns', params),
    };
};

export const authenticate = async () => {
    const storageKey = 'TRILEMMA_AUTH_TOKEN';
    let user;
    let authToken = window.localStorage.getItem(storageKey);
    if (authToken) {
        user = await post('/api/validateAuthToken', {authToken});
    } else {
        ({authToken, ...user} = await post('/api/generateAuthToken'));
        window.localStorage.setItem(storageKey, authToken);
    }
    return {
        user,
        /** auth-only API */
        api: {
            changeUserName: ({name}) => post('/api/changeUserName', {authToken, name}),
            createLobby: (params) => post('/api/createLobby', {authToken, ...params}),
            joinLobby: (params) => post('/api/joinLobby', {authToken, ...params}),
            getLobby: () => post('/api/getLobby', {authToken}),
            /** @param {MakeTurnParams} params */
            makeTurn: (params) => post('/api/makeTurn', {authToken, ...params}),
            skipTurn: (params) => post('/api/skipTurn', {authToken, ...params}),
        },
    };
};

export default Api;