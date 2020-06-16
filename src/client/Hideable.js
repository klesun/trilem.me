const Hideable = () => {
    const hideableEls = document.querySelectorAll('.hideable');

    const _init = () => {
        hideableEls.forEach( el => {
            const dataHide = el.getAttribute('data-hide');
            const state = localStorage.getItem(dataHide);

            const title = el.querySelector('.hide-title');
            const show = document.createElement('div');
            const showText = document.createElement('span');

            const isRight = el.classList.contains('hide-right');

            let appended = false;

            if (state && state === "hide") {
                el.classList.add('hidden');
                show.style.display = 'flex';
                el.parentNode.insertBefore(show, el);
            } else {
                el.classList.remove('hidden');
            }

            show.classList.add('show-hideable');
            showText.innerHTML = 'Show';

            show.appendChild(showText);
            show.classList.add(isRight ? 'show-right' : 'show-left');

            show.onclick = e => {
                show.style.display = 'none';
                el.classList.remove('hidden');
                localStorage.setItem(dataHide, 'show');
            };

            title.onclick = e => {
                if (!el.classList.contains('hidden')) {
                    el.classList.add('hidden');

                    if (!appended) {
                        show.style.display = 'none';
                        el.parentNode.insertBefore(show, el);
                    }

                    localStorage.setItem(dataHide, 'hide');

                    setTimeout( () => {
                        show.style.display = 'flex';
                    }, 200);
                }
            };
        } );
    };

    return {
        init: _init,
    }
};

export default Hideable;