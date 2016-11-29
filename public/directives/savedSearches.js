const _ = require('lodash');
const module = require('ui/modules').get('kibana');

define(function (require) {
  module.directive('savedSearches', function (Private, indexPatterns) {
    const services = Private(require('ui/saved_objects/saved_object_registry')).byLoaderPropertiesName;
    const service = services['searches'];

    return {
      restrict: 'E',
      replace: true,
      scope: {
      },
      template: require('./savedSearches.html'),
      link: function (scope, element, attrs) {
        fetchSavedSearches();
        
        scope.updateIndex = function() {
          console.log(scope.selected);
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
