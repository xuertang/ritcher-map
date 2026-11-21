package com.ritchermap.catalog.domain;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * A sidebar section of heatmap categories for a map (e.g. "Pals"). Groups only
 * carry display metadata; the actual point data lives on {@link HeatmapCategory}.
 * {@code color} is the sidebar accent as #RRGGBB (nullable).
 */
@Entity
@Table(name = "heatmap_groups")
public class HeatmapGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "map_id", nullable = false)
    private Long mapId;

    @Column(nullable = false)
    private String name;

    private String color;

    /** Display order within the map (ascending; ties broken by name). */
    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private Instant updatedAt;

    protected HeatmapGroup() {}

    public HeatmapGroup(Long mapId, String name, String color, int sortOrder) {
        this.mapId = mapId;
        this.name = name;
        this.color = color;
        this.sortOrder = sortOrder;
    }

    public Long getId() { return id; }
    public Long getMapId() { return mapId; }
    public String getName() { return name; }
    public String getColor() { return color; }
    public int getSortOrder() { return sortOrder; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
