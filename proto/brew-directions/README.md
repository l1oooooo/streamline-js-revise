# Decaid brew workspace exploration

Four isolated vanilla JavaScript directions. Nothing in production imports these files.

Run `python3 proto/brew-directions/serve.py`, then open `http://127.0.0.1:8766/proto/brew-directions/`. Use keys 1–4 or arrow keys to compare Current, Studio, Sequence, and Panorama. The top controls switch Home / Brewing / Review, light / dark, and content scenarios. Older five-direction URLs are migrated so existing Sequence and Panorama links still select the intended direction.

Coffee starts from the machine's physical group head. There are no software coffee-start buttons. Select Brewing in the toolbar to inspect that state; Resume plays sample readings from 18.4 seconds and reaches Review at 31.4 seconds. Machine-tool controls only change local preview state.

Studio restores the original full cover on the right. Profile selection remains on the left. Rail is removed. The remaining decisions are recorded in `ROUND_TWO.md`.

Materials reuse the bundled Geist font, profile artwork, neutral surfaces, and chart colors. The long title comes from the repository's Rao Allongé example. All readings and history entries are sample data. No device or storage APIs are called.

Current is a source-markup snapshot with its coffee-start control removed. The other directions each have a render module. The picker retains the emil-prototype reference styling and behavior. No direction has been promoted to production.
