
const TOKEN_STORAGE_KEY = 'TRILEMMA_AUTH_TOKEN';
const NAME_STORAGE_KEY = 'TRILEMMA_AUTH_NAME';

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
        getPossibleTurns: (params) => get('/api/getPossibleTurns', params),
    };
};

const changeUserName = ({authToken, name}) => post(
    '/api/changeUserName', {authToken, name}
).then(rs => {
    window.localStorage.setItem(NAME_STORAGE_KEY, name);
    return rs;
});

const AuthApi = authToken => ({
    changeUserName: (params) => changeUserName({authToken, ...params}),
    createLobby: (params) => post('/api/createLobby', {authToken, ...params}),
    joinLobby: (params) => post('/api/joinLobby', {authToken, ...params}),
    getLobby: () => post('/api/getLobby', {authToken}),
    /** @param {MakeTurnParams} params */
    makeTurn: (params) => post('/api/makeTurn', {authToken, ...params}),
    skipTurn: (params) => post('/api/skipTurn', {authToken, ...params}),
});

export const authenticate = async () => {
    let user;
    let authToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (authToken) {
        user = await post('/api/validateAuthToken', {authToken});
    } else {
        ({authToken, ...user} = await post('/api/generateAuthToken'));
        window.localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
    }
    if (user.isNew) {
        const cachedName = window.localStorage.getItem(NAME_STORAGE_KEY);
        if (cachedName) {
            await changeUserName({authToken, name: cachedName})
                .then(() => user.name = cachedName)
                .catch(exc => null);
        }
        window.localStorage.setItem(NAME_STORAGE_KEY, user.name);
    }
    return {
        user,
        api: AuthApi(authToken),
    };
};

export default Api;