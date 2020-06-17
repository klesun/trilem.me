
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

const Api = () => {
    return {
        /** @return {Promise<BoardState>} */
        getBoardState: ({uuid = ''}) => get('/api/getBoardState', {uuid}),
        /** @param {MakeTurnParams} params */
        makeTurn: (params) => post('/api/makeTurn', params),
        skipTurn: (params) => post('/api/skipTurn', params),
    };
};

export const authenticate = async () => {
    const storageKey = 'TRILEMMA_AUTH_TOKEN';
    let whenExistingUser;
    const authToken = window.localStorage.getItem(storageKey);
    if (authToken) {
        whenExistingUser = post('/api/validateAuthToken', {authToken});
    } else {
        const msg = 'No token in local storage - first-time visitor';
        whenExistingUser = Promise.reject(msg);
    }
    const user = await whenExistingUser.catch(async exc => {
        console.warn('Auth token from local storage is not valid, registering new user', exc);
        const user = await post('/api/generateAuthToken');
        window.localStorage.setItem(storageKey, user.authToken);
        return user;
    });
    return {
        user,
        api: {
            changeUserName: ({name}) => post('/api/changeUserName', {authToken, name}),
        },
    };
};

export default Api;