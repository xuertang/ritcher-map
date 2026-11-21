package com.ritchermap.catalog.domain;

import jakarta.persistence.*;
import org.locationtech.jts.geom.MultiPoint;

import java.time.Instant;

/**
 * One toggleable heatmap within a {@link HeatmapGroup} (e.g. "Lamball").
 * {@code points} is a pixel-space multipoint (SRID 0), the same CRS as
 * {@link Marker} points; the viewer renders it as a density layer.
 */
@Entity
@Table(name = "heatmap_categories")
public class HeatmapCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id", nullable = false)
    private Long groupId;

    @Column(nullable = false)
    private String name;

    /** Display order within the group (ascending; ties broken by name). */
    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(nullable = false, columnDefinition = "geometry(MultiPoint,0)")
    private MultiPoint points;

    @Column(name = "created_at", nullable = false, updatable = false, insertable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private Instant updatedAt;

    protected HeatmapCategory() {}

    public HeatmapCategory(Long groupId, String name, int sortOrder, MultiPoint points) {
        this.groupId = groupId;
        this.name = name;
        this.sortOrder = sortOrder;
        this.points = points;
    }

    public Long getId() { return id; }
    public Long getGroupId() { return groupId; }
    public String getName() { return name; }
    public int getSortOrder() { return sortOrder; }
    public MultiPoint getPoints() { return points; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
