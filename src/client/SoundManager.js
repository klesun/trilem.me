import Sound, {setSoundEnabled} from "./Sound.js";

const SoundManager = (soundSwitches) => {
    const audios = [
        Sound('./assets/audio/tile_move.aac'),
        Sound('./assets/audio/tile_move2.aac'),
        Sound('./assets/audio/tile_move3.aac'),
    ];
    const firstBloodAudio = Sound('./assets/audio/ALLYOURBASEAREBELONGTOUS.mp3');
    firstBloodAudio.audio.volume = 0.1;

    soundSwitches.enabled.onclick = e => {
        soundSwitches.enabled.style.display = "none";
        soundSwitches.disabled.style.display = "block";
        setSoundEnabled(false);
    };

    soundSwitches.disabled.onclick = e => {
        soundSwitches.disabled.style.display = "none";
        soundSwitches.enabled.style.display = "block";
        setSoundEnabled(true);
    };

    const playMoveSound = () => {
        const audioIndex = Math.floor(Math.random() * 3);
        // I would suggest adding here small pitch
        // randomization to make it sound more interesting ;)
        const tileMoveSound = audios[audioIndex];
        tileMoveSound.audio.currentTime = 0;
        tileMoveSound.audio.volume = (audioIndex === 0 ? 1 : 0.75) * 0.05;
        tileMoveSound.play();
    };

    return {
        playMoveSound: playMoveSound,
        playFirstBloodSound: () => firstBloodAudio.play(),
    };
};

export default SoundManager;