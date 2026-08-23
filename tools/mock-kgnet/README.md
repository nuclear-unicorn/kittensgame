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
| GET    | `/kgnet/save/:guid/download/`       | Fetch a save blob (`{ data, metadata }`) |
| POST   | `/kgnet/chiral/game/command/`       | Stubbed (returns `{}`)               |
| GET    | `/kgnet/save/:guid/card.svg`        | Link-preview card image              |
| GET    | `/preview/:guid`                    | Crawler-facing page with OG tags     |

CORS is set to reflect the request origin with credentials allowed, since the
client uses `xhrFields: { withCredentials: true }`.

## Save previews

The last two endpoints back [save preview mode](../../docs/save-preview.md).
`/preview/:guid` is what a player shares: crawlers (Discord, Slack, Twitter)
read its Open Graph tags, real browsers follow its meta-refresh into the game at
`?saveId=:guid`.

```sh
node tools/mock-kgnet/server.js
curl -A Discordbot http://localhost:7780/preview/<guid>
```

Set `GAME_URL` if the game is not on `http://localhost:8080/`:

```sh
GAME_URL=http://localhost:9000/ node tools/mock-kgnet/server.js
```

Two things the mock does that production must **not** copy: it decompresses the
whole save blob on every request to build the card (index that at upload time
instead), and it serves the card as SVG (Discord and Twitter need PNG). Both are
spelled out in [docs/save-preview.md](../../docs/save-preview.md).

## Notes

- The client sends POST bodies as `application/x-www-form-urlencoded` (jQuery's
  default), with nested objects in bracket notation (`metadata[calendar][year]`).
  The server parses that back into nested objects.
- There is no real auth — `/user/` always returns a session. To simulate a
  logged-out state, just don't run the server (the menu falls back to offline).
