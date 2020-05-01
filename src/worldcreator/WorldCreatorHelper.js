// Helper functions for the WorldCreator - stuff that may be useful outside of world creation as well
define([
	'ash',
    'game/vos/ResourcesVO',
	'worldcreator/WorldCreatorRandom',
	'worldcreator/WorldCreatorConstants',
	'game/constants/LevelConstants',
	'game/constants/PositionConstants',
	'game/constants/SectorConstants',
	'game/constants/WorldConstants',
], function (Ash, ResourcesVO, WorldCreatorRandom, WorldCreatorConstants, LevelConstants, PositionConstants, SectorConstants, WorldConstants) {

    var WorldCreatorHelper = {
        
        camplessLevelOrdinals: {},
        hardLevelOrdinals: {},
        
        addCriticalPath: function (worldVO, pathStartPos, pathEndPos, pathType) {
            var path = WorldCreatorRandom.findPath(worldVO, pathStartPos, pathEndPos);
            for (var j = 0; j < path.length; j++) {
                var levelVO = worldVO.getLevel(path[j].level);
                levelVO.getSector(path[j].sectorX, path[j].sectorY).addToCriticalPath(pathType);
            }
        },
		
		getSectorType: function (seed, level, levelVO, x, y) {
            var sector = x + y + 2000;
			var topLevel = this.getHighestLevel(seed);
			var bottomLevel = this.getBottomLevel(seed);
            var rand = WorldCreatorRandom.random(seed % 1000 + level * sector + 5);
            
			var sectorType = SectorConstants.SECTOR_TYPE_MAINTENANCE;
            if (level == topLevel) {
                // special level: top level
                sectorType = SectorConstants.SECTOR_TYPE_COMMERCIAL;
				if (rand < 0.2) sectorType = SectorConstants.SECTOR_TYPE_PUBLIC;
				if (rand < 0.6) sectorType = SectorConstants.SECTOR_TYPE_RESIDENTIAL;
				if (rand < 0.65) sectorType = SectorConstants.SECTOR_TYPE_MAINTENANCE;
            } else if (level == 14) {
                // special level: 14
				sectorType = SectorConstants.SECTOR_TYPE_INDUSTRIAL;
				if (rand < 0.3) sectorType = SectorConstants.SECTOR_TYPE_MAINTENANCE;
				if (rand < 0.4) sectorType = SectorConstants.SECTOR_TYPE_SLUM;
            } else if (level == bottomLevel) {
                // special level: ground level
				sectorType = SectorConstants.SECTOR_TYPE_MAINTENANCE;
				if (rand < 0.1) sectorType = SectorConstants.SECTOR_TYPE_RESIDENTIAL;
				if (rand < 0.2) sectorType = SectorConstants.SECTOR_TYPE_PUBLIC;
				if (rand < 0.3) sectorType = SectorConstants.SECTOR_TYPE_INDUSTRIAL;
            } else if (level > topLevel - 5) {
				// levels near top: mainly residentai
				sectorType = SectorConstants.SECTOR_TYPE_RESIDENTIAL;
				if (rand < 0.3) sectorType = SectorConstants.SECTOR_TYPE_COMMERCIAL;
				if (rand < 0.05) sectorType = SectorConstants.SECTOR_TYPE_INDUSTRIAL;
			} else if (level > topLevel - 8) {
				// first dark levels: mainly recent industrial and maintenance
				sectorType = SectorConstants.SECTOR_TYPE_INDUSTRIAL;
				if (rand < 0.4) sectorType = SectorConstants.SECTOR_TYPE_MAINTENANCE;
				if (rand < 0.15) sectorType = SectorConstants.SECTOR_TYPE_RESIDENTIAL;
			} else if (level > 14) {
				// levels baove 14: slums and maintenance
				sectorType = SectorConstants.SECTOR_TYPE_MAINTENANCE;
				if (rand < 0.3) sectorType = SectorConstants.SECTOR_TYPE_SLUM;
			} else {
				// Old levels: mix of slum, maintenance, and everything else
				sectorType = SectorConstants.SECTOR_TYPE_SLUM;
				if (rand < 0.4) sectorType = SectorConstants.SECTOR_TYPE_INDUSTRIAL;
				if (rand < 0.3) sectorType = SectorConstants.SECTOR_TYPE_MAINTENANCE;
				if (rand < 0.2) sectorType = SectorConstants.SECTOR_TYPE_RESIDENTIAL;
				if (rand < 0.1) sectorType = SectorConstants.SECTOR_TYPE_COMMERCIAL;
				if (rand < 0.1) sectorType = SectorConstants.SECTOR_TYPE_PUBLIC;
			}
			return sectorType;
		},
        
        getSectorScavengableResources: function (seed, topLevel, bottomLevel, sectorVO) {
            var l = sectorVO.position.level;
            var x = sectorVO.position.sectorX;
            var y = sectorVO.position.sectorY;
            var sectorType = sectorVO.sectorType;
            var sRandom = (x * 22 + y * 3000);
            
            var sectorAbundanceFactor = WorldCreatorRandom.random(seed * sRandom + (x + 99) * 7 * (y - 888));
            var waterRandomPart = WorldCreatorRandom.random(seed * (l + 1000) * (x + y + 900) + 10134) * Math.abs(5 - sectorVO.wear) / 5;

            var result = new ResourcesVO();
            
            // Sector type based defaults
            switch (sectorType) {
            case SectorConstants.SECTOR_TYPE_RESIDENTIAL:
                result.metal = 3;
                result.food = WorldCreatorRandom.random(seed + l * x * y * 24 + x * 33 + 6) > 0.60 ? Math.round(sectorAbundanceFactor * 5 + sectorVO.wear / 2) : 0;
                result.water = waterRandomPart > 0.82 ? 2 : 0;
                result.rope = WorldCreatorRandom.random(seed + l * x / y * 44 + 6) > 0.95 ? 1 : 0;
                result.fuel = WorldCreatorRandom.random(seed / (l + 5) + x * x * y + 66) > 0.95 ? 1 : 0;
                result.medicine = WorldCreatorRandom.random(seed / (l + 5) + x * x * y + 66) > 0.99 ? 1 : 0;
                break;
            case SectorConstants.SECTOR_TYPE_INDUSTRIAL:
                result.water = waterRandomPart > 0.9 ? 1 : 0;
                result.metal = 8;
                result.tools = (l > 13) ? WorldCreatorRandom.random(seed + l * x / y * 44 + 6) > 0.95 ? 1 : 0 : 0;
                result.rope = WorldCreatorRandom.random(seed + l * x / y * 44 + 6) > 0.90 ? 1 : 0;
                result.fuel = WorldCreatorRandom.random(seed / (l + 5) + x * x * y + 66) > 0.90 ? 1 : 0;
                break;
            case SectorConstants.SECTOR_TYPE_MAINTENANCE:
                result.metal = 10;
                result.rope = WorldCreatorRandom.random(seed + l * x / y * 44 + 6) > 0.90 ? 1 : 0;
                result.fuel = WorldCreatorRandom.random(seed / (l + 5) + x * x * y + 66) > 0.90 ? 1 : 0;
                result.tools = (l > 13) ? WorldCreatorRandom.random(seed + l * x / y * 44 + 6) > 0.90 ? 1 : 0 : 0;
                break;
            case SectorConstants.SECTOR_TYPE_COMMERCIAL:
                result.water = waterRandomPart > 0.85 ? 2 : 0;
                result.metal = 2;
                result.food = Math.round(sectorAbundanceFactor * 10);
                result.medicine = WorldCreatorRandom.random(seed / (l + 5) + x * x * y + 66) > 0.99 ? 1 : 0;
                break;
            case SectorConstants.SECTOR_TYPE_SLUM:
                result.metal = 7;
                result.food = WorldCreatorRandom.random(seed / (l+10) + x * y * 63) > 0.75 ? Math.round(sectorAbundanceFactor * 5 + sectorVO.wear / 2) : 0;
                result.water = waterRandomPart > 0.75 ? 1 : 0;
                result.rope = WorldCreatorRandom.random(seed + l * x / y * 44 + 6) > 0.85 ? 1 : 0;
                result.fuel = WorldCreatorRandom.random(seed / (l + 5) + x * x * y + 66) > 0.95 ? 1 : 0;
                break;
            }
            
            if (sectorVO.sunlit) {
                result.herbs = WorldCreatorRandom.random(seed * l / x + y * 423) > 0.75 ? 2 : 0;
            }
            
            // Adjustments for bottom / top / campable levels
            if (l === bottomLevel) {
                result.herbs = WorldCreatorRandom.random(seed * l / x + y * 423) * (10 - sectorVO.wear);
            }
            
            if (l === bottomLevel + 1) {
                result.herbs = WorldCreatorRandom.random(seed * l / x + y * 423) * (10 - sectorVO.wear) / 2;
            }
            
            // Adjustment for required supplies
            if (sectorVO.requiredResources) {
                if (sectorVO.requiredResources.getResource("food") > 0) {
                    result.food = Math.max(result.food, 3);
                }
            }
            
            // Final adjustments for possible values
            result.food = result.food > 2 ? result.food : 0;
            result.herbs = result.herbs > 2 ? Math.min(result.herbs, 10) : 0;
            
            return result;
        },
        
        getSectorCollectableResources: function (seed, topLevel, bottomLevel, sectorVO) {
            var l = sectorVO.position.level;
            var x = sectorVO.position.sectorX;
            var y = sectorVO.position.sectorY;
            var sectorCentralness = (10 - (Math.abs(x) / 10) + 10 - (Math.abs(y) / 10)) / 2;
            var sectorType = sectorVO.sectorType;
            var sectorNatureFactor = (WorldCreatorRandom.random(seed + (x + 1453) / 55 * (y - 455)) * (sectorVO.wear)) / 10;
            var sectorWaterFactor = (WorldCreatorRandom.random(seed / (x + 30) + (y + 102214)) * (sectorCentralness + 10)) / 25;
            
            var result = new ResourcesVO();
            
            switch (sectorType) {
            case SectorConstants.SECTOR_TYPE_RESIDENTIAL:
            case SectorConstants.SECTOR_TYPE_COMMERCIAL:
                result.food = sectorNatureFactor > 0.2 ? Math.round(sectorNatureFactor * 10) : 0;
                result.water = sectorWaterFactor > 0.75 ? Math.round(Math.min(10, sectorWaterFactor * 10)) : 0;
                break;
            case SectorConstants.SECTOR_TYPE_INDUSTRIAL:
            case SectorConstants.SECTOR_TYPE_MAINTENANCE:
                result.food = sectorNatureFactor > 0.4 ? Math.round(sectorNatureFactor * 8) : 0;
                result.water = sectorWaterFactor > 0.95 ? Math.round(Math.min(10, sectorWaterFactor * 11)) : 0;
                break;
            case SectorConstants.SECTOR_TYPE_SLUM:
                result.food = sectorNatureFactor > 0.1 ? Math.round(sectorNatureFactor * 10) : 0;
                result.water = sectorWaterFactor > 0.9 ? Math.round(Math.min(10, sectorWaterFactor * 8)) : 0;
                break;
            }
            
            if (l === bottomLevel) {
                result.food = result.food > 0 ? result.food + 2 : 0;
                result.water = result.water > 0 ? result.water + 3 : 0;
            }
            
            if (l === bottomLevel + 1) {
                result.food = result.food > 0 ? result.food + 1 : 0;
                result.water = result.water > 0 ? result.water + 1 : 0;
            }

            if (sectorVO.hazards.poison > 0 || sectorVO.hazards.radiation > 0) {
                result.water = 0;
                result.food = 0;
            }

            // Adjustment for required supplies
            if (sectorVO.requiredResources) {
                if (sectorVO.requiredResources.getResource("water") > 0) {
                    result.water = Math.max(result.water, 3);
                }
            }
            
            return result;
        },
        
        getClosestPair: function (sectors1, sectors2, skip) {
            skip = skip || 0;
            var result = [null, null];
            var resultDist = 9999;
            var pairs = [];
            for (var i = 0; i < sectors1.length; i++) {
                for (var j = 0; j < sectors2.length; j++) {
                    pairs.push([sectors1[i], sectors2[j]]);
                }
            }
            pairs.sort(function (a, b) {
                return PositionConstants.getDistanceTo(a[0].position, a[1].position) - PositionConstants.getDistanceTo(b[0].position, b[1].position);
            });
            return pairs[skip];
        },
        
        getClosestSector: function (sectors, pos, skip) {
            skip = skip || 0;
            if (skip >= sectors.length) skip = sectors.length - 1;
            var sorted = sectors.concat();
            sorted.sort(function (a, b) {
                return PositionConstants.getDistanceTo(a.position, pos) - PositionConstants.getDistanceTo(b.position, pos);
            });
            return sorted[skip];
        },
        
        getClosestPosition: function (positions, pos) {
            var result = null;
            var resultDist = 0;
            for (var i = 0; i < positions.length; i++) {
                var dist = PositionConstants.getDistanceTo(positions[i], pos);
                if (!result || dist < resultDist) {
                    result = positions[i];
                    resultDist = dist;
                }
            }
            return result;
        },
        
        getDistanceToCamp: function (worldVO, levelVO, sector) {
            if (sector.distanceToCamp >= 0) return sector.distanceToCamp;
            var result = 9999;
            for (var s = 0; s < levelVO.campSectors.length; s++) {
                var campSector = levelVO.campSectors[s];
                var path = WorldCreatorRandom.findPath(worldVO, sector.position, campSector.position, false, true);
                if (path && path.length >= 0) {
                    var dist = path.length;
                    result = Math.min(result, dist);
                }
            }
            sector.distanceToCamp = result;
            return result;
        },
        
        getQuickDistanceToCamp: function (worldVO, levelVO, sector) {
            var result = 9999;
            for (var s = 0; s < levelVO.campSectors.length; s++) {
                var campSector = levelVO.campSectors[s];
                var dist = PositionConstants.getDistanceTo(sector.position, campSector.position);
                result = Math.min(result, dist);
            }
            return result;
        },
        
        sortSectorsByPathLenTo: function (worldVO, sector) {
            return function (a, b) {
                var patha = WorldCreatorRandom.findPath(worldVO, sector.position, a.position);
                var pathb = WorldCreatorRandom.findPath(worldVO, sector.position, b.position);
                return patha.length - pathb.length;
            };
        },
        
        sortSectorsByDistanceTo: function (position) {
            return function (a, b) {
                var dista = PositionConstants.getDistanceTo(position, a.position);
                var distb = PositionConstants.getDistanceTo(position, b.position);
                return dista - distb;
            };
        },
        
        getVornoiPoints: function (seed, worldVO, levelVO) {
            var level = levelVO.level;
            var points = [];
            var addPoint = function (position, zone, minDistance) {
                if (minDistance) {
                    for (var i = 0; i < points.length; i++) {
                        if (PositionConstants.getDistanceTo(points[i].position, position) <= minDistance) return false;
                    }
                }
                points.push({ position: position, zone: zone, sectors: [] });
                return true;
            };
            
            // camp
            var campMiddle = PositionConstants.getMiddlePoint(levelVO.campPositions);
            addPoint(campMiddle, WorldConstants.ZONE_POI_TEMP);
            
            // two sectors furthest away from the camp (but not next to each other)
            var sectorsByDistance = levelVO.sectors.slice(0).sort(WorldCreatorHelper.sortSectorsByDistanceTo(campMiddle));
            addPoint(sectorsByDistance[sectorsByDistance.length - 1].position, WorldConstants.ZONE_EXTRA_CAMPABLE);
            var i = 1;
            while (i < sectorsByDistance.length) {
                i++;
                var added = addPoint(sectorsByDistance[sectorsByDistance.length - i].position, WorldConstants.ZONE_POI_TEMP, 8);
                if (added) break;
            }
            
            // randomish positions in 8 cardinal directions from camp
            var directions = PositionConstants.getLevelDirections();
            for (var i in directions) {
                var direction = directions[i];
                var pointDist = 7 + WorldCreatorRandom.randomInt(10101 + seed % 11 * 182 + i*549 + level * 28, 0, 7);
                var pointPos = PositionConstants.getPositionOnPath(campMiddle, direction, pointDist);
                if (levelVO.containsPosition(pointPos)) {
                    addPoint(pointPos, WorldConstants.ZONE_POI_TEMP, 6);
                }
            }
            
            return points;
        },
        
        getBorderSectorsForZone: function (levelVO, zone, includeAllPairs) {
            var result = [];
            var directions = PositionConstants.getLevelDirections();
            for (var i = 0; i < levelVO.sectors.length; i++) {
                var sector = levelVO.sectors[i];
                if (sector.zone == zone) continue;
                var neighbours = levelVO.getNeighbours(sector.position.sectorX, sector.position.sectorY);
                for (var d in directions) {
                    var direction = directions[d];
                    var neighbour = neighbours[direction];
                    if (neighbour && neighbour.zone == zone) {
                        result.push({ sector: sector, neighbour: neighbour });
                        if (!includeAllPairs) break;
                    }
                }
            }
            return result;
        },
		
		getBottomLevel: function (seed) {
            switch (seed % 5) {
                case 0: return 0;
                case 1: return 1;
                case 2: return -1;
                case 3: return 1;
                case 4: return 0;
            }
		},
		
		getHighestLevel: function (seed) {
            switch (seed % 5) {
                case 0: return 25;
                case 1: return 26;
                case 2: return 25;
                case 3: return 26;
                case 4: return 24;
            }
		},
		
		getLevelOrdinal: function(seed, level) {
			if (level > 13) {
                var bottomLevel = this.getBottomLevel(seed);
                var bottomLevelOrdinal = this.getLevelOrdinal(seed, bottomLevel);
                return bottomLevelOrdinal + (level - 13);
			} else {
                return -level + 14;
            }
		},
        
        getLevelForOrdinal: function (seed, levelOrdinal) {
            var bottomLevel = this.getBottomLevel(seed);
            var bottomLevelOrdinal = this.getLevelOrdinal(seed, bottomLevel);
            if (levelOrdinal <= bottomLevelOrdinal)
                return 13 - (levelOrdinal - 1);
            else
                return 13 + (levelOrdinal - bottomLevelOrdinal);
        },
		
		getCampOrdinal: function (seed, level) {
            var camplessLevelOrdinals = this.getCamplessLevelOrdinals(seed);
			var levelOrdinal = this.getLevelOrdinal(seed, level);
			var ordinal = 0;
			for (var i = 1; i <= levelOrdinal; i++) {
				if (camplessLevelOrdinals.indexOf(i) < 0) ordinal++;
			}
			return ordinal;
		},
        
        getLevelsForCamp: function (seed, campOrdinal) {
            var result = [];
            var mainLevelOrdinal = this.getLevelOrdinalForCampOrdinal(seed, campOrdinal);
            var mainLevel = this.getLevelForOrdinal(seed, mainLevelOrdinal);
            result.push(mainLevel);
            
            var camplessLevelOrdinals = this.getCamplessLevelOrdinals(seed);
            for (var i = 0; i < camplessLevelOrdinals.length; i++) {
                var l = this.getLevelForOrdinal(seed, camplessLevelOrdinals[i]);
                var co = this.getCampOrdinal(seed, l);
                if (co == campOrdinal) {
                    result.push(l);
                }
            }
            
            return result;
        },
        
        getNumSectorsForCamp: function (seed, campOrdinal) {
            var result = 0;
            var levels = WorldCreatorHelper.getLevelsForCamp(seed, campOrdinal);
            for (var i = 0; i < levels.length; i++) {
                var level = levels[i];
                var isSmallLevel = WorldCreatorHelper.isSmallLevel(seed, level);
                var numSectors = WorldCreatorConstants.getNumSectors(campOrdinal, isSmallLevel);
                result += numSectors;
            }
            return result;
        },
        
        getNumSectorsForLevelStage: function (worldVO, levelVO, stage) {
            var stages = worldVO.getStages(levelVO.level);
            for (var i = 0; i < stages.length; i++) {
                if (stages[i].stage == stage) {
                    return levelVO.numSectors / stages.length;
                }
            }
            return 0;
        },
        
        getLevelOrdinalForCampOrdinal: function (seed, campOrdinal) {
            // this assumes camplessLevelOrdinals are sorted from smallest to biggest
            var levelOrdinal = campOrdinal;
            var camplessLevelOrdinals = this.getCamplessLevelOrdinals(seed);
            for (var i = 0; i < camplessLevelOrdinals.length; i++) {
                if (camplessLevelOrdinals[i] <= levelOrdinal) {
                    levelOrdinal++;
                }
            }
            return levelOrdinal;
        },
        
        isCampableLevel: function (seed, level) {
            var camplessLevelOrdinals = this.getCamplessLevelOrdinals(seed);
            var levelOrdinal = this.getLevelOrdinal(seed, level);
            var campOrdinal = this.getCampOrdinal(seed, level);
            return camplessLevelOrdinals.indexOf(levelOrdinal) < 0 && campOrdinal <= WorldConstants.CAMP_ORDINAL_LIMIT;
        },
        
        isHardLevel: function (seed, level) {
            var hardLevelOrdinals = this.getHardLevelOrdinals(seed);
            var levelOrdinal = this.getLevelOrdinal(seed, level);
            return hardLevelOrdinals.includes(levelOrdinal);
        },
        
        isSmallLevel: function (seed, level) {
            var isCampableLevel = this.isCampableLevel(seed, level);
			var topLevel = this.getHighestLevel(seed);
			var bottomLevel = this.getBottomLevel(seed);
            return !isCampableLevel && level !== bottomLevel && level < topLevel - 1;
        },
        
        getNotCampableReason: function (seed, level) {
            if (this.isCampableLevel(seed, level)) return null;
            
            if (level === 14) return LevelConstants.UNCAMPABLE_LEVEL_TYPE_RADIATION;
            
            var campOrdinal = this.getCampOrdinal(seed, level);
            if (campOrdinal > WorldConstants.CAMP_ORDINAL_LIMIT)
                return LevelConstants.UNCAMPABLE_LEVEL_TYPE_ORDINAL_LIMIT;
            
            var levelOrdinal = this.getLevelOrdinal(seed, level);
            var rand = WorldCreatorRandom.random(seed % 4 + level + level * 8 + 88);
            if (rand < 0.33 && levelOrdinal >= WorldCreatorConstants.MIN_LEVEL_ORDINAL_HAZARD_RADIATION)
                return LevelConstants.UNCAMPABLE_LEVEL_TYPE_RADIATION;
            if (rand < 0.66 && levelOrdinal >= WorldCreatorConstants.MIN_LEVEL_ORDINAL_HAZARD_POISON)
                return LevelConstants.UNCAMPABLE_LEVEL_TYPE_POLLUTION;
            return LevelConstants.UNCAMPABLE_LEVEL_TYPE_SUPERSTITION;
        },
		
		getCamplessLevelOrdinals: function (seed) {
            if (!this.camplessLevelOrdinals[seed]) {
                var camplessLevelOrdinals = [];

                switch (seed % 5) {
                    case 0:
                        camplessLevelOrdinals.push(25);
                        camplessLevelOrdinals.push(23);
                        camplessLevelOrdinals.push(20);
                        camplessLevelOrdinals.push(17);
                        camplessLevelOrdinals.push(14);
                        camplessLevelOrdinals.push(15);
                        camplessLevelOrdinals.push(12);
                        camplessLevelOrdinals.push(10);
                        camplessLevelOrdinals.push(8);
                        camplessLevelOrdinals.push(5);
                        camplessLevelOrdinals.push(3);
                        break;
                    case 1:
                        camplessLevelOrdinals.push(25);
                        camplessLevelOrdinals.push(23);
                        camplessLevelOrdinals.push(21);
                        camplessLevelOrdinals.push(19);
                        camplessLevelOrdinals.push(17);
                        camplessLevelOrdinals.push(14);
                        camplessLevelOrdinals.push(13);
                        camplessLevelOrdinals.push(11);
                        camplessLevelOrdinals.push(9);
                        camplessLevelOrdinals.push(6);
                        camplessLevelOrdinals.push(3);
                        break;
                    case 2:
                        camplessLevelOrdinals.push(26);
                        camplessLevelOrdinals.push(24);
                        camplessLevelOrdinals.push(22);
                        camplessLevelOrdinals.push(19);
                        camplessLevelOrdinals.push(16);
                        camplessLevelOrdinals.push(15);
                        camplessLevelOrdinals.push(13);
                        camplessLevelOrdinals.push(11);
                        camplessLevelOrdinals.push(9);
                        camplessLevelOrdinals.push(7);
                        camplessLevelOrdinals.push(5);
                        camplessLevelOrdinals.push(3);
                        break;
                    case 3:
                        camplessLevelOrdinals.push(25);
                        camplessLevelOrdinals.push(23);
                        camplessLevelOrdinals.push(21);
                        camplessLevelOrdinals.push(18);
                        camplessLevelOrdinals.push(16);
                        camplessLevelOrdinals.push(14);
                        camplessLevelOrdinals.push(13);
                        camplessLevelOrdinals.push(11);
                        camplessLevelOrdinals.push(8);
                        camplessLevelOrdinals.push(6);
                        camplessLevelOrdinals.push(3);
                        break;
                    case 4:
                        camplessLevelOrdinals.push(23);
                        camplessLevelOrdinals.push(20);
                        camplessLevelOrdinals.push(17);
                        camplessLevelOrdinals.push(15);
                        camplessLevelOrdinals.push(14);
                        camplessLevelOrdinals.push(12);
                        camplessLevelOrdinals.push(10);
                        camplessLevelOrdinals.push(7);
                        camplessLevelOrdinals.push(5);
                        camplessLevelOrdinals.push(3);
                        break;
                }
                
                this.camplessLevelOrdinals[seed] = camplessLevelOrdinals.sort((a, b) => a - b);
            }
			return this.camplessLevelOrdinals[seed];
		},
        
        getHardLevelOrdinals: function (seed) {
            if (!this.hardLevelOrdinals[seed]) {
                var hardLevelOrdinals = [];
                var surfaceLevel = this.getHighestLevel(seed);
                hardLevelOrdinals.push(this.getLevelOrdinal(seed, 14));
                hardLevelOrdinals.push(this.getLevelOrdinal(seed, surfaceLevel));
                switch (seed % 5) {
                    case 0:
                        hardLevelOrdinals.push(10);
                        hardLevelOrdinals.push(23);
                        break;
                    case 1:
                        hardLevelOrdinals.push(9);
                        hardLevelOrdinals.push(23);
                        break;
                    case 2:
                        hardLevelOrdinals.push(11);
                        hardLevelOrdinals.push(24);
                        break;
                    case 3:
                        hardLevelOrdinals.push(11);
                        hardLevelOrdinals.push(23);
                        break;
                    case 4:
                        hardLevelOrdinals.push(10);
                        hardLevelOrdinals.push(23);
                        break;
                }
                this.hardLevelOrdinals[seed] = hardLevelOrdinals.sort();
            }
            return this.hardLevelOrdinals[seed];
        },
		
		isDarkLevel: function (seed, level) {
			return !this.isEarthLevel(seed, level) && !this.isSunLevel(seed, level);
		},
		
		isEarthLevel: function( seed, level ) {
			var lowest = this.getBottomLevel(seed, level);
			return level <= Math.min(lowest + 5, 3);
		},
		
		isSunLevel: function( seed, level ) {
			var highest = this.getHighestLevel(seed, level);
			return level >= highest - 5;
		},
        
        containsBlockingFeature: function (pos, features, allowNonBuilt) {
            for (var i = 0; i < features.length; i++) {
                var feature = features[i];
                if (allowNonBuilt && !feature.isBuilt()) continue;
                if (feature.containsPosition(pos)) {
                    return true;
                }
            }
            return false;
        },
        
    };

    return WorldCreatorHelper;
});
