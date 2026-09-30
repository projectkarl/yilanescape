# World build pipeline

1. Freeze a dated road/building snapshot from OSM/Open Data. Store source date and license metadata.
2. Compare Tier A zones against current Google Maps/Street View and official/public photographs as visual reference only; do not redistribute Google imagery as textures.
3. Correct road centerlines, lane counts, turn pockets, medians, rail crossings, sidewalks and building footprints.
4. Field-reference / photo-reference each hero facade. Model silhouette first, then storefront/arcade/detail passes.
5. Build materials from owned/licensed/CC0 sources or authored scans; no scraped Street View textures.
6. Place streetlights, signals, crossings and street furniture from open data where available, then visual QA against reference.
7. World Partition: 256–512 m cells. Tier A cells retain high-detail HLOD; distant cells use proxy HLOD.
8. Vehicle/pedestrian simulation runs on lane splines/navmesh generated from the corrected road graph.
9. Capture comparison frames at fixed QA cameras. A reviewer signs off geometry, facade, road markings, lighting and readability.
10. Only after reality QA passes should chase, traffic and gameplay tuning be layered on top.
