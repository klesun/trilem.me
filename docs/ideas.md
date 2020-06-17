### Game Mechanics

- New tile buff - Forts. Player needs to take this point (staying on tile for N turns). Grants nearby territories (+1-2 from Fort tile). Randomly place on map (0-2)

### UI quality of life improvements

- When you capture an empty tile, show something visual or play some sound - to let player know that he was debuffed with a SKIP_TURN. Probably best would be to perform this check on response from server: check if any player gained a SKIP_TURN buff in his `playerToBuffs`.

- сделать возможным зажать и держать мышь и протянуть чтоб цепочку ходом заказать (и шифтом несколько команд)


### Backend

- авто-тесты нада сделать

### TBD

~ возможно сделать что если точку захватили, то в следующий раз чтоб её перехватить надо на 1 ход больше...
~ возможно стоит пропускать ход _перед_ тем как игрок захватил клетку?

- Возможно стоит сделать что когда прячешь обе side-панели, включался режим full-screen в котором по доске можно передвигаться как по карте в циве: приблежать, отдалять, etc... (и чтоб на мобилках он был включён по-дефолту наверное). По идее можно зумить css-ом, а двигать камеру чем-то вроде scroll: hidden;
    - потенциально можно даже таким образом со временем плавно сделать из этой мини-игры полноценную turn-based strategy вроде цивы/героев, мол приблежаешься к клетке, а там город в котором можно что-то делать, или типа того...