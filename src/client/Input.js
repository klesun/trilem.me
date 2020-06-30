import {Dom} from "./Dom.js";

const Input = (params = {}) => {
    const wrapper = Dom('div', {class: 'input-wrapper'});
    const input = Dom('input', {...params, class: `input-root ${params.className}`});

    input.onfocus = e => {
        wrapper.classList.add('active');
    };

    input.onblur = e => {
        wrapper.classList.remove('active');
    };

    wrapper.appendChild(input);

    return wrapper;
};

export default Input;