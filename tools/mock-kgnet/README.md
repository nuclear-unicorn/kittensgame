# Mock KGNet backend

A minimal, zero-dependency stand-in for the KGNet server behind the game's
"online" menu (login + cloud saves). Useful for developing the `WLogin` /
`WCloudSaves` widgets in [js/jsx/toolbar.jsx.js](../../js/jsx/toolbar.jsx.js)
without a real account or server.

## Run

```sh
node tools/mock-kgnet/server.js
```

It listens on `http://localhost:7780`, which is exactly where
`classes.game.Server.getServerUrl()` ([game.js](../../game.js)) points when the
game is served from `localhost` / `127.0.0.1` / `192.168.*` / `file:`. So:

1. Start this server.
2. Serve the game locally (`yarn start`) and open it.
3. The online menu should show you as **online** with a working save list.

Saves are kept **in memory only** — they reset every time you restart the
server. `load` round-trips correctly as long as the server stays running.

## Endpoints

| Method | Path                                | Purpose                              |
|--------|-------------------------------------|--------------------------------------|
| GET    | `/user/`                            | Returns a fake logged-in profile     |
| GET    | `/kgnet/save/`                      | List cloud saves (no blobs)          |
| POST   | `/kgnet/save/upload/`               | Create/overwrite a save              |
| POST   | `/kgnet/save/update/`              | Update label / archived flag         |
| GET    | `/kgnet/save/:guid/download/`       | Fetch one of your own save blobs     |
| POST   | `/kgnet/chiral/game/command/`       | Stubbed (returns `{}`)               |
| GET    | `/preview/:shareId`                 | Crawler-facing page with OG tags     |
| GET    | `/preview/:shareId/card.svg`        | Link-preview card image              |
| GET    | `/preview/:shareId/save/`           | Shared save blob, no session needed  |

CORS is set to reflect the request origin with credentials allowed, since the
client uses `xhrFields: { withCredentials: true }`.

## Save previews

The last three endpoints back save preview mode, mirroring the real backend in
the nunicorn repo (`server/preview.ts`). `/preview/:shareId` is what a player
shares: crawlers (Discord, Slack, Twitter) read its Open Graph tags, real
browsers follow its meta-refresh into the game at `?saveId=:shareId`.

A save is not readable by anybody until its owner shares it. Sharing mints a
`shareId` — a save `guid` cannot address a save server-wide, because guids are
only unique within one account:

```sh
curl -X POST http://localhost:7780/kgnet/save/update/ \
     -d 'guid=<guid>&metadata[shared]=true'      # -> the save list, now with shareId
curl -A Discordbot http://localhost:7780/preview/<shareId>
```

Set `GAME_URL` if the game is not on `http://localhost:8080/`:

```sh
GAME_URL=http://localhost:9000/ node tools/mock-kgnet/server.js
```

Two things the mock does that the real backend does differently: it decompresses
the whole save blob on every request to build the card (nunicorn reads the stored
save index and only re-parses when it is stale), and it serves the card as SVG,
which Discord and Twitter will not embed (nunicorn renders a PNG).

## Notes

- The client sends POST bodies as `application/x-www-form-urlencoded` (jQuery's
  default), with nested objects in bracket notation (`metadata[calendar][year]`).
  The server parses that back into nested objects.
- There is no real auth — `/user/` always returns a session. To simulate a
  logged-out state, just don't run the server (the menu falls back to offline).
