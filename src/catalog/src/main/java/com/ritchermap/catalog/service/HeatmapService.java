package com.ritchermap.catalog.service;

import com.ritchermap.catalog.domain.HeatmapCategory;
import com.ritchermap.catalog.domain.HeatmapGroup;
import com.ritchermap.catalog.error.NotFoundException;
import com.ritchermap.catalog.repo.HeatmapCategoryRepository;
import com.ritchermap.catalog.repo.HeatmapGroupRepository;
import com.ritchermap.catalog.repo.MapRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.MultiPoint;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class HeatmapService {

    /** SRID 0 = no CRS (pixel space), matching markers/regions. */
    private static final GeometryFactory GEOM = new GeometryFactory(new PrecisionModel(), 0);

    private final HeatmapGroupRepository groups;
    private final HeatmapCategoryRepository categories;
    private final MapRepository maps;

    public HeatmapService(HeatmapGroupRepository groups,
                          HeatmapCategoryRepository categories,
                          MapRepository maps) {
        this.groups = groups;
        this.categories = categories;
        this.maps = maps;
    }

    /**
     * Build a SRID-0 multipoint from {@code [x, y]} pairs. Throws on an empty
     * list or a malformed point — a heatmap with no points renders nothing, so
     * it's rejected rather than stored.
     */
    static MultiPoint multiPoint(List<List<Double>> points) {
        if (points == null || points.isEmpty()) {
            throw new IllegalArgumentException("heatmap category needs at least 1 point");
        }
        Coordinate[] coords = new Coordinate[points.size()];
        for (int i = 0; i < points.size(); i++) {
            List<Double> pt = points.get(i);
            if (pt == null || pt.size() < 2 || pt.get(0) == null || pt.get(1) == null) {
                throw new IllegalArgumentException("heatmap point must be [x, y]");
            }
            coords[i] = new Coordinate(pt.get(0), pt.get(1));
        }
        MultiPoint mp = GEOM.createMultiPointFromCoords(coords);
        mp.setSRID(0);
        return mp;
    }

    private void requireMap(long mapId) {
        if (!maps.existsById(mapId)) throw NotFoundException.of("map", mapId);
    }

    /** A group with its categories, in display order. */
    public record GroupWithCategories(HeatmapGroup group, List<HeatmapCategory> categories) {}

    @Transactional(readOnly = true)
    public List<GroupWithCategories> list(long mapId) {
        requireMap(mapId);
        List<HeatmapGroup> gs = groups.findAllByMapIdOrderBySortOrderAscNameAsc(mapId);
        if (gs.isEmpty()) return List.of();
        // One query for all categories, bucketed per group (order preserved).
        List<Long> ids = gs.stream().map(HeatmapGroup::getId).toList();
        Map<Long, List<HeatmapCategory>> byGroup = categories
                .findAllByGroupIdInOrderBySortOrderAscNameAsc(ids)
                .stream()
                .collect(Collectors.groupingBy(HeatmapCategory::getGroupId));
        return gs.stream()
                .map(g -> new GroupWithCategories(g, byGroup.getOrDefault(g.getId(), List.of())))
                .toList();
    }

    /** Flat bulk-import rows (map seeding). */
    public record BulkCategory(String name, int sortOrder, List<List<Double>> points) {}
    public record BulkGroup(String name, String color, int sortOrder, List<BulkCategory> categories) {}

    /**
     * Replace the map's heatmaps wholesale (seeding is wipe + reinsert, so
     * re-runs are idempotent). Returns the number of categories inserted.
     */
    @Transactional
    public int bulkImport(long mapId, List<BulkGroup> rows) {
        requireMap(mapId);
        groups.deleteAllByMapId(mapId); // categories go with them (FK cascade)
        int inserted = 0;
        for (BulkGroup g : rows) {
            HeatmapGroup saved = groups.save(
                    new HeatmapGroup(mapId, g.name().strip(), g.color(), Math.max(0, g.sortOrder())));
            List<HeatmapCategory> cats = g.categories().stream()
                    .map(c -> new HeatmapCategory(
                            saved.getId(), c.name().strip(), Math.max(0, c.sortOrder()),
                            multiPoint(c.points())))
                    .toList();
            categories.saveAll(cats);
            inserted += cats.size();
        }
        return inserted;
    }
}
