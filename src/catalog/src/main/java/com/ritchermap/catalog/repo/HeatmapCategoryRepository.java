package com.ritchermap.catalog.repo;

import com.ritchermap.catalog.domain.HeatmapCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface HeatmapCategoryRepository extends JpaRepository<HeatmapCategory, Long> {
    List<HeatmapCategory> findAllByGroupIdInOrderBySortOrderAscNameAsc(Collection<Long> groupIds);

    /** A category row without its geometry — only how many points it holds. */
    interface Summary {
        Long getId();
        Long getGroupId();
        String getName();
        Integer getSortOrder();
        Integer getPointCount();
    }

    /**
     * Categories of the given groups in display order, WITHOUT loading the
     * multipoints (a map can carry hundreds of thousands of heatmap points).
     * Native so PostGIS counts the points server-side; aliases are quoted
     * because Postgres would otherwise fold them to lower case and miss the
     * projection's camelCase getters.
     */
    @Query(value = """
            SELECT c.id AS "id", c.group_id AS "groupId", c.name AS "name",
                   c.sort_order AS "sortOrder",
                   ST_NumGeometries(c.points) AS "pointCount"
            FROM heatmap_categories c
            WHERE c.group_id IN (:groupIds)
            ORDER BY c.sort_order, c.name
            """, nativeQuery = true)
    List<Summary> findSummariesByGroupIdIn(@Param("groupIds") Collection<Long> groupIds);

    /** The requested categories, restricted to those that belong to the map. */
    @Query("""
            SELECT c FROM HeatmapCategory c
            WHERE c.id IN :ids
              AND c.groupId IN (SELECT g.id FROM HeatmapGroup g WHERE g.mapId = :mapId)
            ORDER BY c.id
            """)
    List<HeatmapCategory> findAllByMapIdAndIdIn(@Param("mapId") Long mapId,
                                                @Param("ids") Collection<Long> ids);
}
