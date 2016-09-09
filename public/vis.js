import _ from 'lodash';
import supports from 'ui/utils/supports';
import FilterBarPushFilterProvider from 'ui/filter_bar/push_filter';

define(function (require) {
  require('ui/registry/vis_types').register(EnhancedTileMapVisProvider);
  require('plugins/enhanced_tilemap/visController');

  function EnhancedTileMapVisProvider(Private, getAppState, courier, config) {
    var TemplateVisType = Private(require('ui/template_vis_type/TemplateVisType'));
    var Schemas = Private(require('ui/Vis/Schemas'));
    
    return new TemplateVisType({
      name: 'enhanced_tilemap',
      title: 'Enhanced Tile map',
      icon: 'fa-map-marker',
      description: 'Enhanced tile map',
      template: require('plugins/enhanced_tilemap/vis.html'),
      params: {
        defaults: {
          mapType: 'Scaled Circle Markers',
          isDesaturated: true,
          addTooltip: true,
          heatMaxZoom: 16,
          heatMinOpacity: 0.1,
          heatRadius: 25,
          heatBlur: 15,
          heatNormalizeData: true,
          mapZoom: 2,
          mapCenter: [15, 5],
          wms: config.get('visualization:tileMap:WMSdefaults')
        },
        mapTypes: ['Scaled Circle Markers', 'Shaded Circle Markers', 'Shaded Geohash Grid', 'Heatmap'],
        canDesaturate: !!supports.cssFilters,
        editor: require('plugins/enhanced_tilemap/options.html')
      },
      listeners: {
        rectangle: function (event) {
          const agg = _.get(event, 'chart.geohashGridAgg');
          if (!agg) return;

          const pushFilter = Private(FilterBarPushFilterProvider)(getAppState());
          const indexPatternName = agg.vis.indexPattern.id;
          const field = agg.fieldName();
          const filter = {geo_bounding_box: {}};
          filter.geo_bounding_box[field] = event.bounds;

          pushFilter(filter, false, indexPatternName);
        },
        mapMoveEnd: function (event) {
          const vis = _.get(event, 'chart.geohashGridAgg.vis');
          if (vis && vis.hasUiState()) {
            vis.getUiState().set('mapCenter', event.center);
          }
        },
        mapZoomEnd: function (event) {
          const vis = _.get(event, 'chart.geohashGridAgg.vis');
          if (vis && vis.hasUiState()) {
            vis.getUiState().set('mapZoom', event.zoom);
          }

          const autoPrecision = _.get(event, 'chart.geohashGridAgg.params.autoPrecision');
          if (autoPrecision) {
            courier.fetch();
          }
        }
      },
      schemas: new Schemas([
        {
          group: 'metrics',
          name: 'metric',
          title: 'Value',
          min: 1,
          max: 1,
          aggFilter: ['count', 'avg', 'sum', 'min', 'max', 'cardinality'],
          defaults: [
            { schema: 'metric', type: 'count' }
          ]
        },
        {
          group: 'buckets',
          name: 'segment',
          title: 'Geo Coordinates',
          aggFilter: 'geohash_grid',
          min: 1,
          max: 1
        },
        {
          group: 'buckets',
          name: 'split',
          title: 'Split Chart',
          deprecate: true,
          deprecateMessage: 'The Split Chart feature for Tile Maps has been deprecated.',
          min: 0,
          max: 1
        }
      ])
    });
  }

  return EnhancedTileMapVisProvider;
});