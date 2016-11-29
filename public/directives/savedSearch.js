const _ = require('lodash');
const module = require('ui/modules').get('kibana');

define(function (require) {
  module.directive('savedSearch', function (Private, indexPatterns) {
    const services = Private(require('ui/saved_objects/saved_object_registry')).byLoaderPropertiesName;
    const service = services['searches'];

    return {
      restrict: 'E',
      replace: true,
      scope: {
      },
      template: require('./savedSearch.html'),
      link: function (scope, element, attrs) {
        fetchSavedSearches();
        
        scope.updateIndex = function() {
          scope.warn = "";
          scope.geoPointField = null;

          indexPatterns.get(scope.savedSearch.indexId).then(function (index) {
            scope.geoPointFields = index.fields.filter(function (field) {
              return field.type === 'geo_point';
            }).map(function (field) {
              return field.name;
            });
            if (scope.geoPointFields.length === 0) {
              scope.warn = "Unable to use selected saved search for points of interest, index does not contain any geo_point fields."
            } else if (scope.geoPointFields.length === 1) {
              scope.geoPointField = scope.geoPointFields[0];
            }
          });
        }

        function fetchSavedSearches() {
          //TODO add filter to find to reduce results
          service.find()
          .then(function (hits) {
            scope.items = _.map(hits.hits, function(hit) {
              return {
                indexId: getIndexId(hit),
                label: hit.title,
                value: hit.id
              };
            });
          });
        }
      }
    };

    function getIndexId(hit) {
      const state = JSON.parse(hit.kibanaSavedObjectMeta.searchSourceJSON);
      return state.index;
    }
  });
});
