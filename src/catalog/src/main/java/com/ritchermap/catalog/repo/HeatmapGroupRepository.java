package com.ritchermap.catalog.repo;

import com.ritchermap.catalog.domain.HeatmapGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HeatmapGroupRepository extends JpaRepository<HeatmapGroup, Long> {
    List<HeatmapGroup> findAllByMapIdOrderBySortOrderAscNameAsc(Long mapId);
    void deleteAllByMapId(Long mapId);
}
