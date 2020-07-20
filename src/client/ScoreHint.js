const drawHint = (tileSvg, owner, text) => {
    const tileMapWrap = document.querySelector('.center-svg-root');
    const pop = document.createElement('div');

    pop.classList.add('pop');
    pop.style.left = +tileSvg.getBoundingClientRect().left + tileMapWrap.parentNode.scrollLeft - 50 + "px";
    pop.style.top = tileSvg.getAttribute('y') + 50 + "px";
    pop.setAttribute('data-owner', owner);
    pop.innerText = text;

    tileMapWrap.appendChild(pop);

    // clear dom
    setTimeout( () => {
        tileMapWrap.removeChild(pop);
    }, 2000);
};

export default drawHint;