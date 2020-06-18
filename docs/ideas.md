### Game Mechanics

- New tile buff - Forts. Player needs to take this point (staying on tile for N turns). Grants nearby territories (+1-2 from Fort tile). Randomly place on map (0-2)

### UI quality of life improvements

- сделать возможным зажать и держать мышь и протянуть чтоб цепочку ходом заказать (и шифтом несколько команд)


### Backend

- авто-тесты нада сделать

### TBD

- ~ возможно сделать что если точку захватили, то в следующий раз чтоб её перехватить надо на 1 ход больше...

- ~ возможно стоит пропускать ход _перед_ тем как игрок захватил клетку?

- Возможно стоит сделать что когда прячешь обе side-панели, включался режим full-screen в котором по доске можно передвигаться как по карте в циве: приблежать, отдалять, etc... (и чтоб на мобилках он был включён по-дефолту наверное). По идее можно зумить css-ом, а двигать камеру чем-то вроде scroll: hidden;
    - потенциально можно даже таким образом со временем плавно сделать из этой мини-игры полноценную turn-based strategy вроде цивы/героев, мол приблежаешься к клетке, а там город в котором можно что-то делать, или типа того...

### Monetisation

- play custom audio file of user's choice for everyone on various events: first blood, getting the lead in score, winning, etc...
- новые цвета игроков, мб эффекты красивые

### Accounts

- Make an "Account" button near the nickname. The buttons should open a dialog with fields: `Export Auth Token` with readonly text holding current auth token and `Import Auth Token` with input to copy the auth token from other device/browser - when you enter it, user should be re-logined with this token.

### AI for 2 and 1 human player games

- Monkey: always chooses random tile, but prioritizes tiles that do not belong to the AI. When stepping own tiles, prioritizes tiles that were not stepped for longest time.
- Pathfinding Monkey: chooses closest resource tile that does not belong to the AI
