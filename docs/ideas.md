### Game Mechanics

- New tile buff - Forts. Player needs to take this point (staying on tile for N turns). Grants nearby territories (+1-2 from Fort tile). Randomly place on map (0-2)

### UI quality of life improvements

- When you capture an empty tile, show something visual or play some sound - to let player know that he was debuffed with a SKIP_TURN. Probably best would be to perform this check on response from server: check if any player gained a SKIP_TURN buff in his `playerToBuffs`.