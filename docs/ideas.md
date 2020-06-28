### Game Mechanics

- New tile buff - Forts. Player needs to take this point (staying on tile for N turns). Grants nearby territories (+1-2 from Fort tile). Randomly place on map (0-2)
    - I would propose, rather than randomly place them on map, to allow players (up to max 2 times max) press "skip turn" 5 or so times to build the fort 

### UI quality of life improvements

- сделать возможным зажать и держать мышь и протянуть чтоб цепочку ходом заказать (и шифтом несколько команд)
    - make "cancel route" button in HUD to cancel this

- chat for players to communicate. Like "let's join against Keanu, he is winning" or "don't touch left corner, and I won't touch yours, deal?"

- make it possible to skip turn with a button on page, not just "Esc". Preferably show "build wall" if it's empty tile and "improve" if it's a resource

### Accounts

- Make an "Account" button near the nickname. The buttons should open a dialog with fields: `Export Auth Token` with readonly text holding current auth token and `Import Auth Token` with input to copy the auth token from other device/browser - when you enter it, user should be re-logined with this token.

### Multiplayer

- Make a limit of 10 seconds for player to decide on his turn. Give a 60 seconds credit of "penalty" time for each player for whole game. If penalty time is exhausted, player automatically skips turn. Penalty time is counted only if at least one human player is waiting.

- When two players step on same tile during one turn, I think it would be fair to make it belong to the third player and add it a wall

### AI for 2 and 1 human player games

- Fix AI after the improvements update

- Pathfinding Monkey: chooses closest resource tile that does not belong to the AI

- AI chat trash talk messages:
    - I'm noob, don't be harsh on me pls
    - How do you play this map?
    - Host pidr
    - Putin vor
    - Still better than civ 6
    - I'm an AI, I have no soul
    - (when someone captures his tile) I thought we were friends ;c
    - (when captures your tile) >:D


### TBD

- Возможно стоит сделать что когда прячешь обе side-панели, включался режим full-screen в котором по доске можно передвигаться как по карте в циве: приблежать, отдалять, etc... (и чтоб на мобилках он был включён по-дефолту наверное). По идее можно зумить css-ом, а двигать камеру чем-то вроде scroll: hidden;
    - потенциально можно даже таким образом со временем плавно сделать из этой мини-игры полноценную turn-based strategy вроде цивы/героев, мол приблежаешься к клетке, а там город в котором можно что-то делать, или типа того...

- Когда пропускаешь ход на своей стенке, получаешь 2 "ядра". Ядра тратятся когда захватываешь стенованную клетку врага - 1 ядро отменяет 1 штрафной пропуск хода

- Возможно было бы прикольно сделать чтоб игроки которые делают быстрые ходы поощрались чтобы опять же была дилемма: походить быстро, не думая, или потерять какие-то плюшки, но хорошо обдумать ход. Может 1 ядро давать? Наверное честно будет это учитывать только если другие игроки ходили дольше секунды, а то latency, все дела... Мож лучше просто считать общее время потраченное игроком на обдумывание всех ходов и для начала просто показывать где-то

### Monetisation

- play custom audio file of user's choice for everyone on various events: first blood, getting the lead in score, winning, etc...
- новые цвета игроков, мб эффекты красивые
