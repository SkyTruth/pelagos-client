define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "app/Visualization/Animation/ObjectToTable",
  "app/Visualization/UI/GenerateReportDialog",
  "app/Visualization/UI/SidePanels/SidePanelBase",
  "app/Visualization/UI/LoaderIcon",
  "shims/jQuery/main"
], function(
  declare,
  domStyle,
  ObjectToTable,
  GenerateReportDialog,
  SidePanelBase,
  LoaderIcon,
  $
){
  return declare("InfoUI", [SidePanelBase], {
    baseClass: 'InfoUI',
    title: 'Info',
    LoaderIcon: LoaderIcon,
    colors: {
      info: 'inherit',
      warning: '#ff5500',
      error: '#ff0000'
    },

    templateString: '' +
      '<div class="${baseClass}" style="overflow: auto;">' +
      '  <div class="titleButtons">' +
      '    <a id="activate_search" class="activate_search" href="javascript:undefined" data-dojo-attach-event="click:activateSearch"><i class="fa fa-search"></i></a>' +
      '    <a class="download_kml" target="_new" href="javascript:undefined" style="display: none;" data-dojo-attach-point="downloadNode"><i class="fa fa-download" title="Download as KML"></i></a>' +
      '    <a class="report" href="javascript:undefined" style="display: none;" data-dojo-attach-point="reportNode"><i class="fa fa-list-alt" title="Generate report"></i></a>' +
      '  </div>' +
      '  <div class="contentWrapper">' +
      '    <h2 data-dojo-attach-point="titleNode">Vessel Information</h2>' +
      '    <div class="loading-vessel-info" style="display: none;" data-dojo-attach-point="loadingNode">' +
             '<img style="width: 20px;" src="${LoaderIcon}">'+
          '</div>' +
      '    <div id="vessel_identifiers" class="${baseClass}Container" data-dojo-attach-point="containerNode"></div>' + 
      '  </div>' +
      '</div>',
   startup: function () {
      var self = this;
      self.inherited(arguments);

      self.visualization.animations.events.on({
        'info-loading': self.updateLoading.bind(self),
        'info': self.update.bind(self, self.colors.info),
        'info-error': self.update.bind(self, self.colors.error)
      });
      self.clear();
    },

    activateSearch: function () {
      var self = this;
      self.visualization.ui.search.displaySearchDialog();
    },

    setDefaultTitle: function () {
      var self = this;
      $(self.titleNode).html("Vessel Information");
    },

    clear: function () {
      var self = this;

      self.setDefaultTitle();
      $(self.containerNode).html('<em>Nothing selected</em>');
      $(self.loadingNode).hide();
      $(self.containerNode).show();
    },

    updateLoading: function () {
      var self = this;

      self.setDefaultTitle();
      $(self.containerNode).hide();
      $(self.loadingNode).show();
    },

    update: function (color, event) {
      var self = this;

      self.clear();

      if (event.data) {
        self._updateContainerNode(event);
      }

      self._setupDownloadLink(event);
      self._setupReportLink(event);

      if (
        event.data &&
        event.data.level &&
        self.colors[event.data.level]) {

        color = self.colors[event.data.level]
      }

      $(self.containerNode).css({color: color});

      $(self.loadingNode).hide();
      $(self.containerNode).show();

      if (event.data) {
        var ancestor = self;
        while (ancestor = ancestor.getParent()) {
          if (ancestor.selectChild) {
            ancestor.resize();
            ancestor.selectChild(self, true);
            break;
          }
        }
      }
    },

    _updateContainerNode: function(event) {
      var self = this;

      $(self.titleNode).html(event.data.title || event.layer);
      $(self.containerNode).html(ObjectToTable(event.data, {render_title: false}));
    },

    _hasDownloadEnabled: function(event) {
      return event.layerInstance &&
        event.layerInstance.data_view &&
        event.layerInstance.data_view.source &&
        event.layerInstance.data_view.source.header &&
        event.layerInstance.data_view.source.header.kml;
    },

    _setupDownloadLink: function(event) {
      var self = this;

      $(self.downloadNode).hide();
      if (self._hasDownloadEnabled(event)) {
        var query = event.layerInstance.data_view.source.getSelectionQuery(
          event.layerInstance.data_view.selections.selections[event.category]);

        $(self.downloadNode).attr({
            href: (event.layerInstance.data_view.source.getUrl('export', query, -1) +
                 "/sub/" +
                 query +
                 "/export")
        });

        $(self.downloadNode).show();
      }
    },

    _hasReportEnabled: function(event) {
      return event.data && 
        event.data.report &&
        event.layerInstance &&
        event.layerInstance.data &&
        event.layerInstance.data.header &&
        event.layerInstance.data.header.reports;
    },

    _setupReportLink: function(event) {
      var self = this;

      $(self.reportNode).hide();
      $(self.reportNode).off("click");

      var reportableAnimation = self.visualization.animations.getReportableAnimation();

      if (reportableAnimation && self._hasReportEnabled(event)) {
        $(self.reportNode).show();
        $(self.reportNode).on("click", function() {
          var report = {
            spec: event.layerInstance.data.header.reports,
            data: event.data.polygonData,
            state: self.visualization.state,
            datamanager: self.visualization.data,
            animation: event.layerInstance.title,
            reportableAnimation: reportableAnimation,
          };
          new GenerateReportDialog(report).show();
        });
      }
    }
  });
});
