# Pillar artwork

Drop the client's four pillar images here, one per brand pillar, in this order:

| index | pillar (pt)   | suggested filename        |
| ----- | ------------- | ------------------------- |
| 0     | Comunicação   | `comunicacao.png` (.webp) |
| 1     | Reputação     | `reputacao.png`           |
| 2     | Eventos       | `eventos.png`             |
| 3     | Conteúdos     | `conteudos.png`           |

Then list the paths in `components/showcase/PillarFigure.tsx` → `PILLAR_IMAGES`,
e.g. `["/images/pillars/comunicacao.png", …]`. A set path replaces the
placeholder 3D solid for that pillar.

Recommended: square, transparent background (PNG/WebP), ~800×800, visually
centered. They render at up to 256 px and get a gentle idle float.
