package com.ritchermap.catalog.repo;

import com.ritchermap.catalog.domain.HeatmapCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface HeatmapCategoryRepository extends JpaRepository<HeatmapCategory, Long> {
    List<HeatmapCategory> findAllByGroupIdInOrderBySortOrderAscNameAsc(Collection<Long> groupIds);
}
