import {Svg} from "./client/Dom.js";
import {RES_GOLD, RES_OIL, RES_WHEAT} from "./Constants.js";

const TILE_WIDTH = 60;
const TILE_HEIGHT = Math.sqrt(3) * TILE_WIDTH / 2;

const resourceSvgs = {
    [RES_WHEAT]: (isEven) => Svg('path',{
        d: 'm512 33.83v-18.83c0-8.284-6.716-15-15-15h-18.831c-46.329 0-83.766 24.687-104.726 56.938-5.488-12.033-13.141-23.111-22.772-32.738-10.454-10.461-19.798-19.806-19.798-19.806-5.857-5.858-15.355-5.858-21.213 0l-19.8 19.8c-21.147 21.138-32.793 49.255-32.793 79.173 0 7.704.778 15.287 2.286 22.664-1.629-1.856-3.319-3.67-5.082-5.432l-19.797-19.805c-5.858-5.859-15.361-5.853-21.214 0l-19.8 19.8c-21.147 21.138-32.793 49.256-32.793 79.173 0 7.704.778 15.288 2.286 22.665-1.629-1.856-3.319-3.67-5.082-5.432l-19.797-19.806c-2.813-2.813-6.628-4.394-10.606-4.394-3.978 0-7.793 1.581-10.606 4.394l-19.801 19.8c-43.278 43.259-44.195 114.169-.002 158.344l9.196 9.196-101.861 101.86c-5.858 5.858-5.858 15.355 0 21.213 5.857 5.858 15.355 5.858 21.213 0l101.858-101.858 9.193 9.196c21.153 21.144 49.27 32.789 79.168 32.789 12.39 0 48.28-1.905 79.179-32.791l19.803-19.803c2.813-2.813 4.394-6.628 4.394-10.606 0-3.979-1.581-7.794-4.394-10.607l-19.805-19.804c-1.76-1.76-3.573-3.447-5.427-5.074 7.373 1.507 14.952 2.285 22.65 2.285h.008c29.899 0 58.015-11.645 79.171-32.792l19.802-19.802c5.858-5.858 5.853-15.361 0-21.214l-19.804-19.804c-1.76-1.76-3.574-3.447-5.427-5.074 7.373 1.507 14.952 2.285 22.65 2.285h.008c29.899 0 58.016-11.645 79.171-32.791l19.802-19.802c5.858-5.857 5.858-15.355 0-21.213l-19.805-19.805c-9.635-9.631-20.717-17.283-32.752-22.769 32.225-20.945 56.95-58.324 56.95-104.723zm-200.929 11.579 9.194-9.194c2.791 2.792 5.937 5.94 9.191 9.197 32.011 31.997 32.071 83.854-.006 115.917l-9.186 9.189-9.195-9.196c-31.73-31.715-32.31-83.614.002-115.913zm-26.289 131.704c1.628 1.853 3.316 3.666 5.076 5.425l39.598 39.606c1.761 1.76 3.574 3.448 5.428 5.075-22.801-4.661-41.561-1.187-51.576 1.473 2.667-10.043 6.13-28.8 1.474-51.579zm-70.111-35.304 9.193-9.194 9.192 9.196c32.011 31.997 32.071 83.854-.006 115.917l-9.186 9.189-9.195-9.196c-31.723-31.709-32.317-83.606.002-115.912zm-26.29 131.702c1.628 1.854 3.316 3.666 5.077 5.426l39.598 39.607c1.761 1.76 3.574 3.448 5.428 5.075-22.801-4.661-41.561-1.187-51.578 1.473 2.668-10.043 6.132-28.8 1.475-51.581zm-51.731 80.618-9.186 9.189-9.196-9.196c-31.72-31.707-32.32-83.604.002-115.913l9.194-9.194 9.192 9.196c32.011 31.996 32.071 83.854-.006 115.918zm137.143 39.598c-15.487 15.481-36.071 24.006-57.959 24.006-9.159 0-35.385-1.434-57.962-24l-9.196-9.2 9.19-9.193c32.021-32.008 83.856-32.059 115.926-.002l9.196 9.196zm96.4-96.4c-31.791 31.777-83.647 32.267-115.922.006l-9.195-9.2 9.189-9.193c32.022-32.009 83.855-32.059 115.926-.002l9.196 9.196zm96.398-114.789 9.195 9.195-9.193 9.193c-31.793 31.78-83.652 32.263-115.922.006-3.255-3.258-6.404-6.408-9.195-9.201l9.189-9.192c32.023-32.009 83.857-32.056 115.926-.001zm-79.302-54.005h-3.822v-3.83c0-52.401 42.418-94.703 94.703-94.703h3.83v3.83c0 52.702-42.805 94.703-94.711 94.703z',
        'transform-origin': isEven ? '15px 20px' : '20px 6px',
        class: 'resource-svg wheat-resource-svg',
    }),
    [RES_OIL]: (isEven) => Svg('path',{
        d: "M283.897,92.846c-36.582-49.345-73.688-89.267-74.061-89.664C207.944,1.153,205.296,0,202.523,0\n" +
            "\t\tc-2.774,0-5.423,1.152-7.314,3.182c-0.371,0.397-37.478,40.319-74.06,89.664c-49.971,67.403-75.308,119.726-75.308,155.513\n" +
            "\t\tc0,86.396,70.287,156.688,156.682,156.688c86.396,0,156.683-70.29,156.683-156.688C359.206,212.572,333.868,160.25,283.897,92.846z\n" +
            "\t\t M218.171,354.342c-8.213,1.941-16.68,2.926-25.162,2.926c-60.294,0-109.347-49.055-109.347-109.35\n" +
            "\t\tc0-8.312,2.559-23.373,14.75-47.914c1.225-2.467,4.046-3.691,6.687-2.908c2.639,0.785,4.33,3.357,4.007,6.091\n" +
            "\t\tc-0.28,2.361-0.421,4.584-0.421,6.607c0,64.629,45.966,120.77,109.298,133.484c2.607,0.525,4.5,2.795,4.545,5.455\n" +
            "\t\tC222.575,351.396,220.761,353.729,218.171,354.342z\"",
        'transform-origin': isEven ? '21px 22px' : '22px 10px',
        class: 'resource-svg oil-resource-svg',
    }),
    [RES_GOLD]: (isEven) => Svg('path',{
        d: "M58.452,19.188l-6.14-10.339c-0.003-0.005-0.009-0.008-0.012-0.013c-0.068-0.11-0.158-0.203-0.264-0.28\n" +
            "\tc-0.017-0.013-0.033-0.025-0.051-0.037c-0.018-0.012-0.033-0.027-0.053-0.038L41.224,2.63c-0.364-0.199-0.814-0.152-1.131,0.119\n" +
            "\tL5.83,32.163c-0.007,0.006-0.012,0.015-0.019,0.021c-0.013,0.012-0.023,0.026-0.035,0.039c-0.075,0.076-0.135,0.162-0.182,0.255\n" +
            "\tc-0.007,0.013-0.019,0.021-0.025,0.034L0.088,44.737c-0.217,0.482-0.021,1.049,0.447,1.294l18.931,9.94\n" +
            "\tc0.015,0.008,0.032,0.011,0.048,0.018c0.013,0.006,0.023,0.016,0.037,0.022c0.014,0.006,0.029,0.003,0.043,0.008\n" +
            "\tc0.11,0.039,0.222,0.066,0.337,0.066c0.111,0,0.221-0.025,0.327-0.062c0.032-0.011,0.06-0.026,0.091-0.041\n" +
            "\tc0.038-0.018,0.079-0.029,0.115-0.051c0.04-0.025,0.071-0.059,0.107-0.089c0.014-0.012,0.031-0.016,0.045-0.028l37.662-35.387\n" +
            "\tC58.619,20.106,58.693,19.591,58.452,19.188z M40.871,4.716l8.867,4.846L19.109,37.259L8.35,32.636L40.871,4.716z M2.297,44.698\n" +
            "\tl4.694-10.468l11.337,4.872l0.538,14.296L2.297,44.698z M20.848,52.852l-0.527-13.992l16.546-14.962l14.352-12.978l5.105,8.598\n" +
            "\tL20.848,52.852z",
        'transform-origin': isEven ? '26px 32px' : '35px 10px',
        class: 'resource-svg gold-resource-svg',
    }),
};

const makeTile = (x, y, isEven) => {
    const makePoly = (attrs) => {
        let relX = TILE_WIDTH / 2;
        let relY = 0;

        if (!isEven) {
            relY += TILE_HEIGHT / 3;
        } else {
            relY += TILE_HEIGHT * 2 / 3;
        }
        return Svg('polygon', {
            'transform-origin': relX + 'px ' + relY + '0px',
            points: [
                {dx: -TILE_WIDTH / 2, dy: TILE_HEIGHT / 3},
                {dx: +TILE_WIDTH / 2, dy: TILE_HEIGHT / 3},
                {dx: 0, dy: -TILE_HEIGHT * 2 / 3},
            ].map(
                ({dx, dy}) => [
                    relX + dx,
                    relY + dy * (isEven ? 1 : -1),
                ].map(n => n.toFixed(3)).join(',')
            ).join(' '),
            ...attrs,
        });
    };
    return Svg('svg', {class: 'tile-root', x, y}, [
        makePoly({class: 'base-tile'}),
        makePoly({class: 'effects-overlay'}),
    ]);
};

const fadeInRows = (ROWS) => {
    for (let i = 0; i < ROWS; i++) {
        const css = document.styleSheets[1];
        if (i > 0) {
            css.insertRule(`
                [data-row="${i}"] {
                    animation: fadeRow 0.1s ease-in forwards;
                    animation-delay: ${i / 10}s;
                }
            `, css.cssRules.length);
        }
    }
};

/** @param {BoardState} boardState */
const updateTilesState = (svgMatrix, boardState) => {
    for (const {row, col, modifier, owner} of boardState.tiles) {
        const svgEl = svgMatrix[row][col].svgEl;
        svgEl.setAttribute('data-resource', modifier);
        if (owner) {
            svgEl.setAttribute('data-owner', owner);
        } else {
            svgEl.removeAttribute('data-owner');
        }
        const stander = Object.keys(boardState.playerToPosition)
            .find(k => {
                return boardState.playerToPosition[k].row === row
                    && boardState.playerToPosition[k].col === col;
            });
        if (stander) {
            svgEl.setAttribute('data-stander', stander);
        } else {
            svgEl.removeAttribute('data-stander');
        }
    }
};

/** TODO: move to /client/ (not doing now, because conflicts) */
const TileMapDisplay = (boardConfig, tileMapHolder) => {
    const matrix = {};

    const ROWS = boardConfig.totalRows;
    const BOARD_WIDTH_PX = ROWS * TILE_WIDTH;
    const BOARD_HEIGHT_PX = ROWS * TILE_HEIGHT;

    tileMapHolder.style.width = BOARD_WIDTH_PX + 'px';
    tileMapHolder.style.height = BOARD_HEIGHT_PX + 'px';

    // commented because it delays page reload time
    //fadeInRows(ROWS);

    for (const {row, col, modifier, owner} of boardConfig.tiles) {
        const x = (col  - row - 1) * TILE_WIDTH / 2;
        const y = row * TILE_HEIGHT;
        const isEven = col % 2 === 0;
        const svgEl = makeTile(BOARD_WIDTH_PX / 2 + x, y, isEven);
        const svgResource = resourceSvgs[modifier];

        // assign svg icon to resource tile
        if (svgResource) {
            svgEl.appendChild(svgResource(isEven));
        }

        svgEl.setAttribute('data-col', col);
        svgEl.setAttribute('data-row', row);

        tileMapHolder.appendChild(svgEl);

        matrix[row] = matrix[row] || {};
        matrix[row][col] = {row, col, svgEl};
    }
    updateTilesState(matrix, boardConfig);

    return matrix;
};

TileMapDisplay.updateTilesState = updateTilesState;

export default TileMapDisplay;