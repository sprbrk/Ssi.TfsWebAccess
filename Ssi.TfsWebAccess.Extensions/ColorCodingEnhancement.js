/// <reference path="scripts/_references.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "Presentation/Scripts/TFS/TFS", "Presentation/Scripts/TFS/TFS.OM", "Presentation/Scripts/TFS/TFS.UI.Controls", "WorkItemTracking/Scripts/TFS.WorkItemTracking"], function(require, exports, TF, TFS_OM, TFS_UI_Controls, TFS_WorkItemTracking) {
    var Ssi;
    (function (Ssi) {
        (function (TfsWebAccess) {
            (function (Extensions) {
                var ColorCodingApplicator = (function () {
                    /**
                    * Creates a new core extension.
                    * @param TF The TFS interface.
                    * @param TFS_OM The TFS Object Manager.
                    * @param TFS_WorkItemTracking The Work Item Tracking interface.
                    */
                    function ColorCodingApplicator(TF, TFS_OM, TFS_WorkItemTracking) {
                        var _this = this;
                        this.TF = TF;
                        this.TFS_OM = TFS_OM;
                        this.TFS_WorkItemTracking = TFS_WorkItemTracking;
                        // Get the work item manager service.
                        this.WorkItemManager = this.TFS_OM.TfsTeamProjectCollection.getDefaultConnection().getService(this.TFS_WorkItemTracking.WorkItemStore).workItemManager;

                        // Listen to the work item change event to make sure that the
                        // activity color coding gets updated whenever a user changes
                        // the work item's activity type.
                        this.WorkItemManager.attachWorkItemChanged(function (sender, args) {
                            if (args.change === _this.TFS_WorkItemTracking.WorkItemChangeType.Reset || args.change === _this.TFS_WorkItemTracking.WorkItemChangeType.SaveCompleted) {
                                // Color code the work item after 100 milliseconds,
                                // because the data may not yet be available.
                                window.setTimeout(function () {
                                    return _this.colorCodeWorkItem(args.workItem);
                                }, 100);
                            }
                        });
                    }
                    /**
                    * Initializes the extension.
                    */
                    ColorCodingApplicator.prototype.init = function () {
                        // Inject the additional references.
                        new Bundle(this.getModuleBase()).css("ColorCodingEnhancement.css").inject();

                        // Only perform additional work if this is the task board.
                        if (this.isTaskBoard()) {
                            this.addColorCoding();
                        }
                    };

                    /**
                    * Adds color coding to the work item task board.
                    */
                    ColorCodingApplicator.prototype.addColorCoding = function () {
                        var _this = this;
                        // Find all of the IDs on the board.
                        var ids = $(".tbTile").map(function (idx, item) {
                            return item.id.match(/\d+$/)[0];
                        }).get();

                        // Query the activity type from the work items, and then color code them.
                        var GET_WORKITEMS_KEY = "beginGetWorkItems";
                        var actionId = this.TF.globalProgressIndicator.actionStarted(GET_WORKITEMS_KEY);
                        this.WorkItemManager.beginGetWorkItems(ids, function (workitems) {
                            $.each(workitems, function (idx, wi) {
                                _this.colorCodeWorkItem(wi);
                            });
                            _this.TF.globalProgressIndicator.actionCompleted(GET_WORKITEMS_KEY);
                        });
                    };

                    /**
                    * Color codes a specific work item.
                    */
                    ColorCodingApplicator.prototype.colorCodeWorkItem = function (workItem) {
                        // Get the activity for the work item.
                        var activity = workItem.getFieldValue("Activity");

                        // Get the work item's ID, and find the tile associated with it.
                        var id = workItem.getFieldValue("System.Id");
                        var tile = $("#tile-" + id);

                        for (var i = 0; i < ColorCodingApplicator.ActivityTypes.length; i++) {
                            var type = ColorCodingApplicator.ActivityTypes[i];
                            tile.removeClass(type);
                        }

                        // If the work item has an activity, then color code it.
                        if (activity) {
                            // Add the activity as a class name to update the colors.
                            tile.addClass(activity);
                        }
                    };

                    /**
                    * Get this module's base.
                    */
                    ColorCodingApplicator.prototype.getModuleBase = function () {
                        return this.TF.getModuleBase(ColorCodingEnhancement._typeName);
                    };

                    /**
                    * Determines if the current page is the task board.
                    */
                    ColorCodingApplicator.prototype.isTaskBoard = function () {
                        return $(".taskboard").length > 0;
                    };
                    ColorCodingApplicator.ActivityTypes = [
                        'Deployment', 'Design', 'Development',
                        'Documentation', 'Requirements', 'Testing'];
                    return ColorCodingApplicator;
                })();
                Extensions.ColorCodingApplicator = ColorCodingApplicator;

                /**
                * Bundles up any external elements, e.g., css or
                * javascript, and injects them with one call.
                */
                var Bundle = (function () {
                    /**
                    * Creates a new bundle instance
                    * @param baseUrl The root url to use for loading files from.
                    */
                    function Bundle(baseUrl) {
                        this.baseUrl = baseUrl;
                        /**
                        * Stores the pending list of HTML elements to push to the document.
                        */
                        this._items = [];
                    }
                    /**
                    * Queues a new CSS file to be loaded.
                    * @param name The name of the CSS file to load.
                    * @returns The bundle fluent instance.
                    */
                    Bundle.prototype.css = function (name) {
                        var element = document.createElement("link");
                        element.rel = "stylesheet";
                        element.type = "text/css";
                        element.href = this.baseUrl + name;
                        this._items.push(element);
                        return this;
                    };

                    /**
                    * Injects all queued files to the head element for loading.
                    */
                    Bundle.prototype.inject = function () {
                        // Put all of the elements into the body to load the files.
                        this._items.forEach(function (e) {
                            return document.body.appendChild(e);
                        });
                        this._items = [];
                    };

                    /**
                    * Queues a new JavaScript file to be loaded.
                    * @param name The name of the JavaScript file to load.
                    * @returns The bundle fluent instance.
                    */
                    Bundle.prototype.js = function (name) {
                        var element = document.createElement("script");
                        element.type = "text/javascript";
                        element.src = this.baseUrl + name;
                        this._items.push(element);
                        return this;
                    };
                    return Bundle;
                })();
            })(TfsWebAccess.Extensions || (TfsWebAccess.Extensions = {}));
            var Extensions = TfsWebAccess.Extensions;
        })(Ssi.TfsWebAccess || (Ssi.TfsWebAccess = {}));
        var TfsWebAccess = Ssi.TfsWebAccess;
    })(Ssi || (Ssi = {}));

    /**
    * Provides color coding to the work item task board.
    */
    var ColorCodingEnhancement = (function (_super) {
        __extends(ColorCodingEnhancement, _super);
        /**
        * Creates a new instance with options.
        */
        function ColorCodingEnhancement(options) {
            _super.call(this, options);
        }
        /**
        * Overrides the initialization of options.
        */
        ColorCodingEnhancement.prototype.initializeOptions = function (options) {
            _super.prototype.initializeOptions.call(this, $.extend({}, options));
        };

        /**
        * Initializes the extension by calling the core class.
        */
        ColorCodingEnhancement.prototype.initialize = function () {
            var core = new Ssi.TfsWebAccess.Extensions.ColorCodingApplicator(TF, TFS_OM, TFS_WorkItemTracking);
            core.init();
        };
        ColorCodingEnhancement._typeName = "ColorCodingEnhancement";
        return ColorCodingEnhancement;
    })(TFS_UI_Controls.BaseControl);

    // Inject the color coding class.
    TF.initClassPrototype(ColorCodingEnhancement, {});
    TFS_UI_Controls.Enhancement.registerEnhancement(ColorCodingEnhancement, '.taskboard');
});
//# sourceMappingURL=ColorCodingEnhancement.js.map
