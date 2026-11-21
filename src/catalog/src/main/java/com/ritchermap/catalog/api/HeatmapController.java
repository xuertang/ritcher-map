package com.ritchermap.catalog.api;

import com.ritchermap.catalog.api.Dtos.HeatmapBulkImportRequest;
import com.ritchermap.catalog.api.Dtos.HeatmapGroupResponse;
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

    @GetMapping("/maps/{mapId}/heatmaps")
    public List<HeatmapGroupResponse> list(@PathVariable long mapId) {
        return heatmaps.list(mapId).stream()
                .map(g -> HeatmapGroupResponse.from(g.group(), g.categories()))
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
