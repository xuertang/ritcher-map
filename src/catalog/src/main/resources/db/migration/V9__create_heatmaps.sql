-- Heatmap groups + categories (MapGenie-style spawn heatmaps). A group is a
-- sidebar section (e.g. "Pals"); each category in it is one toggleable heatmap
-- (e.g. "Lamball") whose points render as a density layer in the viewer.
-- points is a pixel-space multipoint (SRID 0), same CRS as markers/regions.
-- color is the group's sidebar accent as #RRGGBB; sort_order controls list
-- order, ties broken by name.
CREATE TABLE heatmap_groups (
    id          BIGSERIAL PRIMARY KEY,
    map_id      BIGINT      NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    color       TEXT,
    sort_order  INT         NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX heatmap_groups_map_idx ON heatmap_groups (map_id, sort_order);

CREATE TABLE heatmap_categories (
    id          BIGSERIAL PRIMARY KEY,
    group_id    BIGINT      NOT NULL REFERENCES heatmap_groups(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    sort_order  INT         NOT NULL DEFAULT 0,
    points      geometry(MultiPoint, 0) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX heatmap_categories_group_idx ON heatmap_categories (group_id, sort_order);
