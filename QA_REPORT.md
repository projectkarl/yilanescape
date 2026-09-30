# QA REPORT — YILAN // REDLINE v1.0 REALISM CITY

## Static checks completed

- All JavaScript files under `src/` pass `node --check`.
- All local relative ES module imports resolve to existing files.
- `package.json` parses successfully.
- `public/manifest.webmanifest` parses successfully.
- PWA cache version updated to `yilan-redline-v1.0-realism` to prevent old v0.9 assets from remaining on installed devices.
- Cloudflare `wrangler.toml` still builds `dist/` before static asset deployment.

## Visual / world changes audited

- No film grain shader.
- No fullscreen particle mist layer.
- No mandatory Bloom / post-processing pass.
- Default environment is clear late-afternoon lighting rather than foggy rain-night.
- Rain is rendered only as sparse line streaks and windshield effects.
- Road texture uses deterministic low-frequency PBR detail instead of per-pixel random noise.
- Road geometry is continuous ribbon geometry following OSM polylines.
- OSM request now includes roads, buildings, railway, waterways, and common urban POIs.
- Offline Yilan fallback follows named real-world major street corridors rather than a chessboard grid.
- Detailed near buildings include windows, frames, glazing, storefronts, signs, awnings, balconies, AC units, tanks and roof hardware.
- Pedestrian geometry upgraded from simple capsule figures to articulated human proportions.
- Player avatar upgraded in the same direction.
- Street vehicles receive rounded bodywork, glazing, mirrors, handles, plates, lamps and differentiated vehicle classes.
- Player cars receive added exterior close-up details.
- Directional shadow volume follows the active player to retain crisp shadows away from spawn.

## Runtime build note

The active container does not have npm packages installed and outbound npm resolution is unavailable, so a complete Vite runtime/build could not be executed here. The user's Cloudflare environment previously demonstrated successful Bun dependency installation for this project family. The source has been statically checked but browser runtime should still be validated after Cloudflare build.

## Recommended first deployment check

1. Deploy to Cloudflare.
2. Hard refresh once or remove the old installed PWA if the device still shows v0.9 visuals.
3. Confirm HUD shows `REALISM` by default on desktop.
4. Confirm initial weather is `晴朗` and road/building edges are crisp.
5. Test `Q` through REALISM / PHOTO / 4K CLEAN.
6. Test mobile landscape and PWA launch separately.
