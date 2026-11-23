package com.ritchermap.catalog.api;

import com.ritchermap.catalog.api.Dtos.HeatmapBulkImportRequest;
import com.ritchermap.catalog.api.Dtos.HeatmapCategoryResponse;
import com.ritchermap.catalog.api.Dtos.HeatmapGroupResponse;
import com.ritchermap.catalog.api.Dtos.HeatmapPointsResponse;
import com.ritchermap.catalog.service.HeatmapService;
import com.ritchermap.catalog.service.HeatmapService.BulkCategory;
import com.ritchermap.catalog.service.HeatmapService.BulkGroup;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class HeatmapController {

    private final HeatmapService heatmaps;

    public HeatmapController(HeatmapService heatmaps) { this.heatmaps = heatmaps; }

    /**
     * The map's heatmap groups with their categories. {@code points=false}
     * returns each category with an empty {@code points} array and only its
     * {@code pointCount}; the viewer uses that and loads points per category
     * on demand, since a large map's full set runs to megabytes.
     */
    @GetMapping("/maps/{mapId}/heatmaps")
    public List<HeatmapGroupResponse> list(@PathVariable long mapId,
                                           @RequestParam(defaultValue = "true") boolean points) {
        if (!points) {
            return heatmaps.listSummaries(mapId).stream()
                    .map(g -> HeatmapGroupResponse.from(g.group(), g.categories().stream()
                            .map(c -> HeatmapCategoryResponse.summary(
                                    c.getId(), c.getGroupId(), c.getName(),
                                    c.getSortOrder(), c.getPointCount()))
                            .toList()))
                    .toList();
        }
        return heatmaps.list(mapId).stream()
                .map(g -> HeatmapGroupResponse.from(g.group(), g.categories().stream()
                        .map(HeatmapCategoryResponse::from)
                        .toList()))
                .toList();
    }

    /** Points of the given heatmap categories ({@code ?ids=1,2,3}) of this map. */
    @GetMapping("/maps/{mapId}/heatmaps/points")
    public List<HeatmapPointsResponse> points(@PathVariable long mapId,
                                              @RequestParam(required = false) List<Long> ids) {
        return heatmaps.points(mapId, ids).stream()
                .map(HeatmapPointsResponse::from)
                .toList();
    }

    /** Bulk import — replaces the map's heatmaps wholesale (seeding). */
    @PostMapping("/maps/{mapId}/heatmaps:bulk")
    public Dtos.BulkImportResponse bulk(@PathVariable long mapId,
                                        @Valid @RequestBody HeatmapBulkImportRequest req) {
        var rows = req.groups().stream()
                .map(g -> new BulkGroup(
                        g.name(), g.color(), g.sortOrder(),
                        g.categories().stream()
                                .map(c -> new BulkCategory(c.name(), c.sortOrder(), c.points()))
                                .toList()))
                .toList();
        int n = heatmaps.bulkImport(mapId, rows);
        return new Dtos.BulkImportResponse(n);
    }
}
