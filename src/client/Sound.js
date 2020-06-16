const audios = [];
let soundEnabled = true;

const stopSounds = () => {
    audios.forEach( audio => {
        audio.currentTime = 0;
        audio.pause();
    } );
};

export const setSoundEnabled = bool => {
    stopSounds();
    soundEnabled = bool
};

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

    audios.push(audio);

    return {
        audio: audio,
        play: _play
    }
};

export default Sound;