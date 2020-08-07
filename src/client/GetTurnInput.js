
/**
 * @param {SVGElement} currentSvgEl
 */
const GetTurnInput = ({currentSvgEl, possibleTurns, skipButton}) => {
    let cancel;
    const col = +currentSvgEl.getAttribute('data-col');
    const row = +currentSvgEl.getAttribute('data-row');
    const codeName = currentSvgEl.getAttribute('data-stander');

    // glow possible turns
    possibleTurns.forEach( (tile) => {
        tile.svgEl.setAttribute('data-possible-turn', codeName);
    } );

    const whenTile = new Promise((resolve, reject) => {
        if (possibleTurns.length === 0) {
            return reject(new Error('Player has nowhere to go'));
        }

        const skip = () => {
            reject(new Error('Player cancelled his turn'));
            cleanup();
        }

        const cleanup = () => {
            window.removeEventListener('keydown', listener);
            skipButton.removeEventListener("click", skip);
            tileCleanups.forEach(cleanup => cleanup());
            // remove possible turns from last player
            possibleTurns.forEach( (tile) => tile.svgEl.removeAttribute('data-possible-turn') );
        };

        cancel = () => {
            reject('OLOLO_CANCELLED_BY_GAME');
            cleanup();
        };

        const tryDelta = ({dx, dy}) => {
            const newPos = {
                col: col + dx,
                row: row + dy,
            };
            const newTile = possibleTurns.find(tile => {
                return tile.col === newPos.col
                    && tile.row === newPos.row;
            });
            if (newTile) {
                resolve(newTile);
                return true;
            } else {
                return false; // ignore input if player tries to go on a tile that does not exist
            }
        };

        const listener = (evt) => {
            let removeListener = true;
            if (evt.key === 'ArrowDown') {
                removeListener = tryDelta({dx: 0, dy: 1});
            } else if (evt.key === 'ArrowUp') {
                removeListener = tryDelta({dx: 0, dy: -1});
            } else if (evt.key === 'ArrowLeft') {
                removeListener = tryDelta({dx: -1, dy: 0});
            } else if (evt.key === 'ArrowRight') {
                removeListener = tryDelta({dx: 1, dy: 0});
            } else if (evt.key === 'Escape') {
                reject(new Error('Player cancelled his turn'));
            } else {
                removeListener = false;
            }
            if (removeListener) {
                cleanup();
                evt.preventDefault();
                return false;
            } else {
                return true;
            }
        };
        const tileCleanups = possibleTurns.map(tile => {
            const mouseListener = e => {
                resolve(tile);
                cleanup();
            };

            tile.svgEl.addEventListener('click', mouseListener);
            return () => tile.svgEl.addEventListener('click', mouseListener);
        });
        window.addEventListener('keydown', listener);
        skipButton.addEventListener("click", skip);
    });

    return {
        cancel: () => cancel(),
        whenTile: whenTile,
    }
};

export default GetTurnInput;