let soundEnabled = true;

export const setSoundEnabled = bool => soundEnabled = bool;

const Sound = (src = null) => {
    let audio;

    if (!src)
        throw new Error('Bad audio source');

    try {
        audio = new Audio(src);
    } catch (e) {
        throw new Error(e);
    }

    const _play = () => {
        if (soundEnabled) {
            audio.play();
        }
    };

    return {
        audio: audio,
        play: _play
    }
};

export default Sound;