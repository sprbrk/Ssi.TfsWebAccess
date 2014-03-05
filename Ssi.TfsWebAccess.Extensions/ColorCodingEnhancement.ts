/// <reference path="scripts/_references.ts" />

import TF = require("Presentation/Scripts/TFS/TFS");
import TFS_OM = require("Presentation/Scripts/TFS/TFS.OM");
import TFS_UI_Controls = require("Presentation/Scripts/TFS/TFS.UI.Controls");
import TFS_WorkItemTracking = require("WorkItemTracking/Scripts/TFS.WorkItemTracking");

declare var $: JQueryStatic;

module Ssi.TfsWebAccess.Extensions {
    export class ColorCodingApplicator {

        /**
         * Stores the static list of activity types in use.
         */
        private static ActivityTypes: Array<string> = [
            'Deployment', 'Design', 'Development',
            'Documentation', 'Requirements', 'Testing'];

        /**
         * Stores the current page's work item manager.
         */
        private WorkItemManager: TFS_WorkItemTracking.WorkItemManager;

        /**
         * Creates a new core extension.
         * @param TF The TFS interface.
         * @param TFS_OM The TFS Object Manager.
         * @param TFS_WorkItemTracking The Work Item Tracking interface.
         */
        constructor(
            private TF: typeof TF,
            private TFS_OM: typeof TFS_OM,
            private TFS_WorkItemTracking: typeof TFS_WorkItemTracking) {

            // Get the work item manager service.
            this.WorkItemManager = this.TFS_OM
                .TfsTeamProjectCollection
                .getDefaultConnection()
                .getService(this.TFS_WorkItemTracking.WorkItemStore)
            .workItemManager;

            // Listen to the work item change event to make sure that the
            // activity color coding gets updated whenever a user changes
            // the work item's activity type.
            this.WorkItemManager.attachWorkItemChanged((sender, args) => {
                if (args.change === this.TFS_WorkItemTracking.WorkItemChangeType.Reset ||
                    args.change === this.TFS_WorkItemTracking.WorkItemChangeType.SaveCompleted) {

                    // Color code the work item after 100 milliseconds,
                    // because the data may not yet be available.
                    window.setTimeout(() => this.colorCodeWorkItem(args.workItem), 100);
                }
            });
        }

        /**
         * Initializes the extension.
         */
        public init(): any {

            // Inject the additional references.
            new Bundle(this.getModuleBase())
                .css("ColorCodingEnhancement.css")
                .inject();

            // Only perform additional work if this is the task board.
            if (this.isTaskBoard()) {
                this.addColorCoding();
            }
        }

        /**
         * Adds color coding to the work item task board.
         */
        private addColorCoding() {
            // Find all of the IDs on the board.
            var ids = $(".tbTile").map((idx, item: any) => item.id.match(/\d+$/)[0]).get();

            // Query the activity type from the work items, and then color code them.
            var GET_WORKITEMS_KEY = "beginGetWorkItems";
            var actionId = this.TF.globalProgressIndicator.actionStarted(GET_WORKITEMS_KEY);
            this.WorkItemManager.beginGetWorkItems(ids, workitems => {
                $.each(workitems, (idx, wi) => {
                    this.colorCodeWorkItem(wi);
                });
                this.TF.globalProgressIndicator.actionCompleted(GET_WORKITEMS_KEY);
            });
        }

        /**
         * Color codes a specific work item.
         */
        private colorCodeWorkItem(workItem: TFS_WorkItemTracking.WorkItem) {

            // Get the activity for the work item.
            var activity = workItem.getFieldValue("Activity");

            // Get the work item's ID, and find the tile associated with it.
            var id = workItem.getFieldValue("System.Id");
            var tile = $("#tile-" + id);

            // Remove any previous class reference.
            for (var i = 0; i < ColorCodingApplicator.ActivityTypes.length; i++) {
                var type = ColorCodingApplicator.ActivityTypes[i];
                tile.removeClass(type);
            }

            // If the work item has an activity, then color code it.
            if (activity) {
                // Add the activity as a class name to update the colors.
                tile.addClass(activity);
            }
        }

        /**
         * Get this module's base.
         */
        private getModuleBase(): string {
            return this.TF.getModuleBase(ColorCodingEnhancement._typeName);
        }

        /**
         * Determines if the current page is the task board.
         */
        private isTaskBoard(): boolean {
            return $(".taskboard").length > 0;
        }
    }

    /**
     * Bundles up any external elements, e.g., css or
     * javascript, and injects them with one call.
     */
    class Bundle {
        /**
         * Stores the pending list of HTML elements to push to the document.
         */
        private _items: Array<HTMLElement> = [];

        /**
         * Creates a new bundle instance
         * @param baseUrl The root url to use for loading files from.
         */
        constructor(private baseUrl: string) { }

        /**
         * Queues a new CSS file to be loaded.
         * @param name The name of the CSS file to load.
         * @returns The bundle fluent instance.
         */
        public css(name: string): Bundle {
            var element = document.createElement("link");
            element.rel = "stylesheet";
            element.type = "text/css";
            element.href = this.baseUrl + name;
            this._items.push(element);
            return this;
        }

        /**
         * Injects all queued files to the head element for loading.
         */
        public inject() {
            // Put all of the elements into the body to load the files.
            this._items.forEach(e => document.body.appendChild(e));
            this._items = [];
        }

        /**
         * Queues a new JavaScript file to be loaded.
         * @param name The name of the JavaScript file to load.
         * @returns The bundle fluent instance.
         */
        public js(name: string): Bundle {
            var element = document.createElement("script");
            element.type = "text/javascript";
            element.src = this.baseUrl + name;
            this._items.push(element);
            return this;
        }

    }
}

/**
 * Provides color coding to the work item task board.
 */
class ColorCodingEnhancement extends TFS_UI_Controls.BaseControl {
    static _typeName = "ColorCodingEnhancement";

    /**
     * Creates a new instance with options.
     */
    constructor(options) {
        super(options);
    }

    /**
     * Overrides the initialization of options.
     */
    initializeOptions(options) {
        super.initializeOptions($.extend({}, options));
    }

    /**
     * Initializes the extension by calling the core class.
     */
    initialize() {
        var core = new Ssi.TfsWebAccess.Extensions.ColorCodingApplicator(TF, TFS_OM, TFS_WorkItemTracking);
        core.init();
    }
}

// Inject the color coding class.
TF.initClassPrototype(ColorCodingEnhancement, {});
TFS_UI_Controls.Enhancement.registerEnhancement(ColorCodingEnhancement, '.taskboard');