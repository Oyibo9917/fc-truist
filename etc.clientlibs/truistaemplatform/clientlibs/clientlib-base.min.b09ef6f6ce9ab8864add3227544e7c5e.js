/*******************************************************************************
 * Copyright 2019 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/

/**
 * Element.matches()
 * https://developer.mozilla.org/enUS/docs/Web/API/Element/matches#Polyfill
 */
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

// eslint-disable-next-line valid-jsdoc
/**
 * Element.closest()
 * https://developer.mozilla.org/enUS/docs/Web/API/Element/closest#Polyfill
 */
if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        "use strict";
        var el = this;
        if (!document.documentElement.contains(el)) {
            return null;
        }
        do {
            if (el.matches(s)) {
                return el;
            }
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

/*******************************************************************************
 * Copyright 2019 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var containerUtils = window.CQ && window.CQ.CoreComponents && window.CQ.CoreComponents.container && window.CQ.CoreComponents.container.utils ? window.CQ.CoreComponents.container.utils : undefined;
    if (!containerUtils) {
        // eslint-disable-next-line no-console
        console.warn("Accordion: container utilities at window.CQ.CoreComponents.container.utils are not available. This can lead to missing features. Ensure the core.wcm.components.commons.site.container client library is included on the page.");
    }
    var dataLayerEnabled;
    var dataLayer;
    var delay = 100;

    var NS = "cmp";
    var IS = "accordion";

    var keyCodes = {
        ENTER: 13,
        SPACE: 32,
        END: 35,
        HOME: 36,
        ARROW_LEFT: 37,
        ARROW_UP: 38,
        ARROW_RIGHT: 39,
        ARROW_DOWN: 40
    };

    var selectors = {
        self: "[data-" + NS + '-is="' + IS + '"]'
    };

    var cssClasses = {
        button: {
            disabled: "cmp-accordion__button--disabled",
            expanded: "cmp-accordion__button--expanded"
        },
        panel: {
            hidden: "cmp-accordion__panel--hidden",
            expanded: "cmp-accordion__panel--expanded"
        }
    };

    var dataAttributes = {
        item: {
            expanded: "data-cmp-expanded"
        }
    };

    var properties = {
        /**
         * Determines whether a single accordion item is forced to be expanded at a time.
         * Expanding one item will collapse all others.
         *
         * @memberof Accordion
         * @type {Boolean}
         * @default false
         */
        "singleExpansion": {
            "default": false,
            "transform": function(value) {
                return !(value === null || typeof value === "undefined");
            }
        }
    };

    /**
     * Accordion Configuration.
     *
     * @typedef {Object} AccordionConfig Represents an Accordion configuration
     * @property {HTMLElement} element The HTMLElement representing the Accordion
     * @property {Object} options The Accordion options
     */

    /**
     * Accordion.
     *
     * @class Accordion
     * @classdesc An interactive Accordion component for toggling panels of related content
     * @param {AccordionConfig} config The Accordion configuration
     */
    function Accordion(config) {
        var that = this;

        if (config && config.element) {
            init(config);
        }

        /**
         * Initializes the Accordion.
         *
         * @private
         * @param {AccordionConfig} config The Accordion configuration
         */
        function init(config) {
            that._config = config;

            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");

            setupProperties(config.options);
            cacheElements(config.element);

            if (that._elements["item"]) {
                // ensures multiple element types are arrays.
                that._elements["item"] = Array.isArray(that._elements["item"]) ? that._elements["item"] : [that._elements["item"]];
                that._elements["button"] = Array.isArray(that._elements["button"]) ? that._elements["button"] : [that._elements["button"]];
                that._elements["panel"] = Array.isArray(that._elements["panel"]) ? that._elements["panel"] : [that._elements["panel"]];

                // Expand the item based on deep-link-id if it matches with any existing accordion item id
                if (containerUtils) {
                    var deepLinkItem = containerUtils.getDeepLinkItem(that, "item");
                    if (deepLinkItem && !deepLinkItem.hasAttribute(dataAttributes.item.expanded)) {
                        setItemExpanded(deepLinkItem, true);
                    }
                }

                if (that._properties.singleExpansion) {
                    // No deep linking
                    if (!deepLinkItem) {
                        var expandedItems = getExpandedItems();
                        // no expanded item annotated, force the first item to display.
                        if (expandedItems.length === 0) {
                            toggle(0);
                        }
                        // multiple expanded items annotated, display the last item open.
                        if (expandedItems.length > 1) {
                            toggle(expandedItems.length - 1);
                        }
                    } else {
                        // Deep link case
                        // Collapse the items other than which is deep linked
                        for (var j = 0; j < that._elements["item"].length; j++) {
                            if (that._elements["item"][j].id !== deepLinkItem.id &&
                                that._elements["item"][j].hasAttribute(dataAttributes.item.expanded)) {
                                setItemExpanded(that._elements["item"][j], false);
                            }
                        }
                    }
                }

                refreshItems();
                bindEvents();

                if (window.Granite && window.Granite.author && window.Granite.author.MessageChannel) {
                    /*
                     * Editor message handling:
                     * - subscribe to "cmp.panelcontainer" message requests sent by the editor frame
                     * - check that the message data panel container type is correct and that the id (path) matches this specific Accordion component
                     * - if so, route the "navigate" operation to enact a navigation of the Accordion based on index data
                     */
                    window.CQ.CoreComponents.MESSAGE_CHANNEL = window.CQ.CoreComponents.MESSAGE_CHANNEL || new window.Granite.author.MessageChannel("cqauthor", window);
                    window.CQ.CoreComponents.MESSAGE_CHANNEL.subscribeRequestMessage("cmp.panelcontainer", function(message) {
                        if (message.data && message.data.type === "cmp-accordion" && message.data.id === that._elements.self.dataset["cmpPanelcontainerId"]) {
                            if (message.data.operation === "navigate") {
                                // switch to single expansion mode when navigating in edit mode.
                                var singleExpansion = that._properties.singleExpansion;
                                that._properties.singleExpansion = true;
                                toggle(message.data.index);

                                // revert to the configured state.
                                that._properties.singleExpansion = singleExpansion;
                            }
                        }
                    });
                }
            }
        }

        /**
         * Caches the Accordion elements as defined via the {@code data-accordion-hook="ELEMENT_NAME"} markup API.
         *
         * @private
         * @param {HTMLElement} wrapper The Accordion wrapper element
         */
        function cacheElements(wrapper) {
            that._elements = {};
            that._elements.self = wrapper;
            var hooks = that._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS + "]");

            for (var i = 0; i < hooks.length; i++) {
                var hook = hooks[i];
                if (hook.closest("." + NS + "-" + IS) === that._elements.self) { // only process own accordion elements
                    var capitalized = IS;
                    capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
                    var key = hook.dataset[NS + "Hook" + capitalized];
                    if (that._elements[key]) {
                        if (!Array.isArray(that._elements[key])) {
                            var tmp = that._elements[key];
                            that._elements[key] = [tmp];
                        }
                        that._elements[key].push(hook);
                    } else {
                        that._elements[key] = hook;
                    }
                }
            }
        }

        /**
         * Sets up properties for the Accordion based on the passed options.
         *
         * @private
         * @param {Object} options The Accordion options
         */
        function setupProperties(options) {
            that._properties = {};

            for (var key in properties) {
                if (Object.prototype.hasOwnProperty.call(properties, key)) {
                    var property = properties[key];
                    var value = null;

                    if (options && options[key] != null) {
                        value = options[key];

                        // transform the provided option
                        if (property && typeof property.transform === "function") {
                            value = property.transform(value);
                        }
                    }

                    if (value === null) {
                        // value still null, take the property default
                        value = properties[key]["default"];
                    }

                    that._properties[key] = value;
                }
            }
        }

        /**
         * Binds Accordion event handling.
         *
         * @private
         */
        function bindEvents() {
            var buttons = that._elements["button"];
            if (buttons) {
                for (var i = 0; i < buttons.length; i++) {
                    (function(index) {
                        buttons[i].addEventListener("click", function(event) {
                            toggle(index);
                            focusButton(index);
                        });
                        buttons[i].addEventListener("keydown", function(event) {
                            onButtonKeyDown(event, index);
                        });
                    })(i);
                }
            }
        }

        /**
         * Handles button keydown events.
         *
         * @private
         * @param {Object} event The keydown event
         * @param {Number} index The index of the button triggering the event
         */
        function onButtonKeyDown(event, index) {
            var lastIndex = that._elements["button"].length - 1;

            switch (event.keyCode) {
                case keyCodes.ARROW_LEFT:
                case keyCodes.ARROW_UP:
                    event.preventDefault();
                    if (index > 0) {
                        focusButton(index - 1);
                    }
                    break;
                case keyCodes.ARROW_RIGHT:
                case keyCodes.ARROW_DOWN:
                    event.preventDefault();
                    if (index < lastIndex) {
                        focusButton(index + 1);
                    }
                    break;
                case keyCodes.HOME:
                    event.preventDefault();
                    focusButton(0);
                    break;
                case keyCodes.END:
                    event.preventDefault();
                    focusButton(lastIndex);
                    break;
                case keyCodes.ENTER:
                case keyCodes.SPACE:
                    event.preventDefault();
                    toggle(index);
                    focusButton(index);
                    break;
                default:
                    return;
            }
        }

        /**
         * General handler for toggle of an item.
         *
         * @private
         * @param {Number} index The index of the item to toggle
         */
        function toggle(index) {
            var item = that._elements["item"][index];
            if (item) {
                if (that._properties.singleExpansion) {
                    // ensure only a single item is expanded if single expansion is enabled.
                    for (var i = 0; i < that._elements["item"].length; i++) {
                        if (that._elements["item"][i] !== item) {
                            var expanded = getItemExpanded(that._elements["item"][i]);
                            if (expanded) {
                                setItemExpanded(that._elements["item"][i], false);
                            }
                        }
                    }
                }
                setItemExpanded(item, !getItemExpanded(item));

                if (dataLayerEnabled) {
                    var accordionId = that._elements.self.id;
                    var expandedItems = getExpandedItems()
                        .map(function(item) {
                            return getDataLayerId(item);
                        });

                    var uploadPayload = { component: {} };
                    uploadPayload.component[accordionId] = { shownItems: expandedItems };

                    var removePayload = { component: {} };
                    removePayload.component[accordionId] = { shownItems: undefined };

                    dataLayer.push(removePayload);
                    dataLayer.push(uploadPayload);
                }
            }
        }

        /**
         * Sets an item's expanded state based on the provided flag and refreshes its internals.
         *
         * @private
         * @param {HTMLElement} item The item to mark as expanded, or not expanded
         * @param {Boolean} expanded true to mark the item expanded, false otherwise
         */
        function setItemExpanded(item, expanded) {
            if (expanded) {
                item.setAttribute(dataAttributes.item.expanded, "");
                if (dataLayerEnabled) {
                    dataLayer.push({
                        event: "cmp:show",
                        eventInfo: {
                            path: "component." + getDataLayerId(item)
                        }
                    });
                }

            } else {
                item.removeAttribute(dataAttributes.item.expanded);
                if (dataLayerEnabled) {
                    dataLayer.push({
                        event: "cmp:hide",
                        eventInfo: {
                            path: "component." + getDataLayerId(item)
                        }
                    });
                }
            }
            refreshItem(item);
        }

        /**
         * Gets an item's expanded state.
         *
         * @private
         * @param {HTMLElement} item The item for checking its expanded state
         * @returns {Boolean} true if the item is expanded, false otherwise
         */
        function getItemExpanded(item) {
            return item && item.dataset && item.dataset["cmpExpanded"] !== undefined;
        }

        /**
         * Refreshes an item based on its expanded state.
         *
         * @private
         * @param {HTMLElement} item The item to refresh
         */
        function refreshItem(item) {
            var expanded = getItemExpanded(item);
            if (expanded) {
                expandItem(item);
            } else {
                collapseItem(item);
            }
        }

        /**
         * Refreshes all items based on their expanded state.
         *
         * @private
         */
        function refreshItems() {
            for (var i = 0; i < that._elements["item"].length; i++) {
                refreshItem(that._elements["item"][i]);
            }
        }

        /**
         * Returns all expanded items.
         *
         * @private
         * @returns {HTMLElement[]} The expanded items
         */
        function getExpandedItems() {
            var expandedItems = [];

            for (var i = 0; i < that._elements["item"].length; i++) {
                var item = that._elements["item"][i];
                var expanded = getItemExpanded(item);
                if (expanded) {
                    expandedItems.push(item);
                }
            }

            return expandedItems;
        }

        /**
         * Annotates the item and its internals with
         * the necessary style and accessibility attributes to indicate it is expanded.
         *
         * @private
         * @param {HTMLElement} item The item to annotate as expanded
         */
        function expandItem(item) {
            var index = that._elements["item"].indexOf(item);
            if (index > -1) {
                var button = that._elements["button"][index];
                var panel = that._elements["panel"][index];
                button.classList.add(cssClasses.button.expanded);
                // used to fix some known screen readers issues in reading the correct state of the 'aria-expanded' attribute
                // e.g. https://bugs.webkit.org/show_bug.cgi?id=210934
                setTimeout(function() {
                    button.setAttribute("aria-expanded", true);
                }, delay);
                panel.classList.add(cssClasses.panel.expanded);
                panel.classList.remove(cssClasses.panel.hidden);
                panel.setAttribute("aria-hidden", false);
            }
        }

        /**
         * Annotates the item and its internals with
         * the necessary style and accessibility attributes to indicate it is not expanded.
         *
         * @private
         * @param {HTMLElement} item The item to annotate as not expanded
         */
        function collapseItem(item) {
            var index = that._elements["item"].indexOf(item);
            if (index > -1) {
                var button = that._elements["button"][index];
                var panel = that._elements["panel"][index];
                button.classList.remove(cssClasses.button.expanded);
                // used to fix some known screen readers issues in reading the correct state of the 'aria-expanded' attribute
                // e.g. https://bugs.webkit.org/show_bug.cgi?id=210934
                setTimeout(function() {
                    button.setAttribute("aria-expanded", false);
                }, delay);
                panel.classList.add(cssClasses.panel.hidden);
                panel.classList.remove(cssClasses.panel.expanded);
                panel.setAttribute("aria-hidden", true);
            }
        }

        /**
         * Focuses the button at the provided index.
         *
         * @private
         * @param {Number} index The index of the button to focus
         */
        function focusButton(index) {
            var button = that._elements["button"][index];
            button.focus();
        }
    }

    /**
     * Scrolls the browser when the URI fragment is changed to the item of the container Accordion component that corresponds to the deep link in the URL fragment,
       and displays its content.
     */
    function onHashChange() {
        if (location.hash && location.hash !== "#") {
            var anchorLocation = decodeURIComponent(location.hash);
            var anchorElement = document.querySelector(anchorLocation);
            if (anchorElement && anchorElement.classList.contains("cmp-accordion__item") && !anchorElement.hasAttribute("data-cmp-expanded")) {
                var anchorElementButton = document.querySelector(anchorLocation + "-button");
                if (anchorElementButton) {
                    anchorElementButton.click();
                }
            }
        }
    }

    /**
     * Reads options data from the Accordion wrapper element, defined via {@code data-cmp-*} data attributes.
     *
     * @private
     * @param {HTMLElement} element The Accordion element to read options data from
     * @returns {Object} The options read from the component data attributes
     */
    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    /**
     * Parses the dataLayer string and returns the ID
     *
     * @private
     * @param {HTMLElement} item the accordion item
     * @returns {String} dataLayerId or undefined
     */
    function getDataLayerId(item) {
        if (item) {
            if (item.dataset.cmpDataLayer) {
                return Object.keys(JSON.parse(item.dataset.cmpDataLayer))[0];
            } else {
                return item.id;
            }
        }
        return null;
    }

    /**
     * Document ready handler and DOM mutation observers. Initializes Accordion components as necessary.
     *
     * @private
     */
    function onDocumentReady() {
        dataLayerEnabled = document.body.hasAttribute("data-cmp-data-layer-enabled");
        dataLayer = (dataLayerEnabled) ? window.adobeDataLayer = window.adobeDataLayer || [] : undefined;

        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new Accordion({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body = document.querySelector("body");
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new Accordion({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

    if (containerUtils) {
        window.addEventListener("load", containerUtils.scrollToAnchor, false);
    }
    window.addEventListener("hashchange", onHashChange, false);

}());

/*******************************************************************************
 * Copyright 2018 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/

/**
 * Element.matches()
 * https://developer.mozilla.org/enUS/docs/Web/API/Element/matches#Polyfill
 */
if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

// eslint-disable-next-line valid-jsdoc
/**
 * Element.closest()
 * https://developer.mozilla.org/enUS/docs/Web/API/Element/closest#Polyfill
 */
if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        "use strict";
        var el = this;
        if (!document.documentElement.contains(el)) {
            return null;
        }
        do {
            if (el.matches(s)) {
                return el;
            }
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}

/*******************************************************************************
 * Copyright 2018 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
/* global
    CQ
 */
(function() {
    "use strict";

    var containerUtils = window.CQ && window.CQ.CoreComponents && window.CQ.CoreComponents.container && window.CQ.CoreComponents.container.utils ? window.CQ.CoreComponents.container.utils : undefined;
    if (!containerUtils) {
        // eslint-disable-next-line no-console
        console.warn("Tabs: container utilities at window.CQ.CoreComponents.container.utils are not available. This can lead to missing features. Ensure the core.wcm.components.commons.site.container client library is included on the page.");
    }
    var dataLayerEnabled;
    var dataLayer;

    var NS = "cmp";
    var IS = "tabs";

    var keyCodes = {
        END: 35,
        HOME: 36,
        ARROW_LEFT: 37,
        ARROW_UP: 38,
        ARROW_RIGHT: 39,
        ARROW_DOWN: 40
    };

    var selectors = {
        self: "[data-" + NS + '-is="' + IS + '"]',
        active: {
            tab: "cmp-tabs__tab--active",
            tabpanel: "cmp-tabs__tabpanel--active"
        }
    };

    /**
     * Tabs Configuration
     *
     * @typedef {Object} TabsConfig Represents a Tabs configuration
     * @property {HTMLElement} element The HTMLElement representing the Tabs
     * @property {Object} options The Tabs options
     */

    /**
     * Tabs
     *
     * @class Tabs
     * @classdesc An interactive Tabs component for navigating a list of tabs
     * @param {TabsConfig} config The Tabs configuration
     */
    function Tabs(config) {
        var that = this;

        if (config && config.element) {
            init(config);
        }

        /**
         * Initializes the Tabs
         *
         * @private
         * @param {TabsConfig} config The Tabs configuration
         */
        function init(config) {
            that._config = config;

            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");

            cacheElements(config.element);
            that._active = getActiveIndex(that._elements["tab"]);

            if (that._elements.tabpanel) {
                refreshActive();
                bindEvents();
            }

            // Show the tab based on deep-link-id if it matches with any existing tab item id
            if (containerUtils) {
                var deepLinkItemIdx = containerUtils.getDeepLinkItemIdx(that, "tab");
                if (deepLinkItemIdx && deepLinkItemIdx !== -1) {
                    var deepLinkItem = that._elements["tab"][deepLinkItemIdx];
                    if (deepLinkItem && that._elements["tab"][that._active].id !== deepLinkItem.id) {
                        navigateAndFocusTab(deepLinkItemIdx);
                    }
                }
            }

            if (window.Granite && window.Granite.author && window.Granite.author.MessageChannel) {
                /*
                 * Editor message handling:
                 * - subscribe to "cmp.panelcontainer" message requests sent by the editor frame
                 * - check that the message data panel container type is correct and that the id (path) matches this specific Tabs component
                 * - if so, route the "navigate" operation to enact a navigation of the Tabs based on index data
                 */
                CQ.CoreComponents.MESSAGE_CHANNEL = CQ.CoreComponents.MESSAGE_CHANNEL || new window.Granite.author.MessageChannel("cqauthor", window);
                CQ.CoreComponents.MESSAGE_CHANNEL.subscribeRequestMessage("cmp.panelcontainer", function(message) {
                    if (message.data && message.data.type === "cmp-tabs" && message.data.id === that._elements.self.dataset["cmpPanelcontainerId"]) {
                        if (message.data.operation === "navigate") {
                            navigate(message.data.index);
                        }
                    }
                });
            }
        }

        /**
         * Returns the index of the active tab, if no tab is active returns 0
         *
         * @param {Array} tabs Tab elements
         * @returns {Number} Index of the active tab, 0 if none is active
         */
        function getActiveIndex(tabs) {
            if (tabs) {
                for (var i = 0; i < tabs.length; i++) {
                    if (tabs[i].classList.contains(selectors.active.tab)) {
                        return i;
                    }
                }
            }
            return 0;
        }

        /**
         * Caches the Tabs elements as defined via the {@code data-tabs-hook="ELEMENT_NAME"} markup API
         *
         * @private
         * @param {HTMLElement} wrapper The Tabs wrapper element
         */
        function cacheElements(wrapper) {
            that._elements = {};
            that._elements.self = wrapper;
            var hooks = that._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS + "]");

            for (var i = 0; i < hooks.length; i++) {
                var hook = hooks[i];
                if (hook.closest("." + NS + "-" + IS) === that._elements.self) { // only process own tab elements
                    var capitalized = IS;
                    capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
                    var key = hook.dataset[NS + "Hook" + capitalized];
                    if (that._elements[key]) {
                        if (!Array.isArray(that._elements[key])) {
                            var tmp = that._elements[key];
                            that._elements[key] = [tmp];
                        }
                        that._elements[key].push(hook);
                    } else {
                        that._elements[key] = hook;
                    }
                }
            }
        }

        /**
         * Binds Tabs event handling
         *
         * @private
         */
        function bindEvents() {
            var tabs = that._elements["tab"];
            if (tabs) {
                for (var i = 0; i < tabs.length; i++) {
                    (function(index) {
                        tabs[i].addEventListener("click", function(event) {
                            navigateAndFocusTab(index);
                        });
                        tabs[i].addEventListener("keydown", function(event) {
                            onKeyDown(event);
                        });
                    })(i);
                }
            }
        }

        /**
         * Handles tab keydown events
         *
         * @private
         * @param {Object} event The keydown event
         */
        function onKeyDown(event) {
            var index = that._active;
            var lastIndex = that._elements["tab"].length - 1;

            switch (event.keyCode) {
                case keyCodes.ARROW_LEFT:
                case keyCodes.ARROW_UP:
                    event.preventDefault();
                    if (index > 0) {
                        navigateAndFocusTab(index - 1);
                    }
                    break;
                case keyCodes.ARROW_RIGHT:
                case keyCodes.ARROW_DOWN:
                    event.preventDefault();
                    if (index < lastIndex) {
                        navigateAndFocusTab(index + 1);
                    }
                    break;
                case keyCodes.HOME:
                    event.preventDefault();
                    navigateAndFocusTab(0);
                    break;
                case keyCodes.END:
                    event.preventDefault();
                    navigateAndFocusTab(lastIndex);
                    break;
                default:
                    return;
            }
        }

        /**
         * Refreshes the tab markup based on the current {@code Tabs#_active} index
         *
         * @private
         */
        function refreshActive() {
            var tabpanels = that._elements["tabpanel"];
            var tabs = that._elements["tab"];

            if (tabpanels) {
                if (Array.isArray(tabpanels)) {
                    for (var i = 0; i < tabpanels.length; i++) {
                        if (i === parseInt(that._active)) {
                            tabpanels[i].classList.add(selectors.active.tabpanel);
                            tabpanels[i].removeAttribute("aria-hidden");
                            tabs[i].classList.add(selectors.active.tab);
                            tabs[i].setAttribute("aria-selected", true);
                            tabs[i].setAttribute("tabindex", "0");
                        } else {
                            tabpanels[i].classList.remove(selectors.active.tabpanel);
                            tabpanels[i].setAttribute("aria-hidden", true);
                            tabs[i].classList.remove(selectors.active.tab);
                            tabs[i].setAttribute("aria-selected", false);
                            tabs[i].setAttribute("tabindex", "-1");
                        }
                    }
                } else {
                    // only one tab
                    tabpanels.classList.add(selectors.active.tabpanel);
                    tabs.classList.add(selectors.active.tab);
                }
            }
        }

        /**
         * Focuses the element and prevents scrolling the element into view
         *
         * @param {HTMLElement} element Element to focus
         */
        function focusWithoutScroll(element) {
            var x = window.scrollX || window.pageXOffset;
            var y = window.scrollY || window.pageYOffset;
            element.focus();
            window.scrollTo(x, y);
        }

        /**
         * Navigates to the tab at the provided index
         *
         * @private
         * @param {Number} index The index of the tab to navigate to
         */
        function navigate(index) {
            that._active = index;
            refreshActive();
        }

        /**
         * Navigates to the item at the provided index and ensures the active tab gains focus
         *
         * @private
         * @param {Number} index The index of the item to navigate to
         */
        function navigateAndFocusTab(index) {
            var exActive = that._active;
            navigate(index);
            focusWithoutScroll(that._elements["tab"][index]);

            if (dataLayerEnabled) {

                var activeItem = getDataLayerId(that._elements.tabpanel[index]);
                var exActiveItem = getDataLayerId(that._elements.tabpanel[exActive]);

                dataLayer.push({
                    event: "cmp:show",
                    eventInfo: {
                        path: "component." + activeItem
                    }
                });

                dataLayer.push({
                    event: "cmp:hide",
                    eventInfo: {
                        path: "component." + exActiveItem
                    }
                });

                var tabsId = that._elements.self.id;
                var uploadPayload = { component: {} };
                uploadPayload.component[tabsId] = { shownItems: [activeItem] };

                var removePayload = { component: {} };
                removePayload.component[tabsId] = { shownItems: undefined };

                dataLayer.push(removePayload);
                dataLayer.push(uploadPayload);
            }
        }
    }

    /**
     * Scrolls the browser when the URI fragment is changed to the item of the container Tab component that corresponds to the deep link in the URI fragment,
       and displays its content.
     */
    function onHashChange() {
        if (location.hash && location.hash !== "#") {
            var anchorLocation = decodeURIComponent(location.hash);
            var anchorElement = document.querySelector(anchorLocation);
            if (anchorElement && anchorElement.classList.contains("cmp-tabs__tab") && !anchorElement.classList.contains("cmp-tabs__tab--active")) {
                anchorElement.click();
            }
        }
    }

    /**
     * Reads options data from the Tabs wrapper element, defined via {@code data-cmp-*} data attributes
     *
     * @private
     * @param {HTMLElement} element The Tabs element to read options data from
     * @returns {Object} The options read from the component data attributes
     */
    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    /**
     * Parses the dataLayer string and returns the ID
     *
     * @private
     * @param {HTMLElement} item the accordion item
     * @returns {String} dataLayerId or undefined
     */
    function getDataLayerId(item) {
        if (item) {
            if (item.dataset.cmpDataLayer) {
                return Object.keys(JSON.parse(item.dataset.cmpDataLayer))[0];
            } else {
                return item.id;
            }
        }
        return null;
    }

    /**
     * Document ready handler and DOM mutation observers. Initializes Tabs components as necessary.
     *
     * @private
     */
    function onDocumentReady() {
        dataLayerEnabled = document.body.hasAttribute("data-cmp-data-layer-enabled");
        dataLayer = (dataLayerEnabled) ? window.adobeDataLayer = window.adobeDataLayer || [] : undefined;

        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new Tabs({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body = document.querySelector("body");
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new Tabs({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

    if (containerUtils) {
        window.addEventListener("load", containerUtils.scrollToAnchor, false);
    }
    window.addEventListener("hashchange", onHashChange, false);

}());

/*******************************************************************************
 * Copyright 2018 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var dataLayerEnabled;
    var dataLayer;

    var NS = "cmp";
    var IS = "carousel";

    var keyCodes = {
        SPACE: 32,
        END: 35,
        HOME: 36,
        ARROW_LEFT: 37,
        ARROW_UP: 38,
        ARROW_RIGHT: 39,
        ARROW_DOWN: 40
    };

    var selectors = {
        self: "[data-" + NS + '-is="' + IS + '"]'
    };

    var properties = {
        /**
         * Determines whether the Carousel will automatically transition between slides
         *
         * @memberof Carousel
         * @type {Boolean}
         * @default false
         */
        "autoplay": {
            "default": false,
            "transform": function(value) {
                return !(value === null || typeof value === "undefined");
            }
        },
        /**
         * Duration (in milliseconds) before automatically transitioning to the next slide
         *
         * @memberof Carousel
         * @type {Number}
         * @default 5000
         */
        "delay": {
            "default": 5000,
            "transform": function(value) {
                value = parseFloat(value);
                return !isNaN(value) ? value : null;
            }
        },
        /**
         * Determines whether automatic pause on hovering the carousel is disabled
         *
         * @memberof Carousel
         * @type {Boolean}
         * @default false
         */
        "autopauseDisabled": {
            "default": false,
            "transform": function(value) {
                return !(value === null || typeof value === "undefined");
            }
        }
    };

    /**
     * Carousel Configuration
     *
     * @typedef {Object} CarouselConfig Represents a Carousel configuration
     * @property {HTMLElement} element The HTMLElement representing the Carousel
     * @property {Object} options The Carousel options
     */

    /**
     * Carousel
     *
     * @class Carousel
     * @classdesc An interactive Carousel component for navigating a list of generic items
     * @param {CarouselConfig} config The Carousel configuration
     */
    function Carousel(config) {
        var that = this;

        if (config && config.element) {
            init(config);
        }

        /**
         * Initializes the Carousel
         *
         * @private
         * @param {CarouselConfig} config The Carousel configuration
         */
        function init(config) {
            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");

            setupProperties(config.options);
            cacheElements(config.element);

            that._active = 0;
            that._paused = false;

            if (that._elements.item) {
                refreshActive();
                bindEvents();
                resetAutoplayInterval();
                refreshPlayPauseActions();
            }

            // TODO: This section is only relevant in edit mode and should move to the editor clientLib
            if (window.Granite && window.Granite.author && window.Granite.author.MessageChannel) {
                /*
                 * Editor message handling:
                 * - subscribe to "cmp.panelcontainer" message requests sent by the editor frame
                 * - check that the message data panel container type is correct and that the id (path) matches this specific Carousel component
                 * - if so, route the "navigate" operation to enact a navigation of the Carousel based on index data
                 */
                window.CQ = window.CQ || {};
                window.CQ.CoreComponents = window.CQ.CoreComponents || {};
                window.CQ.CoreComponents.MESSAGE_CHANNEL = window.CQ.CoreComponents.MESSAGE_CHANNEL || new window.Granite.author.MessageChannel("cqauthor", window);
                window.CQ.CoreComponents.MESSAGE_CHANNEL.subscribeRequestMessage("cmp.panelcontainer", function(message) {
                    if (message.data && message.data.type === "cmp-carousel" && message.data.id === that._elements.self.dataset["cmpPanelcontainerId"]) {
                        if (message.data.operation === "navigate") {
                            navigate(message.data.index);
                        }
                    }
                });
            }
        }

        /**
         * Caches the Carousel elements as defined via the {@code data-carousel-hook="ELEMENT_NAME"} markup API
         *
         * @private
         * @param {HTMLElement} wrapper The Carousel wrapper element
         */
        function cacheElements(wrapper) {
            that._elements = {};
            that._elements.self = wrapper;
            var hooks = that._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS + "]");

            for (var i = 0; i < hooks.length; i++) {
                var hook = hooks[i];
                var capitalized = IS;
                capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
                var key = hook.dataset[NS + "Hook" + capitalized];
                if (that._elements[key]) {
                    if (!Array.isArray(that._elements[key])) {
                        var tmp = that._elements[key];
                        that._elements[key] = [tmp];
                    }
                    that._elements[key].push(hook);
                } else {
                    that._elements[key] = hook;
                }
            }
        }

        /**
         * Sets up properties for the Carousel based on the passed options.
         *
         * @private
         * @param {Object} options The Carousel options
         */
        function setupProperties(options) {
            that._properties = {};

            for (var key in properties) {
                if (Object.prototype.hasOwnProperty.call(properties, key)) {
                    var property = properties[key];
                    var value = null;

                    if (options && options[key] != null) {
                        value = options[key];

                        // transform the provided option
                        if (property && typeof property.transform === "function") {
                            value = property.transform(value);
                        }
                    }

                    if (value === null) {
                        // value still null, take the property default
                        value = properties[key]["default"];
                    }

                    that._properties[key] = value;
                }
            }
        }

        /**
         * Binds Carousel event handling
         *
         * @private
         */
        function bindEvents() {
            if (that._elements["previous"]) {
                that._elements["previous"].addEventListener("click", function() {
                    var index = getPreviousIndex();
                    navigate(index);
                    if (dataLayerEnabled) {
                        dataLayer.push({
                            event: "cmp:show",
                            eventInfo: {
                                path: "component." + getDataLayerId(that._elements.item[index])
                            }
                        });
                    }
                });
            }

            if (that._elements["next"]) {
                that._elements["next"].addEventListener("click", function() {
                    var index = getNextIndex();
                    navigate(index);
                    if (dataLayerEnabled) {
                        dataLayer.push({
                            event: "cmp:show",
                            eventInfo: {
                                path: "component." + getDataLayerId(that._elements.item[index])
                            }
                        });
                    }
                });
            }

            var indicators = that._elements["indicator"];
            if (indicators) {
                for (var i = 0; i < indicators.length; i++) {
                    (function(index) {
                        indicators[i].addEventListener("click", function(event) {
                            navigateAndFocusIndicator(index);
                        });
                    })(i);
                }
            }

            if (that._elements["pause"]) {
                if (that._properties.autoplay) {
                    that._elements["pause"].addEventListener("click", onPauseClick);
                }
            }

            if (that._elements["play"]) {
                if (that._properties.autoplay) {
                    that._elements["play"].addEventListener("click", onPlayClick);
                }
            }

            that._elements.self.addEventListener("keydown", onKeyDown);

            if (!that._properties.autopauseDisabled) {
                that._elements.self.addEventListener("mouseenter", onMouseEnter);
                that._elements.self.addEventListener("mouseleave", onMouseLeave);
            }

            // for accessibility we pause animation when a element get focused
            var items = that._elements["item"];
            if (items) {
                for (var j = 0; j < items.length; j++) {
                    items[j].addEventListener("focusin", onMouseEnter);
                    items[j].addEventListener("focusout", onMouseLeave);
                }
            }
        }

        /**
         * Handles carousel keydown events
         *
         * @private
         * @param {Object} event The keydown event
         */
        function onKeyDown(event) {
            var index = that._active;
            var lastIndex = that._elements["indicator"].length - 1;

            switch (event.keyCode) {
                case keyCodes.ARROW_LEFT:
                case keyCodes.ARROW_UP:
                    event.preventDefault();
                    if (index > 0) {
                        navigateAndFocusIndicator(index - 1);
                    }
                    break;
                case keyCodes.ARROW_RIGHT:
                case keyCodes.ARROW_DOWN:
                    event.preventDefault();
                    if (index < lastIndex) {
                        navigateAndFocusIndicator(index + 1);
                    }
                    break;
                case keyCodes.HOME:
                    event.preventDefault();
                    navigateAndFocusIndicator(0);
                    break;
                case keyCodes.END:
                    event.preventDefault();
                    navigateAndFocusIndicator(lastIndex);
                    break;
                case keyCodes.SPACE:
                    if (that._properties.autoplay && (event.target !== that._elements["previous"] && event.target !== that._elements["next"])) {
                        event.preventDefault();
                        if (!that._paused) {
                            pause();
                        } else {
                            play();
                        }
                    }
                    if (event.target === that._elements["pause"]) {
                        that._elements["play"].focus();
                    }
                    if (event.target === that._elements["play"]) {
                        that._elements["pause"].focus();
                    }
                    break;
                default:
                    return;
            }
        }

        /**
         * Handles carousel mouseenter events
         *
         * @private
         * @param {Object} event The mouseenter event
         */
        function onMouseEnter(event) {
            clearAutoplayInterval();
        }

        /**
         * Handles carousel mouseleave events
         *
         * @private
         * @param {Object} event The mouseleave event
         */
        function onMouseLeave(event) {
            resetAutoplayInterval();
        }

        /**
         * Handles pause element click events
         *
         * @private
         * @param {Object} event The click event
         */
        function onPauseClick(event) {
            pause();
            that._elements["play"].focus();
        }

        /**
         * Handles play element click events
         *
         * @private
         * @param {Object} event The click event
         */
        function onPlayClick() {
            play();
            that._elements["pause"].focus();
        }

        /**
         * Pauses the playing of the Carousel. Sets {@code Carousel#_paused} marker.
         * Only relevant when autoplay is enabled
         *
         * @private
         */
        function pause() {
            that._paused = true;
            clearAutoplayInterval();
            refreshPlayPauseActions();
        }

        /**
         * Enables the playing of the Carousel. Sets {@code Carousel#_paused} marker.
         * Only relevant when autoplay is enabled
         *
         * @private
         */
        function play() {
            that._paused = false;

            // If the Carousel is hovered, don't begin auto transitioning until the next mouse leave event
            var hovered = false;
            if (that._elements.self.parentElement) {
                hovered = that._elements.self.parentElement.querySelector(":hover") === that._elements.self;
            }
            if (that._properties.autopauseDisabled || !hovered) {
                resetAutoplayInterval();
            }

            refreshPlayPauseActions();
        }

        /**
         * Refreshes the play/pause action markup based on the {@code Carousel#_paused} state
         *
         * @private
         */
        function refreshPlayPauseActions() {
            setActionDisabled(that._elements["pause"], that._paused);
            setActionDisabled(that._elements["play"], !that._paused);
        }

        /**
         * Refreshes the item markup based on the current {@code Carousel#_active} index
         *
         * @private
         */
        function refreshActive() {
            var items = that._elements["item"];
            var indicators = that._elements["indicator"];

            if (items) {
                if (Array.isArray(items)) {
                    for (var i = 0; i < items.length; i++) {
                        if (i === parseInt(that._active)) {
                            items[i].classList.add("cmp-carousel__item--active");
                            items[i].removeAttribute("aria-hidden");
                            indicators[i].classList.add("cmp-carousel__indicator--active");
                            indicators[i].setAttribute("aria-selected", true);
                            indicators[i].setAttribute("tabindex", "0");
                        } else {
                            items[i].classList.remove("cmp-carousel__item--active");
                            items[i].setAttribute("aria-hidden", true);
                            indicators[i].classList.remove("cmp-carousel__indicator--active");
                            indicators[i].setAttribute("aria-selected", false);
                            indicators[i].setAttribute("tabindex", "-1");
                        }
                    }
                } else {
                    // only one item
                    items.classList.add("cmp-carousel__item--active");
                    indicators.classList.add("cmp-carousel__indicator--active");
                }
            }
        }

        /**
         * Focuses the element and prevents scrolling the element into view
         *
         * @param {HTMLElement} element Element to focus
         */
        function focusWithoutScroll(element) {
            var x = window.scrollX || window.pageXOffset;
            var y = window.scrollY || window.pageYOffset;
            element.focus();
            window.scrollTo(x, y);
        }

        /**
         * Retrieves the next active index, with looping
         *
         * @private
         * @returns {Number} Index of the next carousel item
         */
        function getNextIndex() {
            return that._active === (that._elements["item"].length - 1) ? 0 : that._active + 1;
        }

        /**
         * Retrieves the previous active index, with looping
         *
         * @private
         * @returns {Number} Index of the previous carousel item
         */
        function getPreviousIndex() {
            return that._active === 0 ? (that._elements["item"].length - 1) : that._active - 1;
        }

        /**
         * Navigates to the item at the provided index
         *
         * @private
         * @param {Number} index The index of the item to navigate to
         */
        function navigate(index) {
            if (index < 0 || index > (that._elements["item"].length - 1)) {
                return;
            }

            that._active = index;
            refreshActive();

            if (dataLayerEnabled) {
                var carouselId = that._elements.self.id;
                var activeItem = getDataLayerId(that._elements.item[index]);
                var updatePayload = { component: {} };
                updatePayload.component[carouselId] = { shownItems: [activeItem] };

                var removePayload = { component: {} };
                removePayload.component[carouselId] = { shownItems: undefined };

                dataLayer.push(removePayload);
                dataLayer.push(updatePayload);
            }

            // reset the autoplay transition interval following navigation, if not already hovering the carousel
            if (that._elements.self.parentElement) {
                if (that._elements.self.parentElement.querySelector(":hover") !== that._elements.self) {
                    resetAutoplayInterval();
                }
            }
        }

        /**
         * Navigates to the item at the provided index and ensures the active indicator gains focus
         *
         * @private
         * @param {Number} index The index of the item to navigate to
         */
        function navigateAndFocusIndicator(index) {
            navigate(index);
            focusWithoutScroll(that._elements["indicator"][index]);

            if (dataLayerEnabled) {
                dataLayer.push({
                    event: "cmp:show",
                    eventInfo: {
                        path: "component." + getDataLayerId(that._elements.item[index])
                    }
                });
            }
        }

        /**
         * Starts/resets automatic slide transition interval
         *
         * @private
         */
        function resetAutoplayInterval() {
            if (that._paused || !that._properties.autoplay) {
                return;
            }
            clearAutoplayInterval();
            that._autoplayIntervalId = window.setInterval(function() {
                if (document.visibilityState && document.hidden) {
                    return;
                }
                var indicators = that._elements["indicators"];
                if (indicators !== document.activeElement && indicators.contains(document.activeElement)) {
                    // if an indicator has focus, ensure we switch focus following navigation
                    navigateAndFocusIndicator(getNextIndex());
                } else {
                    navigate(getNextIndex());
                }
            }, that._properties.delay);
        }

        /**
         * Clears/pauses automatic slide transition interval
         *
         * @private
         */
        function clearAutoplayInterval() {
            window.clearInterval(that._autoplayIntervalId);
            that._autoplayIntervalId = null;
        }

        /**
         * Sets the disabled state for an action and toggles the appropriate CSS classes
         *
         * @private
         * @param {HTMLElement} action Action to disable
         * @param {Boolean} [disable] {@code true} to disable, {@code false} to enable
         */
        function setActionDisabled(action, disable) {
            if (!action) {
                return;
            }
            if (disable !== false) {
                action.disabled = true;
                action.classList.add("cmp-carousel__action--disabled");
            } else {
                action.disabled = false;
                action.classList.remove("cmp-carousel__action--disabled");
            }
        }
    }

    /**
     * Reads options data from the Carousel wrapper element, defined via {@code data-cmp-*} data attributes
     *
     * @private
     * @param {HTMLElement} element The Carousel element to read options data from
     * @returns {Object} The options read from the component data attributes
     */
    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    /**
     * Parses the dataLayer string and returns the ID
     *
     * @private
     * @param {HTMLElement} item the accordion item
     * @returns {String} dataLayerId or undefined
     */
    function getDataLayerId(item) {
        if (item) {
            if (item.dataset.cmpDataLayer) {
                return Object.keys(JSON.parse(item.dataset.cmpDataLayer))[0];
            } else {
                return item.id;
            }
        }
        return null;
    }

    /**
     * Document ready handler and DOM mutation observers. Initializes Carousel components as necessary.
     *
     * @private
     */
    function onDocumentReady() {
        dataLayerEnabled = document.body.hasAttribute("data-cmp-data-layer-enabled");
        dataLayer = (dataLayerEnabled) ? window.adobeDataLayer = window.adobeDataLayer || [] : undefined;

        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new Carousel({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body = document.querySelector("body");
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new Carousel({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

}());

/*******************************************************************************
 * Copyright 2017 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
if (window.Element && !Element.prototype.closest) {
    // eslint valid-jsdoc: "off"
    Element.prototype.closest =
        function(s) {
            "use strict";
            var matches = (this.document || this.ownerDocument).querySelectorAll(s);
            var el      = this;
            var i;
            do {
                i = matches.length;
                while (--i >= 0 && matches.item(i) !== el) {
                    // continue
                }
            } while ((i < 0) && (el = el.parentElement));
            return el;
        };
}

if (window.Element && !Element.prototype.matches) {
    Element.prototype.matches =
        Element.prototype.matchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.oMatchesSelector ||
        Element.prototype.webkitMatchesSelector ||
        function(s) {
            "use strict";
            var matches = (this.document || this.ownerDocument).querySelectorAll(s);
            var i       = matches.length;
            while (--i >= 0 && matches.item(i) !== this) {
                // continue
            }
            return i > -1;
        };
}

if (!Object.assign) {
    Object.assign = function(target, varArgs) { // .length of function is 2
        "use strict";
        if (target === null) {
            throw new TypeError("Cannot convert undefined or null to object");
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];

            if (nextSource !== null) {
                for (var nextKey in nextSource) {
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

(function(arr) {
    "use strict";
    arr.forEach(function(item) {
        if (Object.prototype.hasOwnProperty.call(item, "remove")) {
            return;
        }
        Object.defineProperty(item, "remove", {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function remove() {
                this.parentNode.removeChild(this);
            }
        });
    });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

/*******************************************************************************
 * Copyright 2016 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var NS = "cmp";
    var IS = "image";

    var EMPTY_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    var LAZY_THRESHOLD_DEFAULT = 0;
    var SRC_URI_TEMPLATE_WIDTH_VAR = "{.width}";

    var selectors = {
        self: "[data-" + NS + '-is="' + IS + '"]',
        image: '[data-cmp-hook-image="image"]',
        map: '[data-cmp-hook-image="map"]',
        area: '[data-cmp-hook-image="area"]'
    };

    var lazyLoader = {
        "cssClass": "cmp-image__image--is-loading",
        "style": {
            "height": 0,
            "padding-bottom": "" // will be replaced with % ratio
        }
    };

    var properties = {
        /**
         * An array of alternative image widths (in pixels).
         * Used to replace a {.width} variable in the src property with an optimal width if a URI template is provided.
         *
         * @memberof Image
         * @type {Number[]}
         * @default []
         */
        "widths": {
            "default": [],
            "transform": function(value) {
                var widths = [];
                value.split(",").forEach(function(item) {
                    item = parseFloat(item);
                    if (!isNaN(item)) {
                        widths.push(item);
                    }
                });
                return widths;
            }
        },
        /**
         * Indicates whether the image should be rendered lazily.
         *
         * @memberof Image
         * @type {Boolean}
         * @default false
         */
        "lazy": {
            "default": false,
            "transform": function(value) {
                return !(value === null || typeof value === "undefined");
            }
        },
        /**
         * Indicates image is DynamicMedia image.
         *
         * @memberof Image
         * @type {Boolean}
         * @default false
         */
        "dmimage": {
            "default": false,
            "transform": function(value) {
                return !(value === null || typeof value === "undefined");
            }
        },
        /**
         * The lazy threshold.
         * This is the number of pixels, in advance of becoming visible, when an lazy-loading image should begin
         * to load.
         *
         * @memberof Image
         * @type {Number}
         * @default 0
         */
        "lazythreshold": {
            "default": 0,
            "transform": function(value) {
                var val =  parseInt(value);
                if (isNaN(val)) {
                    return LAZY_THRESHOLD_DEFAULT;
                }
                return val;
            }
        },
        /**
         * The image source.
         *
         * Can be a simple image source, or a URI template representation that
         * can be variable expanded - useful for building an image configuration with an alternative width.
         * e.g. '/path/image.coreimg{.width}.jpeg/1506620954214.jpeg'
         *
         * @memberof Image
         * @type {String}
         */
        "src": {
            "transform": function(value) {
                return decodeURIComponent(value);
            }
        }
    };

    var devicePixelRatio = window.devicePixelRatio || 1;

    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    function Image(config) {
        var that = this;

        var smartCrops = {};

        function init(config) {
            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");

            setupProperties(config.options);
            cacheElements(config.element);
            // check image is DM asset; if true try to make req=set
            if (config.options.src && Object.prototype.hasOwnProperty.call(config.options, "dmimage") && (config.options["smartcroprendition"] === "SmartCrop:Auto")) {
                var request = new XMLHttpRequest();
                var url = decodeURIComponent(config.options.src).split(SRC_URI_TEMPLATE_WIDTH_VAR)[0] + "?req=set,json";


                request.open("GET", url, false);
                request.onload = function() {
                    if (request.status >= 200 && request.status < 400) {
                        // success status
                        var responseText = request.responseText;
                        var rePayload = new RegExp(/^(?:\/\*jsonp\*\/)?\s*([^()]+)\(([\s\S]+),\s*"[0-9]*"\);?$/gmi);
                        var rePayloadJSON = new RegExp(/^{[\s\S]*}$/gmi);
                        var resPayload = rePayload.exec(responseText);
                        var payload;
                        if (resPayload) {
                            var payloadStr = resPayload[2];
                            if (rePayloadJSON.test(payloadStr)) {
                                payload = JSON.parse(payloadStr);
                            }

                        }
                        // check "relation" - only in case of smartcrop preset
                        if (payload && payload.set.relation && payload.set.relation.length > 0) {
                            for (var i = 0; i < payload.set.relation.length; i++) {
                                smartCrops[parseInt(payload.set.relation[i].userdata.SmartCropWidth)] =
                                    ":" + payload.set.relation[i].userdata.SmartCropDef;
                            }
                        }
                    } else {
                        // error status
                    }
                };
                request.send();
            }

            if (!that._elements.noscript) {
                return;
            }

            that._elements.container = that._elements.link ? that._elements.link : that._elements.self;

            unwrapNoScript();

            if (that._properties.lazy) {
                addLazyLoader();
            }

            if (that._elements.map) {
                that._elements.image.addEventListener("load", onLoad);
            }

            window.addEventListener("resize", onWindowResize);
            ["focus", "click", "load", "transitionend", "animationend", "scroll"].forEach(function(name) {
                document.addEventListener(name, that.update);
            });

            that._elements.image.addEventListener("cmp-image-redraw", that.update);
            that.update();
        }

        function loadImage() {
            var hasWidths = (that._properties.widths && that._properties.widths.length > 0) || Object.keys(smartCrops).length > 0;
            var replacement;
            if (Object.keys(smartCrops).length > 0) {
                var optimalWidth = getOptimalWidth(Object.keys(smartCrops));
                replacement = smartCrops[optimalWidth];
            } else {
                replacement = hasWidths ? (that._properties.dmimage ? "" : ".") + getOptimalWidth(that._properties.widths) : "";
            }
            var url = that._properties.src.replace(SRC_URI_TEMPLATE_WIDTH_VAR, replacement);
            var imgSrcAttribute = that._elements.image.getAttribute("src");

            if (url !== imgSrcAttribute) {
                if (imgSrcAttribute === null || imgSrcAttribute === EMPTY_PIXEL) {
                    that._elements.image.setAttribute("src", url);
                } else {
                    var urlTemplateParts = that._properties.src.split(SRC_URI_TEMPLATE_WIDTH_VAR);
                    // check if image src was dynamically swapped meanwhile (e.g. by Target)
                    var isImageRefSame = imgSrcAttribute.startsWith(urlTemplateParts[0]);
                    if (isImageRefSame && urlTemplateParts.length > 1) {
                        isImageRefSame = imgSrcAttribute.endsWith(urlTemplateParts[urlTemplateParts.length - 1]);
                    }
                    if (isImageRefSame) {
                        that._elements.image.setAttribute("src", url);
                        if (!hasWidths) {
                            window.removeEventListener("scroll", that.update);
                        }
                    }
                }
            }
            if (that._lazyLoaderShowing) {
                that._elements.image.addEventListener("load", removeLazyLoader);
            }
        }

        function getOptimalWidth(widths) {
            var container = that._elements.self;
            var containerWidth = container.clientWidth;
            while (containerWidth === 0 && container.parentNode) {
                container = container.parentNode;
                containerWidth = container.clientWidth;
            }
            var optimalWidth = containerWidth * devicePixelRatio;
            var len = widths.length;
            var key = 0;

            while ((key < len - 1) && (widths[key] < optimalWidth)) {
                key++;
            }

            return widths[key].toString();
        }

        function addLazyLoader() {
            var width = that._elements.image.getAttribute("width");
            var height = that._elements.image.getAttribute("height");

            if (width && height) {
                var ratio = (height / width) * 100;
                var styles = lazyLoader.style;

                styles["padding-bottom"] = ratio + "%";

                for (var s in styles) {
                    if (Object.prototype.hasOwnProperty.call(styles, s)) {
                        that._elements.image.style[s] = styles[s];
                    }
                }
            }
            that._elements.image.setAttribute("src", EMPTY_PIXEL);
            that._elements.image.classList.add(lazyLoader.cssClass);
            that._lazyLoaderShowing = true;
        }

        function unwrapNoScript() {
            var markup = decodeNoscript(that._elements.noscript.textContent.trim());
            var parser = new DOMParser();

            // temporary document avoids requesting the image before removing its src
            var temporaryDocument = parser.parseFromString(markup, "text/html");
            var imageElement = temporaryDocument.querySelector(selectors.image);
            imageElement.removeAttribute("src");
            that._elements.container.insertBefore(imageElement, that._elements.noscript);

            var mapElement = temporaryDocument.querySelector(selectors.map);
            if (mapElement) {
                that._elements.container.insertBefore(mapElement, that._elements.noscript);
            }

            that._elements.noscript.parentNode.removeChild(that._elements.noscript);
            if (that._elements.container.matches(selectors.image)) {
                that._elements.image = that._elements.container;
            } else {
                that._elements.image = that._elements.container.querySelector(selectors.image);
            }

            that._elements.map = that._elements.container.querySelector(selectors.map);
            that._elements.areas = that._elements.container.querySelectorAll(selectors.area);
        }

        function removeLazyLoader() {
            that._elements.image.classList.remove(lazyLoader.cssClass);
            for (var property in lazyLoader.style) {
                if (Object.prototype.hasOwnProperty.call(lazyLoader.style, property)) {
                    that._elements.image.style[property] = "";
                }
            }
            that._elements.image.removeEventListener("load", removeLazyLoader);
            that._lazyLoaderShowing = false;
        }

        function isLazyVisible() {
            if (that._elements.container.offsetParent === null) {
                return false;
            }

            var wt = window.pageYOffset;
            var wb = wt + document.documentElement.clientHeight;
            var et = that._elements.container.getBoundingClientRect().top + wt;
            var eb = et + that._elements.container.clientHeight;

            return eb >= wt - that._properties.lazythreshold && et <= wb + that._properties.lazythreshold;
        }

        function resizeAreas() {
            if (that._elements.areas && that._elements.areas.length > 0) {
                for (var i = 0; i < that._elements.areas.length; i++) {
                    var width = that._elements.image.width;
                    var height = that._elements.image.height;

                    if (width && height) {
                        var relcoords = that._elements.areas[i].dataset.cmpRelcoords;
                        if (relcoords) {
                            var relativeCoordinates = relcoords.split(",");
                            var coordinates = new Array(relativeCoordinates.length);

                            for (var j = 0; j < coordinates.length; j++) {
                                if (j % 2 === 0) {
                                    coordinates[j] = parseInt(relativeCoordinates[j] * width);
                                } else {
                                    coordinates[j] = parseInt(relativeCoordinates[j] * height);
                                }
                            }

                            that._elements.areas[i].coords = coordinates;
                        }
                    }
                }
            }
        }

        function cacheElements(wrapper) {
            that._elements = {};
            that._elements.self = wrapper;
            var hooks = that._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS + "]");

            for (var i = 0; i < hooks.length; i++) {
                var hook = hooks[i];
                var capitalized = IS;
                capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
                var key = hook.dataset[NS + "Hook" + capitalized];
                that._elements[key] = hook;
            }
        }

        function setupProperties(options) {
            that._properties = {};

            for (var key in properties) {
                if (Object.prototype.hasOwnProperty.call(properties, key)) {
                    var property = properties[key];
                    if (options && options[key] != null) {
                        if (property && typeof property.transform === "function") {
                            that._properties[key] = property.transform(options[key]);
                        } else {
                            that._properties[key] = options[key];
                        }
                    } else {
                        that._properties[key] = properties[key]["default"];
                    }
                }
            }
        }

        function onWindowResize() {
            that.update();
            resizeAreas();
        }

        function onLoad() {
            resizeAreas();
        }

        that.update = function() {
            if (that._properties.lazy) {
                if (isLazyVisible()) {
                    loadImage();
                }
            } else {
                loadImage();
            }
        };

        if (config && config.element) {
            init(config);
        }
    }

    function onDocumentReady() {
        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new Image({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body             = document.querySelector("body");
        var observer         = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new Image({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

    /*
        on drag & drop of the component into a parsys, noscript's content will be escaped multiple times by the editor which creates
        the DOM for editing; the HTML parser cannot be used here due to the multiple escaping
     */
    function decodeNoscript(text) {
        text = text.replace(/&(amp;)*lt;/g, "<");
        text = text.replace(/&(amp;)*gt;/g, ">");
        return text;
    }

})();

/*******************************************************************************
 * Copyright 2017 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var NS = "cmp";
    var IS = "search";

    var DELAY = 300; // time before fetching new results when the user is typing a search string
    var LOADING_DISPLAY_DELAY = 300; // minimum time during which the loading indicator is displayed
    var PARAM_RESULTS_OFFSET = "resultsOffset";

    var keyCodes = {
        TAB: 9,
        ENTER: 13,
        ESCAPE: 27,
        ARROW_UP: 38,
        ARROW_DOWN: 40
    };

    var selectors = {
        self: "[data-" + NS + '-is="' + IS + '"]',
        item: {
            self: "[data-" + NS + "-hook-" + IS + '="item"]',
            title: "[data-" + NS + "-hook-" + IS + '="itemTitle"]',
            focused: "." + NS + "-search__item--is-focused"
        }
    };

    var properties = {
        /**
         * The minimum required length of the search term before results are fetched.
         *
         * @memberof Search
         * @type {Number}
         * @default 3
         */
        minLength: {
            "default": 3,
            transform: function(value) {
                value = parseFloat(value);
                return isNaN(value) ? null : value;
            }
        },
        /**
         * The maximal number of results fetched by a search request.
         *
         * @memberof Search
         * @type {Number}
         * @default 10
         */
        resultsSize: {
            "default": 10,
            transform: function(value) {
                value = parseFloat(value);
                return isNaN(value) ? null : value;
            }
        }
    };

    var idCount = 0;

    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    function toggleShow(element, show) {
        if (element) {
            if (show !== false) {
                element.style.display = "block";
                element.setAttribute("aria-hidden", false);
            } else {
                element.style.display = "none";
                element.setAttribute("aria-hidden", true);
            }
        }
    }

    function serialize(form) {
        var query = [];
        if (form && form.elements) {
            for (var i = 0; i < form.elements.length; i++) {
                var node = form.elements[i];
                if (!node.disabled && node.name) {
                    var param = [node.name, encodeURIComponent(node.value)];
                    query.push(param.join("="));
                }
            }
        }
        return query.join("&");
    }

    function mark(node, regex) {
        if (!node || !regex) {
            return;
        }

        // text nodes
        if (node.nodeType === 3) {
            var nodeValue = node.nodeValue;
            var match = regex.exec(nodeValue);

            if (nodeValue && match) {
                var element = document.createElement("mark");
                element.className = NS + "-search__item-mark";
                element.appendChild(document.createTextNode(match[0]));

                var after = node.splitText(match.index);
                after.nodeValue = after.nodeValue.substring(match[0].length);
                node.parentNode.insertBefore(element, after);
            }
        } else if (node.hasChildNodes()) {
            for (var i = 0; i < node.childNodes.length; i++) {
                // recurse
                mark(node.childNodes[i], regex);
            }
        }
    }

    function Search(config) {
        if (config.element) {
            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");
        }

        this._cacheElements(config.element);
        this._setupProperties(config.options);

        this._action = this._elements.form.getAttribute("action");
        this._resultsOffset = 0;
        this._hasMoreResults = true;

        this._elements.input.addEventListener("input", this._onInput.bind(this));
        this._elements.input.addEventListener("focus", this._onInput.bind(this));
        this._elements.input.addEventListener("keydown", this._onKeydown.bind(this));
        this._elements.clear.addEventListener("click", this._onClearClick.bind(this));
        document.addEventListener("click", this._onDocumentClick.bind(this));
        this._elements.results.addEventListener("scroll", this._onScroll.bind(this));

        this._makeAccessible();
    }

    Search.prototype._displayResults = function() {
        if (this._elements.input.value.length === 0) {
            toggleShow(this._elements.clear, false);
            this._cancelResults();
        } else if (this._elements.input.value.length < this._properties.minLength) {
            toggleShow(this._elements.clear, true);
        } else {
            this._updateResults();
            toggleShow(this._elements.clear, true);
        }
    };

    Search.prototype._onScroll = function(event) {
        // fetch new results when the results to be scrolled down are less than the visible results
        if (this._elements.results.scrollTop + 2 * this._elements.results.clientHeight >= this._elements.results.scrollHeight) {
            this._resultsOffset += this._properties.resultsSize;
            this._displayResults();
        }
    };

    Search.prototype._onInput = function(event) {
        var self = this;
        self._cancelResults();
        // start searching when the search term reaches the minimum length
        this._timeout = setTimeout(function() {
            self._displayResults();
        }, DELAY);
    };

    Search.prototype._onKeydown = function(event) {
        var self = this;

        switch (event.keyCode) {
            case keyCodes.TAB:
                if (self._resultsOpen()) {
                    toggleShow(self._elements.results, false);
                    self._elements.input.setAttribute("aria-expanded", "false");
                }
                break;
            case keyCodes.ENTER:
                event.preventDefault();
                if (self._resultsOpen()) {
                    var focused = self._elements.results.querySelector(selectors.item.focused);
                    if (focused) {
                        focused.click();
                    }
                }
                break;
            case keyCodes.ESCAPE:
                self._cancelResults();
                break;
            case keyCodes.ARROW_UP:
                if (self._resultsOpen()) {
                    event.preventDefault();
                    self._stepResultFocus(true);
                }
                break;
            case keyCodes.ARROW_DOWN:
                if (self._resultsOpen()) {
                    event.preventDefault();
                    self._stepResultFocus();
                } else {
                    // test the input and if necessary fetch and display the results
                    self._onInput();
                }
                break;
            default:
                return;
        }
    };

    Search.prototype._onClearClick = function(event) {
        event.preventDefault();
        this._elements.input.value = "";
        toggleShow(this._elements.clear, false);
        toggleShow(this._elements.results, false);
        this._elements.input.setAttribute("aria-expanded", "false");
    };

    Search.prototype._onDocumentClick = function(event) {
        var inputContainsTarget =  this._elements.input.contains(event.target);
        var resultsContainTarget = this._elements.results.contains(event.target);

        if (!(inputContainsTarget || resultsContainTarget)) {
            toggleShow(this._elements.results, false);
            this._elements.input.setAttribute("aria-expanded", "false");
        }
    };

    Search.prototype._resultsOpen = function() {
        return this._elements.results.style.display !== "none";
    };

    Search.prototype._makeAccessible = function() {
        var id = NS + "-search-results-" + idCount;
        this._elements.input.setAttribute("aria-owns", id);
        this._elements.results.id = id;
        idCount++;
    };

    Search.prototype._generateItems = function(data, results) {
        var self = this;

        data.forEach(function(item) {
            var el = document.createElement("span");
            el.innerHTML = self._elements.itemTemplate.innerHTML;
            el.querySelectorAll(selectors.item.title)[0].appendChild(document.createTextNode(item.title));
            el.querySelectorAll(selectors.item.self)[0].setAttribute("href", item.url);
            results.innerHTML += el.innerHTML;
        });
    };

    Search.prototype._markResults = function() {
        var nodeList = this._elements.results.querySelectorAll(selectors.item.self);
        var escapedTerm = this._elements.input.value.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
        var regex = new RegExp("(" + escapedTerm + ")", "gi");

        for (var i = this._resultsOffset - 1; i < nodeList.length; ++i) {
            var result = nodeList[i];
            mark(result, regex);
        }
    };

    Search.prototype._stepResultFocus = function(reverse) {
        var results = this._elements.results.querySelectorAll(selectors.item.self);
        var focused = this._elements.results.querySelector(selectors.item.focused);
        var newFocused;
        var index = Array.prototype.indexOf.call(results, focused);
        var focusedCssClass = NS + "-search__item--is-focused";

        if (results.length > 0) {

            if (!reverse) {
                // highlight the next result
                if (index < 0) {
                    results[0].classList.add(focusedCssClass);
                    results[0].setAttribute("aria-selected", "true");
                } else if (index + 1 < results.length) {
                    results[index].classList.remove(focusedCssClass);
                    results[index].setAttribute("aria-selected", "false");
                    results[index + 1].classList.add(focusedCssClass);
                    results[index + 1].setAttribute("aria-selected", "true");
                }

                // if the last visible result is partially hidden, scroll up until it's completely visible
                newFocused = this._elements.results.querySelector(selectors.item.focused);
                if (newFocused) {
                    var bottomHiddenHeight = newFocused.offsetTop + newFocused.offsetHeight - this._elements.results.scrollTop - this._elements.results.clientHeight;
                    if (bottomHiddenHeight > 0) {
                        this._elements.results.scrollTop += bottomHiddenHeight;
                    } else {
                        this._onScroll();
                    }
                }

            } else {
                // highlight the previous result
                if (index >= 1) {
                    results[index].classList.remove(focusedCssClass);
                    results[index].setAttribute("aria-selected", "false");
                    results[index - 1].classList.add(focusedCssClass);
                    results[index - 1].setAttribute("aria-selected", "true");
                }

                // if the first visible result is partially hidden, scroll down until it's completely visible
                newFocused = this._elements.results.querySelector(selectors.item.focused);
                if (newFocused) {
                    var topHiddenHeight = this._elements.results.scrollTop - newFocused.offsetTop;
                    if (topHiddenHeight > 0) {
                        this._elements.results.scrollTop -= topHiddenHeight;
                    }
                }
            }
        }
    };

    Search.prototype._updateResults = function() {
        var self = this;
        if (self._hasMoreResults) {
            var request = new XMLHttpRequest();
            var url = self._action + "?" + serialize(self._elements.form) + "&" + PARAM_RESULTS_OFFSET + "=" + self._resultsOffset;

            request.open("GET", url, true);
            request.onload = function() {
                // when the results are loaded: hide the loading indicator and display the search icon after a minimum period
                setTimeout(function() {
                    toggleShow(self._elements.loadingIndicator, false);
                    toggleShow(self._elements.icon, true);
                }, LOADING_DISPLAY_DELAY);
                if (request.status >= 200 && request.status < 400) {
                    // success status
                    var data = JSON.parse(request.responseText);
                    if (data.length > 0) {
                        self._generateItems(data, self._elements.results);
                        self._markResults();
                        toggleShow(self._elements.results, true);
                        self._elements.input.setAttribute("aria-expanded", "true");
                    } else {
                        self._hasMoreResults = false;
                    }
                    // the total number of results is not a multiple of the fetched results:
                    // -> we reached the end of the query
                    if (self._elements.results.querySelectorAll(selectors.item.self).length % self._properties.resultsSize > 0) {
                        self._hasMoreResults = false;
                    }
                } else {
                    // error status
                }
            };
            // when the results are loading: display the loading indicator and hide the search icon
            toggleShow(self._elements.loadingIndicator, true);
            toggleShow(self._elements.icon, false);
            request.send();
        }
    };

    Search.prototype._cancelResults = function() {
        clearTimeout(this._timeout);
        this._elements.results.scrollTop = 0;
        this._resultsOffset = 0;
        this._hasMoreResults = true;
        this._elements.results.innerHTML = "";
        this._elements.input.setAttribute("aria-expanded", "false");
    };

    Search.prototype._cacheElements = function(wrapper) {
        this._elements = {};
        this._elements.self = wrapper;
        var hooks = this._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS + "]");

        for (var i = 0; i < hooks.length; i++) {
            var hook = hooks[i];
            var capitalized = IS;
            capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
            var key = hook.dataset[NS + "Hook" + capitalized];
            this._elements[key] = hook;
        }
    };

    Search.prototype._setupProperties = function(options) {
        this._properties = {};

        for (var key in properties) {
            if (Object.prototype.hasOwnProperty.call(properties, key)) {
                var property = properties[key];
                if (options && options[key] != null) {
                    if (property && typeof property.transform === "function") {
                        this._properties[key] = property.transform(options[key]);
                    } else {
                        this._properties[key] = options[key];
                    }
                } else {
                    this._properties[key] = properties[key]["default"];
                }
            }
        }
    };

    function onDocumentReady() {
        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new Search({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body = document.querySelector("body");
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new Search({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

})();

/*******************************************************************************
 * Copyright 2016 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var NS = "cmp";
    var IS = "formText";
    var IS_DASH = "form-text";

    var selectors = {
        self: "[data-" + NS + '-is="' + IS + '"]'
    };

    var properties = {
        /**
         * A validation message to display if there is a type mismatch between the user input and expected input.
         *
         * @type {String}
         */
        constraintMessage: "",
        /**
         * A validation message to display if no input is supplied, but input is expected for the field.
         *
         * @type {String}
         */
        requiredMessage: ""
    };

    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    function FormText(config) {
        if (config.element) {
            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");
        }

        this._cacheElements(config.element);
        this._setupProperties(config.options);

        this._elements.input.addEventListener("invalid", this._onInvalid.bind(this));
        this._elements.input.addEventListener("input", this._onInput.bind(this));
    }

    FormText.prototype._onInvalid = function(event) {
        event.target.setCustomValidity("");
        if (event.target.validity.typeMismatch) {
            if (this._properties.constraintMessage) {
                event.target.setCustomValidity(this._properties.constraintMessage);
            }
        } else if (event.target.validity.valueMissing) {
            if (this._properties.requiredMessage) {
                event.target.setCustomValidity(this._properties.requiredMessage);
            }
        }
    };

    FormText.prototype._onInput = function(event) {
        event.target.setCustomValidity("");
    };

    FormText.prototype._cacheElements = function(wrapper) {
        this._elements = {};
        this._elements.self = wrapper;
        var hooks = this._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS_DASH + "]");
        for (var i = 0; i < hooks.length; i++) {
            var hook = hooks[i];
            var capitalized = IS;
            capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
            var key = hook.dataset[NS + "Hook" + capitalized];
            this._elements[key] = hook;
        }
    };

    FormText.prototype._setupProperties = function(options) {
        this._properties = {};

        for (var key in properties) {
            if (Object.prototype.hasOwnProperty.call(properties, key)) {
                var property = properties[key];
                if (options && options[key] != null) {
                    if (property && typeof property.transform === "function") {
                        this._properties[key] = property.transform(options[key]);
                    } else {
                        this._properties[key] = options[key];
                    }
                } else {
                    this._properties[key] = properties[key]["default"];
                }
            }
        }
    };

    function onDocumentReady() {
        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new FormText({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body = document.querySelector("body");
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new FormText({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

})();

'use strict'; //---------------------------------------

window.LocatorUtils = function () {
  var LOCATIONS_API_PATH = sessionStorage.getItem('locatorTest') || '/truist-api/locator/locations.json';
  var _private = {
    COLLAPSIBLE_DAYS: ['Mon', 'Tue', 'Wed', 'Thu'],
    TODAY: new Date().toLocaleString('en-us', {
      weekday: 'short'
    }).replace(/^\W*/, ''),
      // .replace() call needed because IE11 prepends a null character to output of .toLocaleString()
      // many Bothans died to bring us this information
    getSearchOrigin: function getSearchOrigin(params) {
      return params ? _private.getLatLngLiteral(params.lat, params.long) || params.address : null;
    },
    getLatLngLiteral: function getLatLngLiteral(lat, lng) {
      var flat = parseFloat(lat);
      var flng = parseFloat(lng);
      return isFinite(flat) && isFinite(flng) ? {
        lat: flat,
        lng: flng
      } : null;
    },
    getDetailUrl: function getDetailUrl(type, locAddr) {
      var parts = ['', type, locAddr.state, locAddr.city, (locAddr.zipCode || '').replace(/-\d+$/, ''), "".concat(locAddr.address1 || '', " ").concat(locAddr.address2 || '')];
      return parts.map(function (part) {
        return encodeURIComponent((part || '').trim().replace(/(\s|-)+/g, '-').replace(/\//g, '\\').toLowerCase());
      }).join('/');
    },
    getFormattedSchedule: function () {
      function gfs(info) {
        if (info.key == 'atmHours') {
          var SCHED = '24 hrs'; // workaround until we have real ATM schedule data

          var atmDetail = info.loc.atmDetail;
          if (!(atmDetail && atmDetail[0])) return {};
          var flags = Object.keys(atmDetail.map(function (data) {
            return data.atmOpenClosedInd == 'O' ? data.atmServiceAvailable : '';
          }).join().split(',').reduce(function (acc, cur) {
            acc[cur] = true;
            return acc;
          }, {})).sort().join('');

          var _status = flags == 'DW' ? SCHED : CommonUtils.fillTemplate(info.linkTemplate, ["atm-".concat(flags), flags ? 'Limited operation' : 'Currently unavailable']);

          if (info.showToday) {
            return {
              schedToday: _status,
              schedWeekly: '24 hrs'
            };
          } else {
            return {
              schedWeekly: _status
            };
          }
        }

        var table = info.loc[info.key];
        if (!(table && table[0])) return {};
        var normalizeTable = [];
        var normalizeEntry = {};
        var schedWeeklyTable = [];
        var schedToday = '';
        var status = info.loc.branchStatus == 'O' ? '' : CommonUtils.fillTemplate(info.linkTemplate, ["branch-".concat(info.loc.branchStatus), 'Currently Closed']);
        table.forEach(function (entry) {
          // TODO: factor out as separate function
          var parts = entry.match(/^(\w+):\s*((\d?\d(:\d\d)?)\s*([ap]m)?\s*-\s*(\d?\d(:\d\d)?)\s*([ap]m)?|\w+)/i);

          if (!parts) {
            return;
          }

          var day = TextFormatUtils.format(parts[1], 'title');
          var sched = TextFormatUtils.format(parts[2], 'title');
          var opens = scrubTime(parts[3]);
          var closes = scrubTime(parts[6]);
          var openM = (parts[5] || '').toLowerCase();
          var closeM = (parts[8] || '').toLowerCase();

          if (opens && closes) {
            if (!openM || !closeM) {
              // am/pm designation(s) missing, so we'll make a best guess...
              var openHour = parseInt(opens) % 12;
              var closeHour = parseInt(closes) % 12;

            switch (true) {
              case openHour >= closeHour:
                  openM = 'am';
                  closeM = 'pm';
                break;

              case openHour >= 7:
                  openM = 'am';
                  closeM = 'am';
                break;

              case openHour < 7:
                  openM = 'pm';
                  closeM = 'pm';
              }
            }

            sched = "".concat(opens).concat(openM, "-").concat(closes).concat(closeM);
          }

          if (_private.COLLAPSIBLE_DAYS.includes(day) && normalizeEntry.sched == sched) {
            normalizeEntry.days += ",".concat(day);
          } else {
            normalizeEntry = {
              days: day,
              sched: sched
            };
            normalizeTable.push(normalizeEntry);
          }
        }); 
        normalizeTable.forEach(function (entry) {
          if (entry.days.includes(_private.TODAY)) {
            status = status || entry.sched;
            info.showToday ? schedToday = status : entry.sched = status;
          }

          schedWeeklyTable.push(CommonUtils.fillTemplate(info.schedTemplate, [entry.days.replace(/,.*,/, '-').concat(':'), entry.sched]));
        });
        return {
          schedToday: schedToday,
          schedWeekly: schedWeeklyTable.length ? "<ul class=\"lobby-items\">".concat(schedWeeklyTable.join('\n'), "</ul>") : ''
        };
      }

      function scrubTime(t) {
        return (t || '').replace(/^0/, '').replace(':00', '');
      }

      return gfs;
    }(),
    safeParse: function safeParse(jsonText) {
      // TODO: move this to CommonUtils (or similar shared library)
      try {
        return JSON.parse(jsonText) || {};
      } catch (err) {
        console.warn(err);
        return {};
      }
    },
    autoScroll: function autoScroll($cmp) {
      history.scrollRestoration = 'manual';

      var status = _private.safeParse(sessionStorage.getItem('locatorStatus'));

      if (status.autoScroll) {
        var $trg = $cmp.find(':visible').addBack().filter(function () {
          // determine first visible element (within component) containing only text
          var $content = $(this).contents();
          return $content.length == 1 && $content.get(0).nodeType == Node.TEXT_NODE;
        }).first();
        var adj = parseInt($trg.css('margin-top')) + parseInt($trg.css('padding-top'));
        status.autoScroll && CommonUtils.rollTo($trg, adj);
      }

      status.autoScroll = true;
      sessionStorage.setItem('locatorStatus', JSON.stringify(status));
    }
  };
  var _public = {
      getSearchOrigin: _private.getSearchOrigin,
      getLatLngLiteral: _private.getLatLngLiteral,
      getDetailUrl: _private.getDetailUrl,
    getFormattedSchedule: _private.getFormattedSchedule,
    safeParse: _private.safeParse,
    autoScroll: _private.autoScroll,
    LOCATIONS_API_PATH: LOCATIONS_API_PATH
  };
  return _public;
}(); //---------------------------------------


window.LocatorMobileUtils = function () {
  var isTouchScreen, isHandHeld, protocol;

  function init($container, selector) {
    // Determine device parameters:
    try {
      document.createEvent('TouchEvent');
      isTouchScreen = true;
    } catch (err) {
      isTouchScreen = false;
    }

    isHandHeld = matchMedia('(max-width: 814px)').matches;
    protocol = /\bAndroid\b/.test(navigator.userAgent) ? 'https:' : 'maps:'; // Set up delegated event handler:

    if (!isHandHeld) {
      CommonUtils.initClickChain($container, selector, function (ev) {
        isTouchScreen || ev.preventDefault();
        window.location = $(this).data('altHref');
      });
    }
  }

  function getMobileDirectionsUrl(saddr, daddr) {
    return "".concat(protocol, "//maps.google.com/maps?saddr=").concat(saddr, "&daddr=").concat(daddr);
  }

  return {
    init: init,
    getMobileDirectionsUrl: getMobileDirectionsUrl
  };
}; //---------------------------------------


$(document).ready(function () {
  switch (true) {
    case $('.branch-locator-component').children().length > 0:
      Locator.init();
      break;

    case $('.branch-detail-component').children().length > 0:
      LocatorDetail.init();
      break;

    default:
    LocatorAutocomplete.init();
  }
});
'use strict';

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

window.LocatorAutocomplete = function () {
  var DEFAULT_OPTIONS = {
      footprint: {},
      remember: true,
      auto: true
  };
  var GOOGLE_COMPONENT_RESTRICTIONS = {
        'country': 'us'
  };
  var REGION_TYPES = ['(regions)'];
  var ADDRESS_TYPES = ['address'];
  var GEOCODE_TYPES = ['geocode'];
  var TYPEAHEAD_LIMIT = 5;
  var options,
      stopper = 20;
  var $ac, $acForm, $buttons, $loadingIndicator;
  var geocoder, acsToken;
  var prevQuery, prevPredictions; // TODO: consider how to better limit scope for these

  var _private = {
    //---------------------------------------
    init: function init(opts) {
      $.getScript('/etc.clientlibs/stcom-aem-globalcomponents/clientlibs/clientlib-search-utils..js').done(function () {
        return _private.init1(opts);
      }); // $.getScript( '/clientlibs/clientlib-search-utils/js/search-type-ahead.js' ).done( () => _private.init1( opts ) );
    },
    init1: function init1(opts) {
      if (!($.fn.typeahead && Bloodhound)) {
        console.log('initializing typeahead library...');
        stopper-- > 0 ? setTimeout(_private.init1, 400, opts) : console.error('failed to initialize typeahead library');
        return;
      }

      options = _objectSpread(_objectSpread({}, DEFAULT_OPTIONS), opts); //console.log( options );

      geocoder = new google.maps.Geocoder();
      $loadingIndicator = $('.loading-indicator'); // Custom autocomplete:

      $ac = $('#autocomplete');
      var $acNextAll = $ac.nextAll();
      $ac.typeahead({}, {
        // TODO: if using apart from Google Map, must add "powered by Google" logo at bottom of suggestion list
        source: _private.typeaheadSource,
        limit: Number.MAX_SAFE_INTEGER,
        // "limit" setting doesn't work as advertised with typeahead, so we apply the real limit elsewhere
        display: 'description',
        templates: {
          header: '<div class="suggest-text">Suggested Searches<div>',
          suggestion: function suggestion(data) {
            var sf = data.structured_formatting;
            return "<div><span>".concat(sf.main_text, "</span><span>").concat(sf.secondary_text, "</span></div>");
          }
        }
      }).bind('typeahead:selected', _private.handleTypeaheadSelected).after($acNextAll);

      _private.typeaheadSafeUpdate(options.searchTerm); // More objects and event bindings:


      $acForm = $ac.closest('form').attr('action', function (i, was) {
        return "".concat(was).concat(location.search);
      });
      $buttons = $acForm.find('button').not('.filter-button-badge');
      $ac.change(function () {
        return $buttons.prop('disabled', false);
      });
      $('label.placeholder').click(function () {
        return $ac.focus();
      });
      $acForm.submit(_private.handleSubmit);
      var $geoLocationButton = $('.bg-svg >svg');
      navigator.geolocation || $geoLocationButton.hide();
      $geoLocationButton.on('click keydown', _private.handleGeoLocationClick);
      $geoLocationButton.on('keydown', _private.handleTabFocus); // Drummer Hoff:
      
      if (options.auto && options.callback) {
        if (options.searchTerm) {
          $acForm.submit();
        } else {
          var params = JSON.parse(sessionStorage.getItem('locatorParams'));
          params ? _private.handoff(params) : $geoLocationButton.click();
        }
         }
    },
    //---------------------------------------
    typeaheadSource: function () {
      var acs;
      return function () {
        var query = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
        var syncHandler = arguments.length > 1 ? arguments[1] : undefined;
        var asyncHandler = arguments.length > 2 ? arguments[2] : undefined;

        if (query.indexOf(prevQuery) == 0) {
          //console.log( 'we have priors...' );
          syncHandler(prevPredictions);
          return;
        }

        prevQuery = undefined;
        prevPredictions = undefined;
        var typeList = /^[\d\-]+$/.test(query) ? [REGION_TYPES, ADDRESS_TYPES] : // if it might be a zip code, we'll check regions before addresses
        [GEOCODE_TYPES] // otherwise, could be anything
        ;
        acs || (acs = new google.maps.places.AutocompleteService());
        acsToken || (acsToken = new google.maps.places.AutocompleteSessionToken());
        getPredictions(); //-----------------------------------

        function getPredictions() {
          var acc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

          if (typeList.length <= 0 || acc.length >= TYPEAHEAD_LIMIT) {
            asyncHandler(acc.slice(0, TYPEAHEAD_LIMIT));

            if (acc.length <= 1) {
              prevQuery = query;
              prevPredictions = acc;
            }
          } else {
            acs.getPlacePredictions({
              input: query,
              types: typeList.shift(),
              componentRestrictions: GOOGLE_COMPONENT_RESTRICTIONS,
              sessionToken: acsToken
            }).then(function (resp) {
              return getPredictions(acc.concat(resp.predictions));
            });
      }
      }
      };
    }(),
    //---------------------------------------
    typeaheadSafeUpdate: function typeaheadSafeUpdate(text) {
      prevQuery = text;
      prevPredictions = undefined;
      $ac.typeahead('val', text);
    },
    //---------------------------------------
    handleTypeaheadSelected: function () {
      var ps;
      return function (ev, data) {
        ps || (ps = new google.maps.places.PlacesService($('<div/>').get(0)));
        ps.getDetails({
          placeId: data.place_id,
          fields: ['geometry', 'address_components'],
          sessionToken: acsToken
        }, _private.handleAutoComplete);
        acsToken = undefined;
      };
    }(),
    //---------------------------------------
    handleTabFocus: function handleTabFocus(ev) {
      ev.preventDefault();
      ev.keyCode == "9" && $('.google-locator-input').focus();
    },
    //---------------------------------------
    handleGeoLocationClick: function handleGeoLocationClick(ev) {
      ev.preventDefault();
      if (!(ev.type == 'click' || ev.keyCode === 13 || ev.keyCode === 32)) return;

          try {
        navigator.geolocation.getCurrentPosition(function (pos) {
          var c = pos.coords;

          _private.handleGeoLocation(LocatorUtils.getLatLngLiteral(c.latitude, c.longitude));
        }, _private.handleError, {
          timeout: 3000
        });
          } catch (err) {
        _private.handleError(err);
      }
    },
    //---------------------------------------
    handleError: function handleError(err) {
      console.error(err);

      _private.typeaheadSafeUpdate('Charlotte, NC'); // TODO: make this default search configurable


      $acForm.submit();
    },
    //---------------------------------------
    handleGeoLocation: function handleGeoLocation(ll) {
      return geocoder.geocode( // reverse geocode so we can echo back address of the detected coordinates
        {
          location: ll
      }, function (results, status) {
        return _private.handleAutoComplete((results || [])[0], status);
        });
    },
    //---------------------------------------
    handleAutoComplete: function handleAutoComplete(result, status) {
      switch (status) {
        case 'OK':
      var ll = result.geometry ? result.geometry.location : {};
      var smallest = result.address_components[0];
      var state = smallest.types.includes('administrative_area_level_1') ? smallest.short_name : '';
      $loadingIndicator.show();
      result.formatted_address && _private.typeaheadSafeUpdate(result.formatted_address);

      _private.handoff(state ? {
        state: state
      } : {
        lat: ll.lat(),
        long: ll.lng()
      });

          return;

        case 'OVER_QUERY_LIMIT':
          console.error(status);
          return;

        default:
          _private.handleError(status);

      }
    },
    //---------------------------------------
    handleSubmit: function handleSubmit(ev) {
      ev.preventDefault();
      var locatorText = $ac.typeahead('val').trim().replace(/\s+/, ' ');
      var stateNucky = options.footprint[locatorText.toLowerCase()];
      var state = stateNucky ? stateNucky.abbr.toUpperCase() : '';

      if (state) {
        _private.handoff({
        state: state
        });
      } else {
        geocoder.geocode({
        address: locatorText
        }, function (results, status) {
          return _private.handleAutoComplete((results || [])[0], status);
      });
      }
    },
    //---------------------------------------
    handoff: function handoff(params) {
      //console.trace();  console.log( 'invoking callback: ', options.callback );
      $buttons.prop('disabled', true);
      $ac.typeahead('val') || _private.typeaheadSafeUpdate(sessionStorage.getItem('locatorText'));

      if (options.remember) {
        sessionStorage.setItem('locatorText', $ac.typeahead('val'));
        sessionStorage.setItem('locatorParams', JSON.stringify(params));
      }

      options.callback ? options.callback(params) : $acForm.off('submit').submit();
    },
    //---------------------------------------
    getLocatorText: function getLocatorText() {
      return $ac.typeahead('val');
    },
    //---------------------------------------
    activate: function activate() {
      return $acForm.submit();
    } // TODO: implement better logic for replaying various handlers here

  };
  var _public = {
    init: _private.init,
    getLocatorText: _private.getLocatorText,
    activate: _private.activate,
    handleGeoLocation: _private.handleGeoLocation
  };
  return _public;
}();
"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var MarkerClusterer = function () {
  "use strict";

  var t = function t(_t2) {
    try {
      return !!_t2();
    } catch (t) {
      return !0;
    }
  },
      e = !t(function () {
    return 7 != Object.defineProperty({}, 1, {
      get: function get() {
        return 7;
      }
    })[1];
  }),
      r = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {};

  function n(t, e) {
    return t(e = {
      exports: {}
    }, e.exports), e.exports;
  }

  var i = function i(t) {
    return t && t.Math == Math && t;
  },
      o = i("object" == (typeof globalThis === "undefined" ? "undefined" : _typeof(globalThis)) && globalThis) || i("object" == (typeof window === "undefined" ? "undefined" : _typeof(window)) && window) || i("object" == (typeof self === "undefined" ? "undefined" : _typeof(self)) && self) || i("object" == _typeof(r) && r) || function () {
    return this;
  }() || Function("return this")(),
      s = /#|\.prototype\./,
      a = function a(e, r) {
    var n = l[u(e)];
    return n == h || n != c && ("function" == typeof r ? t(r) : !!r);
  },
      u = a.normalize = function (t) {
    return String(t).replace(s, ".").toLowerCase();
  },
      l = a.data = {},
      c = a.NATIVE = "N",
      h = a.POLYFILL = "P",
      p = a,
      f = function f(t) {
    return "object" == _typeof(t) ? null !== t : "function" == typeof t;
  },
      g = o.document,
      d = f(g) && f(g.createElement),
      _ = function _(t) {
    return d ? g.createElement(t) : {};
  },
      m = !e && !t(function () {
    return 7 != Object.defineProperty(_("div"), "a", {
      get: function get() {
        return 7;
      }
    }).a;
  }),
      v = function v(t) {
    if (!f(t)) throw TypeError(String(t) + " is not an object");
    return t;
  },
      y = function y(t, e) {
    if (!f(t)) return t;
    var r, n;
    if (e && "function" == typeof (r = t.toString) && !f(n = r.call(t))) return n;
    if ("function" == typeof (r = t.valueOf) && !f(n = r.call(t))) return n;
    if (!e && "function" == typeof (r = t.toString) && !f(n = r.call(t))) return n;
    throw TypeError("Can't convert object to primitive value");
  },
      x = Object.defineProperty,
      S = {
    f: e ? x : function (t, e, r) {
      if (v(t), e = y(e, !0), v(r), m) try {
        return x(t, e, r);
      } catch (t) {}
      if ("get" in r || "set" in r) throw TypeError("Accessors not supported");
      return "value" in r && (t[e] = r.value), t;
    }
  },
      b = function b(t, e) {
    return {
      enumerable: !(1 & t),
      configurable: !(2 & t),
      writable: !(4 & t),
      value: e
    };
  },
      M = e ? function (t, e, r) {
    return S.f(t, e, b(1, r));
  } : function (t, e, r) {
    return t[e] = r, t;
  },
      E = function E(t) {
    if (null == t) throw TypeError("Can't call method on " + t);
    return t;
  },
      I = function I(t) {
    return Object(E(t));
  },
      C = {}.hasOwnProperty,
      k = function k(t, e) {
    return C.call(I(t), e);
  },
      w = function w(t, e) {
    try {
      M(o, t, e);
    } catch (r) {
      o[t] = e;
    }

    return e;
  },
      O = "__core-js_shared__",
      A = o[O] || w(O, {}),
      T = Function.toString;

  "function" != typeof A.inspectSource && (A.inspectSource = function (t) {
    return T.call(t);
  });

  var P,
      L,
      z,
      j = A.inspectSource,
      R = o.WeakMap,
      N = "function" == typeof R && /native code/.test(j(R)),
      B = n(function (t) {
    (t.exports = function (t, e) {
      return A[t] || (A[t] = void 0 !== e ? e : {});
    })("versions", []).push({
      version: "3.12.1",
      mode: "global",
      copyright: "© 2021 Denis Pushkarev (zloirock.ru)"
    });
  }),
      Z = 0,
      D = Math.random(),
      F = function F(t) {
    return "Symbol(" + String(void 0 === t ? "" : t) + ")_" + (++Z + D).toString(36);
  },
      H = B("keys"),
      U = function U(t) {
    return H[t] || (H[t] = F(t));
  },
      $ = {},
      G = "Object already initialized",
      V = o.WeakMap;

  if (N || A.state) {
    var W = A.state || (A.state = new V()),
        X = W.get,
        Y = W.has,
        K = W.set;
    P = function P(t, e) {
      if (Y.call(W, t)) throw new TypeError(G);
      return e.facade = t, K.call(W, t, e), e;
    }, L = function L(t) {
      return X.call(W, t) || {};
    }, z = function z(t) {
      return Y.call(W, t);
    };
  } else {
    var q = U("state");
    $[q] = !0, P = function P(t, e) {
      if (k(t, q)) throw new TypeError(G);
      return e.facade = t, M(t, q, e), e;
    }, L = function L(t) {
      return k(t, q) ? t[q] : {};
    }, z = function z(t) {
      return k(t, q);
    };
  }

  var J,
      Q = {
    set: P,
    get: L,
    has: z,
    enforce: function enforce(t) {
      return z(t) ? L(t) : P(t, {});
    },
    getterFor: function getterFor(t) {
      return function (e) {
        var r;
        if (!f(e) || (r = L(e)).type !== t) throw TypeError("Incompatible receiver, " + t + " required");
        return r;
      };
    }
  },
      tt = n(function (t) {
    var e = Q.get,
        r = Q.enforce,
        n = String(String).split("String");
    (t.exports = function (t, e, i, s) {
      var a,
          u = !!s && !!s.unsafe,
          l = !!s && !!s.enumerable,
          c = !!s && !!s.noTargetGet;
      "function" == typeof i && ("string" != typeof e || k(i, "name") || M(i, "name", e), (a = r(i)).source || (a.source = n.join("string" == typeof e ? e : ""))), t !== o ? (u ? !c && t[e] && (l = !0) : delete t[e], l ? t[e] = i : M(t, e, i)) : l ? t[e] = i : w(e, i);
    })(Function.prototype, "toString", function () {
      return "function" == typeof this && e(this).source || j(this);
    });
  }),
      et = {}.toString,
      rt = function rt(t) {
    return et.call(t).slice(8, -1);
  },
      nt = Object.setPrototypeOf || ("__proto__" in {} ? function () {
    var t,
        e = !1,
        r = {};

    try {
      (t = Object.getOwnPropertyDescriptor(Object.prototype, "__proto__").set).call(r, []), e = r instanceof Array;
    } catch (t) {}

    return function (r, n) {
      return v(r), function (t) {
        if (!f(t) && null !== t) throw TypeError("Can't set " + String(t) + " as a prototype");
      }(n), e ? t.call(r, n) : r.__proto__ = n, r;
    };
  }() : void 0),
      it = function it(t, e, r) {
    var n, i;
    return nt && "function" == typeof (n = e.constructor) && n !== r && f(i = n.prototype) && i !== r.prototype && nt(t, i), t;
  },
      ot = "".split,
      st = t(function () {
    return !Object("z").propertyIsEnumerable(0);
  }) ? function (t) {
    return "String" == rt(t) ? ot.call(t, "") : Object(t);
  } : Object,
      at = function at(t) {
    return st(E(t));
  },
      ut = Math.ceil,
      lt = Math.floor,
      ct = function ct(t) {
    return isNaN(t = +t) ? 0 : (t > 0 ? lt : ut)(t);
  },
      ht = Math.min,
      pt = function pt(t) {
    return t > 0 ? ht(ct(t), 9007199254740991) : 0;
  },
      ft = Math.max,
      gt = Math.min,
      dt = function dt(t, e) {
    var r = ct(t);
    return r < 0 ? ft(r + e, 0) : gt(r, e);
  },
      _t = function _t(t) {
    return function (e, r, n) {
      var i,
          o = at(e),
          s = pt(o.length),
          a = dt(n, s);

      if (t && r != r) {
        for (; s > a;) {
          if ((i = o[a++]) != i) return !0;
        }
      } else for (; s > a; a++) {
        if ((t || a in o) && o[a] === r) return t || a || 0;
      }

      return !t && -1;
    };
  },
      mt = {
    includes: _t(!0),
    indexOf: _t(!1)
  }.indexOf,
      vt = function vt(t, e) {
    var r,
        n = at(t),
        i = 0,
        o = [];

    for (r in n) {
      !k($, r) && k(n, r) && o.push(r);
    }

    for (; e.length > i;) {
      k(n, r = e[i++]) && (~mt(o, r) || o.push(r));
    }

    return o;
  },
      yt = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"],
      xt = Object.keys || function (t) {
    return vt(t, yt);
  },
      St = e ? Object.defineProperties : function (t, e) {
    v(t);

    for (var r, n = xt(e), i = n.length, o = 0; i > o;) {
      S.f(t, r = n[o++], e[r]);
    }

    return t;
  },
      bt = o,
      Mt = function Mt(t) {
    return "function" == typeof t ? t : void 0;
  },
      Et = function Et(t, e) {
    return arguments.length < 2 ? Mt(bt[t]) || Mt(o[t]) : bt[t] && bt[t][e] || o[t] && o[t][e];
  },
      It = Et("document", "documentElement"),
      Ct = U("IE_PROTO"),
      kt = function kt() {},
      wt = function wt(t) {
    return "<script>" + t + "</" + "script>";
  },
      _Ot = function Ot() {
    try {
      J = document.domain && new ActiveXObject("htmlfile");
    } catch (t) {}

    var t, e;
    _Ot = J ? function (t) {
      t.write(wt("")), t.close();
      var e = t.parentWindow.Object;
      return t = null, e;
    }(J) : ((e = _("iframe")).style.display = "none", It.appendChild(e), e.src = String("javascript:"), (t = e.contentWindow.document).open(), t.write(wt("document.F=Object")), t.close(), t.F);

    for (var r = yt.length; r--;) {
      delete _Ot.prototype[yt[r]];
    }

    return _Ot();
  };

  $[Ct] = !0;

  var At = Object.create || function (t, e) {
    var r;
    return null !== t ? (kt.prototype = v(t), r = new kt(), kt.prototype = null, r[Ct] = t) : r = _Ot(), void 0 === e ? r : St(r, e);
  },
      Tt = yt.concat("length", "prototype"),
      Pt = {
    f: Object.getOwnPropertyNames || function (t) {
      return vt(t, Tt);
    }
  },
      Lt = {}.propertyIsEnumerable,
      zt = Object.getOwnPropertyDescriptor,
      jt = {
    f: zt && !Lt.call({
      1: 2
    }, 1) ? function (t) {
      var e = zt(this, t);
      return !!e && e.enumerable;
    } : Lt
  },
      Rt = Object.getOwnPropertyDescriptor,
      Nt = {
    f: e ? Rt : function (t, e) {
      if (t = at(t), e = y(e, !0), m) try {
        return Rt(t, e);
      } catch (t) {}
      if (k(t, e)) return b(!jt.f.call(t, e), t[e]);
    }
  },
      Bt = "[\t\n\x0B\f\r \xA0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF]",
      Zt = RegExp("^" + Bt + Bt + "*"),
      Dt = RegExp(Bt + Bt + "*$"),
      Ft = function Ft(t) {
    return function (e) {
      var r = String(E(e));
      return 1 & t && (r = r.replace(Zt, "")), 2 & t && (r = r.replace(Dt, "")), r;
    };
  },
      Ht = {
    start: Ft(1),
    end: Ft(2),
    trim: Ft(3)
  },
      Ut = Pt.f,
      $t = Nt.f,
      Gt = S.f,
      Vt = Ht.trim,
      Wt = "Number",
      Xt = o.Number,
      Yt = Xt.prototype,
      Kt = rt(At(Yt)) == Wt,
      qt = function qt(t) {
    var e,
        r,
        n,
        i,
        o,
        s,
        a,
        u,
        l = y(t, !1);
    if ("string" == typeof l && l.length > 2) if (43 === (e = (l = Vt(l)).charCodeAt(0)) || 45 === e) {
      if (88 === (r = l.charCodeAt(2)) || 120 === r) return NaN;
    } else if (48 === e) {
      switch (l.charCodeAt(1)) {
        case 66:
        case 98:
          n = 2, i = 49;
          break;

        case 79:
        case 111:
          n = 8, i = 55;
          break;

        default:
          return +l;
      }

      for (s = (o = l.slice(2)).length, a = 0; a < s; a++) {
        if ((u = o.charCodeAt(a)) < 48 || u > i) return NaN;
      }

      return parseInt(o, n);
    }
    return +l;
  };

  if (p(Wt, !Xt(" 0o1") || !Xt("0b1") || Xt("+0x1"))) {
    for (var Jt, Qt = function Qt(e) {
      var r = arguments.length < 1 ? 0 : e,
          n = this;
      return n instanceof Qt && (Kt ? t(function () {
        Yt.valueOf.call(n);
      }) : rt(n) != Wt) ? it(new Xt(qt(r)), n, Qt) : qt(r);
    }, te = e ? Ut(Xt) : "MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger,fromString,range".split(","), ee = 0; te.length > ee; ee++) {
      k(Xt, Jt = te[ee]) && !k(Qt, Jt) && Gt(Qt, Jt, $t(Xt, Jt));
    }

    Qt.prototype = Yt, Yt.constructor = Qt, tt(o, Wt, Qt);
  }

  var re,
      ne,
      ie = {
    f: Object.getOwnPropertySymbols
  },
      oe = Et("Reflect", "ownKeys") || function (t) {
    var e = Pt.f(v(t)),
        r = ie.f;
    return r ? e.concat(r(t)) : e;
  },
      se = function se(t, e) {
    for (var r = oe(e), n = S.f, i = Nt.f, o = 0; o < r.length; o++) {
      var s = r[o];
      k(t, s) || n(t, s, i(e, s));
    }
  },
      ae = Nt.f,
      ue = function ue(t, e) {
    var r,
        n,
        i,
        s,
        a,
        u = t.target,
        l = t.global,
        c = t.stat;
    if (r = l ? o : c ? o[u] || w(u, {}) : (o[u] || {}).prototype) for (n in e) {
      if (s = e[n], i = t.noTargetGet ? (a = ae(r, n)) && a.value : r[n], !p(l ? n : u + (c ? "." : "#") + n, t.forced) && void 0 !== i) {
        if (_typeof(s) == _typeof(i)) continue;
        se(s, i);
      }

      (t.sham || i && i.sham) && M(s, "sham", !0), tt(r, n, s, t);
    }
  },
      le = Array.isArray || function (t) {
    return "Array" == rt(t);
  },
      ce = Et("navigator", "userAgent") || "",
      he = o.process,
      pe = he && he.versions,
      fe = pe && pe.v8;

  fe ? ne = (re = fe.split("."))[0] < 4 ? 1 : re[0] + re[1] : ce && (!(re = ce.match(/Edge\/(\d+)/)) || re[1] >= 74) && (re = ce.match(/Chrome\/(\d+)/)) && (ne = re[1]);

  var ge = ne && +ne,
      de = !!Object.getOwnPropertySymbols && !t(function () {
    return !String(Symbol()) || !Symbol.sham && ge && ge < 41;
  }),
      _e = de && !Symbol.sham && "symbol" == _typeof(Symbol.iterator),
      me = B("wks"),
      ve = o.Symbol,
      ye = _e ? ve : ve && ve.withoutSetter || F,
      xe = function xe(t) {
    return k(me, t) && (de || "string" == typeof me[t]) || (de && k(ve, t) ? me[t] = ve[t] : me[t] = ye("Symbol." + t)), me[t];
  },
      Se = xe("species"),
      be = function be(t, e) {
    var r;
    return le(t) && ("function" != typeof (r = t.constructor) || r !== Array && !le(r.prototype) ? f(r) && null === (r = r[Se]) && (r = void 0) : r = void 0), new (void 0 === r ? Array : r)(0 === e ? 0 : e);
  },
      Me = function Me(t, e, r) {
    var n = y(e);
    n in t ? S.f(t, n, b(0, r)) : t[n] = r;
  },
      Ee = xe("species"),
      Ie = function Ie(e) {
    return ge >= 51 || !t(function () {
      var t = [];
      return (t.constructor = {})[Ee] = function () {
        return {
          foo: 1
        };
      }, 1 !== t[e](Boolean).foo;
    });
  },
      Ce = Ie("splice"),
      ke = Math.max,
      we = Math.min,
      Oe = 9007199254740991,
      Ae = "Maximum allowed length exceeded";

  ue({
    target: "Array",
    proto: !0,
    forced: !Ce
  }, {
    splice: function splice(t, e) {
      var r,
          n,
          i,
          o,
          s,
          a,
          u = I(this),
          l = pt(u.length),
          c = dt(t, l),
          h = arguments.length;
      if (0 === h ? r = n = 0 : 1 === h ? (r = 0, n = l - c) : (r = h - 2, n = we(ke(ct(e), 0), l - c)), l + r - n > Oe) throw TypeError(Ae);

      for (i = be(u, n), o = 0; o < n; o++) {
        (s = c + o) in u && Me(i, o, u[s]);
      }

      if (i.length = n, r < n) {
        for (o = c; o < l - n; o++) {
          a = o + r, (s = o + n) in u ? u[a] = u[s] : delete u[a];
        }

        for (o = l; o > l - n + r; o--) {
          delete u[o - 1];
        }
      } else if (r > n) for (o = l - n; o > c; o--) {
        a = o + r - 1, (s = o + n - 1) in u ? u[a] = u[s] : delete u[a];
      }

      for (o = 0; o < r; o++) {
        u[o + c] = arguments[o + 2];
      }

      return u.length = l - n + r, i;
    }
  });
  var Te = Ie("slice"),
      Pe = xe("species"),
      Le = [].slice,
      ze = Math.max;
  ue({
    target: "Array",
    proto: !0,
    forced: !Te
  }, {
    slice: function slice(t, e) {
      var r,
          n,
          i,
          o = at(this),
          s = pt(o.length),
          a = dt(t, s),
          u = dt(void 0 === e ? s : e, s);
      if (le(o) && ("function" != typeof (r = o.constructor) || r !== Array && !le(r.prototype) ? f(r) && null === (r = r[Pe]) && (r = void 0) : r = void 0, r === Array || void 0 === r)) return Le.call(o, a, u);

      for (n = new (void 0 === r ? Array : r)(ze(u - a, 0)), i = 0; a < u; a++, i++) {
        a in o && Me(n, i, o[a]);
      }

      return n.length = i, n;
    }
  });
  var je = {};
  je[xe("toStringTag")] = "z";
  var Re = "[object z]" === String(je),
      Ne = xe("toStringTag"),
      Be = "Arguments" == rt(function () {
    return arguments;
  }()),
      Ze = Re ? rt : function (t) {
    var e, r, n;
    return void 0 === t ? "Undefined" : null === t ? "Null" : "string" == typeof (r = function (t, e) {
      try {
        return t[e];
      } catch (t) {}
    }(e = Object(t), Ne)) ? r : Be ? rt(e) : "Object" == (n = rt(e)) && "function" == typeof e.callee ? "Arguments" : n;
  },
      De = Re ? {}.toString : function () {
    return "[object " + Ze(this) + "]";
  };
  Re || tt(Object.prototype, "toString", De, {
    unsafe: !0
  });

  var Fe = function Fe() {
    var t = v(this),
        e = "";
    return t.global && (e += "g"), t.ignoreCase && (e += "i"), t.multiline && (e += "m"), t.dotAll && (e += "s"), t.unicode && (e += "u"), t.sticky && (e += "y"), e;
  },
      He = "toString",
      Ue = RegExp.prototype,
      $e = Ue.toString,
      Ge = t(function () {
    return "/a/b" != $e.call({
      source: "a",
      flags: "b"
    });
  }),
      Ve = $e.name != He;

  (Ge || Ve) && tt(RegExp.prototype, He, function () {
    var t = v(this),
        e = String(t.source),
        r = t.flags;
    return "/" + e + "/" + String(void 0 === r && t instanceof RegExp && !("flags" in Ue) ? Fe.call(t) : r);
  }, {
    unsafe: !0
  });

  var _We = function We(t, e) {
    return (_We = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (t, e) {
      t.__proto__ = e;
    } || function (t, e) {
      for (var r in e) {
        Object.prototype.hasOwnProperty.call(e, r) && (t[r] = e[r]);
      }
    })(t, e);
  };

  function Xe(t, e) {
    if ("function" != typeof e && null !== e) throw new TypeError("Class extends value " + String(e) + " is not a constructor or null");

    function r() {
      this.constructor = t;
    }

    _We(t, e), t.prototype = null === e ? Object.create(e) : (r.prototype = e.prototype, new r());
  }

  var Ye,
      Ke,
      _qe = function qe() {
    return (_qe = Object.assign || function (t) {
      for (var e, r = 1, n = arguments.length; r < n; r++) {
        for (var i in e = arguments[r]) {
          Object.prototype.hasOwnProperty.call(e, i) && (t[i] = e[i]);
        }
      }

      return t;
    }).apply(this, arguments);
  },
      Je = [].join,
      Qe = st != Object,
      tr = (Ye = ",", !!(Ke = []["join"]) && t(function () {
    Ke.call(null, Ye || function () {
      throw 1;
    }, 1);
  }));

  function er(t, e) {
    return RegExp(t, e);
  }

  ue({
    target: "Array",
    proto: !0,
    forced: Qe || !tr
  }, {
    join: function join(t) {
      return Je.call(at(this), void 0 === t ? "," : t);
    }
  }), ue({
    target: "Object",
    stat: !0,
    forced: t(function () {
      xt(1);
    })
  }, {
    keys: function keys(t) {
      return xt(I(t));
    }
  });
  var rr,
      nr,
      ir = {
    UNSUPPORTED_Y: t(function () {
      var t = er("a", "y");
      return t.lastIndex = 2, null != t.exec("abcd");
    }),
    BROKEN_CARET: t(function () {
      var t = er("^r", "gy");
      return t.lastIndex = 2, null != t.exec("str");
    })
  },
      or = RegExp.prototype.exec,
      sr = B("native-string-replace", String.prototype.replace),
      ar = or,
      ur = (rr = /a/, nr = /b*/g, or.call(rr, "a"), or.call(nr, "a"), 0 !== rr.lastIndex || 0 !== nr.lastIndex),
      lr = ir.UNSUPPORTED_Y || ir.BROKEN_CARET,
      cr = void 0 !== /()??/.exec("")[1];
  (ur || cr || lr) && (ar = function ar(t) {
    var e,
        r,
        n,
        i,
        o = this,
        s = lr && o.sticky,
        a = Fe.call(o),
        u = o.source,
        l = 0,
        c = t;
    return s && (-1 === (a = a.replace("y", "")).indexOf("g") && (a += "g"), c = String(t).slice(o.lastIndex), o.lastIndex > 0 && (!o.multiline || o.multiline && "\n" !== t[o.lastIndex - 1]) && (u = "(?: " + u + ")", c = " " + c, l++), r = new RegExp("^(?:" + u + ")", a)), cr && (r = new RegExp("^" + u + "$(?!\\s)", a)), ur && (e = o.lastIndex), n = or.call(s ? r : o, c), s ? n ? (n.input = n.input.slice(l), n[0] = n[0].slice(l), n.index = o.lastIndex, o.lastIndex += n[0].length) : o.lastIndex = 0 : ur && n && (o.lastIndex = o.global ? n.index + n[0].length : e), cr && n && n.length > 1 && sr.call(n[0], r, function () {
      for (i = 1; i < arguments.length - 2; i++) {
        void 0 === arguments[i] && (n[i] = void 0);
      }
    }), n;
  });
  var hr = ar;
  ue({
    target: "RegExp",
    proto: !0,
    forced: /./.exec !== hr
  }, {
    exec: hr
  });

  var pr = xe("species"),
      fr = RegExp.prototype,
      gr = !t(function () {
    var t = /./;
    return t.exec = function () {
      var t = [];
      return t.groups = {
        a: "7"
      }, t;
    }, "7" !== "".replace(t, "$<a>");
  }),
      dr = "$0" === "a".replace(/./, "$0"),
      _r = xe("replace"),
      mr = !!/./[_r] && "" === /./[_r]("a", "$0"),
      vr = !t(function () {
    var t = /(?:)/,
        e = t.exec;

    t.exec = function () {
      return e.apply(this, arguments);
    };

    var r = "ab".split(t);
    return 2 !== r.length || "a" !== r[0] || "b" !== r[1];
  }),
      yr = function yr(e, r, n, i) {
    var o = xe(e),
        s = !t(function () {
      var t = {};
      return t[o] = function () {
        return 7;
      }, 7 != ""[e](t);
    }),
        a = s && !t(function () {
      var t = !1,
          r = /a/;
      return "split" === e && ((r = {}).constructor = {}, r.constructor[pr] = function () {
        return r;
      }, r.flags = "", r[o] = /./[o]), r.exec = function () {
        return t = !0, null;
      }, r[o](""), !t;
    });

    if (!s || !a || "replace" === e && (!gr || !dr || mr) || "split" === e && !vr) {
      var u = /./[o],
          l = n(o, ""[e], function (t, e, r, n, i) {
        var o = e.exec;
        return o === hr || o === fr.exec ? s && !i ? {
          done: !0,
          value: u.call(e, r, n)
        } : {
          done: !0,
          value: t.call(r, e, n)
        } : {
          done: !1
        };
      }, {
        REPLACE_KEEPS_$0: dr,
        REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE: mr
      }),
          c = l[0],
          h = l[1];
      tt(String.prototype, e, c), tt(fr, o, 2 == r ? function (t, e) {
        return h.call(t, this, e);
      } : function (t) {
        return h.call(t, this);
      });
    }

    i && M(fr[o], "sham", !0);
  },
      xr = xe("match"),
      Sr = xe("species"),
      br = function br(t, e) {
    var r,
        n = v(t).constructor;
    return void 0 === n || null == (r = v(n)[Sr]) ? e : function (t) {
      if ("function" != typeof t) throw TypeError(String(t) + " is not a function");
      return t;
    }(r);
  },
      Mr = function Mr(t) {
    return function (e, r) {
      var n,
          i,
          o = String(E(e)),
          s = ct(r),
          a = o.length;
      return s < 0 || s >= a ? t ? "" : void 0 : (n = o.charCodeAt(s)) < 55296 || n > 56319 || s + 1 === a || (i = o.charCodeAt(s + 1)) < 56320 || i > 57343 ? t ? o.charAt(s) : n : t ? o.slice(s, s + 2) : i - 56320 + (n - 55296 << 10) + 65536;
    };
  },
      Er = {
    codeAt: Mr(!1),
    charAt: Mr(!0)
  }.charAt,
      Ir = function Ir(t, e, r) {
    return e + (r ? Er(t, e).length : 1);
  },
      Cr = function Cr(t, e) {
    var r = t.exec;

    if ("function" == typeof r) {
      var n = r.call(t, e);
      if ("object" != _typeof(n)) throw TypeError("RegExp exec method returned something other than an Object or null");
      return n;
    }

    if ("RegExp" !== rt(t)) throw TypeError("RegExp#exec called on incompatible receiver");
    return hr.call(t, e);
  },
      kr = ir.UNSUPPORTED_Y,
      wr = [].push,
      Or = Math.min,
      Ar = 4294967295;

  yr("split", 2, function (t, e, r) {
    var n;
    return n = "c" == "abbc".split(/(b)*/)[1] || 4 != "test".split(/(?:)/, -1).length || 2 != "ab".split(/(?:ab)*/).length || 4 != ".".split(/(.?)(.?)/).length || ".".split(/()()/).length > 1 || "".split(/.?/).length ? function (t, r) {
      var n,
          i,
          o = String(E(this)),
          s = void 0 === r ? Ar : r >>> 0;
      if (0 === s) return [];
      if (void 0 === t) return [o];
      if (!f(n = t) || !(void 0 !== (i = n[xr]) ? i : "RegExp" == rt(n))) return e.call(o, t, s);

      for (var a, u, l, c = [], h = (t.ignoreCase ? "i" : "") + (t.multiline ? "m" : "") + (t.unicode ? "u" : "") + (t.sticky ? "y" : ""), p = 0, g = new RegExp(t.source, h + "g"); (a = hr.call(g, o)) && !((u = g.lastIndex) > p && (c.push(o.slice(p, a.index)), a.length > 1 && a.index < o.length && wr.apply(c, a.slice(1)), l = a[0].length, p = u, c.length >= s));) {
        g.lastIndex === a.index && g.lastIndex++;
      }

      return p === o.length ? !l && g.test("") || c.push("") : c.push(o.slice(p)), c.length > s ? c.slice(0, s) : c;
    } : "0".split(void 0, 0).length ? function (t, r) {
      return void 0 === t && 0 === r ? [] : e.call(this, t, r);
    } : e, [function (e, r) {
      var i = E(this),
          o = null == e ? void 0 : e[t];
      return void 0 !== o ? o.call(e, i, r) : n.call(String(i), e, r);
    }, function (t, i) {
      var o = r(n, t, this, i, n !== e);
      if (o.done) return o.value;
      var s = v(t),
          a = String(this),
          u = br(s, RegExp),
          l = s.unicode,
          c = (s.ignoreCase ? "i" : "") + (s.multiline ? "m" : "") + (s.unicode ? "u" : "") + (kr ? "g" : "y"),
          h = new u(kr ? "^(?:" + s.source + ")" : s, c),
          p = void 0 === i ? Ar : i >>> 0;
      if (0 === p) return [];
      if (0 === a.length) return null === Cr(h, a) ? [a] : [];

      for (var f = 0, g = 0, d = []; g < a.length;) {
        h.lastIndex = kr ? 0 : g;

        var _,
            m = Cr(h, kr ? a.slice(g) : a);

        if (null === m || (_ = Or(pt(h.lastIndex + (kr ? g : 0)), a.length)) === f) g = Ir(a, g, l);else {
          if (d.push(a.slice(f, g)), d.length === p) return d;

          for (var y = 1; y <= m.length - 1; y++) {
            if (d.push(m[y]), d.length === p) return d;
          }

          g = f = _;
        }
      }

      return d.push(a.slice(f)), d;
    }];
  }, kr);

  var Tr = Math.floor,
      Pr = "".replace,
      Lr = /\$([$&'`]|\d{1,2}|<[^>]*>)/g,
      zr = /\$([$&'`]|\d{1,2})/g,
      jr = function jr(t, e, r, n, i, o) {
    var s = r + t.length,
        a = n.length,
        u = zr;
    return void 0 !== i && (i = I(i), u = Lr), Pr.call(o, u, function (o, u) {
      var l;

      switch (u.charAt(0)) {
        case "$":
          return "$";

        case "&":
          return t;

        case "`":
          return e.slice(0, r);

        case "'":
          return e.slice(s);

        case "<":
          l = i[u.slice(1, -1)];
          break;

        default:
          var c = +u;
          if (0 === c) return o;

          if (c > a) {
            var h = Tr(c / 10);
            return 0 === h ? o : h <= a ? void 0 === n[h - 1] ? u.charAt(1) : n[h - 1] + u.charAt(1) : o;
          }

          l = n[c - 1];
      }

      return void 0 === l ? "" : l;
    });
  },
      Rr = Math.max,
      Nr = Math.min;

  yr("replace", 2, function (t, e, r, n) {
    var i = n.REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE,
        o = n.REPLACE_KEEPS_$0,
        s = i ? "$" : "$0";
    return [function (r, n) {
      var i = E(this),
          o = null == r ? void 0 : r[t];
      return void 0 !== o ? o.call(r, i, n) : e.call(String(i), r, n);
    }, function (t, n) {
      if (!i && o || "string" == typeof n && -1 === n.indexOf(s)) {
        var a = r(e, t, this, n);
        if (a.done) return a.value;
      }

      var u = v(t),
          l = String(this),
          c = "function" == typeof n;
      c || (n = String(n));
      var h = u.global;

      if (h) {
        var p = u.unicode;
        u.lastIndex = 0;
      }

      for (var f = [];;) {
        var g = Cr(u, l);
        if (null === g) break;
        if (f.push(g), !h) break;
        "" === String(g[0]) && (u.lastIndex = Ir(l, pt(u.lastIndex), p));
      }

      for (var d, _ = "", m = 0, y = 0; y < f.length; y++) {
        g = f[y];

        for (var x = String(g[0]), S = Rr(Nr(ct(g.index), l.length), 0), b = [], M = 1; M < g.length; M++) {
          b.push(void 0 === (d = g[M]) ? d : String(d));
        }

        var E = g.groups;

        if (c) {
          var I = [x].concat(b, S, l);
          void 0 !== E && I.push(E);
          var C = String(n.apply(void 0, I));
        } else C = jr(x, l, S, b, E, n);

        S >= m && (_ += l.slice(m, S) + C, m = S + x.length);
      }

      return _ + l.slice(m);
    }];
  });

  var Br = function t() {
    !function (t, e) {
      for (var r in e.prototype) {
        t.prototype[r] = e.prototype[r];
      }
    }(t, google.maps.OverlayView);
  };

  function Zr(t) {
    return Object.keys(t).reduce(function (e, r) {
      return t[r] && e.push(r + ":" + t[r]), e;
    }, []).join(";");
  }

  function Dr(t) {
    return t ? t + "px" : void 0;
  }

  var Fr = function (t) {
    function e(e, r) {
      var n = t.call(this) || this;
      return n.cluster_ = e, n.styles_ = r, n.center_ = null, n.div_ = null, n.sums_ = null, n.visible_ = !1, n.style = null, n.setMap(e.getMap()), n;
    }

    return Xe(e, t), e.prototype.onAdd = function () {
      var t,
          e,
          r = this,
          n = this.cluster_.getMarkerClusterer(),
          i = google.maps.version.split("."),
          o = i[0],
          s = i[1],
          a = 100 * parseInt(o, 10) + parseInt(s, 10);
      this.div_ = document.createElement("div"), this.visible_ && this.show(), this.getPanes().overlayMouseTarget.appendChild(this.div_), this.boundsChangedListener_ = google.maps.event.addListener(this.getMap(), "bounds_changed", function () {
        e = t;
      }), google.maps.event.addDomListener(this.div_, "mousedown", function () {
        t = !0, e = !1;
      }), google.maps.event.addDomListener(this.div_, "contextmenu", function () {
        google.maps.event.trigger(n, "contextmenu", r.cluster_);
      }), a >= 332 && google.maps.event.addDomListener(this.div_, "touchstart", function (t) {
        t.stopPropagation();
      }), google.maps.event.addDomListener(this.div_, "click", function (i) {
        if (t = !1, !e) {
          if (google.maps.event.trigger(n, "click", r.cluster_), google.maps.event.trigger(n, "clusterclick", r.cluster_), n.getZoomOnClick()) {
            var o = n.getMaxZoom(),
                s = r.cluster_.getBounds();
            n.getMap().fitBounds(s), setTimeout(function () {
              n.getMap().fitBounds(s), null !== o && n.getMap().getZoom() > o && n.getMap().setZoom(o + 1);
            }, 100);
          }

          i.cancelBubble = !0, i.stopPropagation && i.stopPropagation();
        }
      }), google.maps.event.addDomListener(this.div_, "mouseover", function () {
        google.maps.event.trigger(n, "mouseover", r.cluster_);
      }), google.maps.event.addDomListener(this.div_, "mouseout", function () {
        google.maps.event.trigger(n, "mouseout", r.cluster_);
      });
    }, e.prototype.onRemove = function () {
      this.div_ && this.div_.parentNode && (this.hide(), google.maps.event.removeListener(this.boundsChangedListener_), google.maps.event.clearInstanceListeners(this.div_), this.div_.parentNode.removeChild(this.div_), this.div_ = null);
    }, e.prototype.draw = function () {
      if (this.visible_) {
        var t = this.getPosFromLatLng_(this.center_);
        this.div_.style.top = t.y + "px", this.div_.style.left = t.x + "px";
      }
    }, e.prototype.hide = function () {
      this.div_ && (this.div_.style.display = "none"), this.visible_ = !1;
    }, e.prototype.show = function () {
      this.div_ && (this.div_.className = this.className_, this.div_.style.cssText = this.createCss_(this.getPosFromLatLng_(this.center_)), this.div_.innerHTML = (this.style.url ? this.getImageElementHtml() : "") + this.getLabelDivHtml(), void 0 === this.sums_.title || "" === this.sums_.title ? this.div_.title = this.cluster_.getMarkerClusterer().getTitle() : this.div_.title = this.sums_.title, this.div_.style.display = ""), this.visible_ = !0;
    }, e.prototype.getLabelDivHtml = function () {
      return '\n<div aria-label="' + this.cluster_.getMarkerClusterer().ariaLabelFn(this.sums_.text) + '" style="' + Zr({
        position: "absolute",
        top: Dr(this.anchorText_[0]),
        left: Dr(this.anchorText_[1]),
        color: this.style.textColor,
        "font-size": Dr(this.style.textSize),
        "font-family": this.style.fontFamily,
        "font-weight": this.style.fontWeight,
        "font-style": this.style.fontStyle,
        "text-decoration": this.style.textDecoration,
        "text-align": "center",
        width: Dr(this.style.width),
        "line-height": Dr(this.style.textLineHeight)
      }) + '" tabindex="0">\n  <span aria-hidden="true">' + this.sums_.text + "</span>\n</div>\n";
    }, e.prototype.getImageElementHtml = function () {
      var t = (this.style.backgroundPosition || "0 0").split(" "),
          e = parseInt(t[0].replace(/^\s+|\s+$/g, ""), 10),
          r = parseInt(t[1].replace(/^\s+|\s+$/g, ""), 10),
          n = {};
      if (this.cluster_.getMarkerClusterer().getEnableRetinaIcons()) n = {
        width: Dr(this.style.width),
        height: Dr(this.style.height)
      };else {
        var i = [-1 * r, -1 * e + this.style.width, -1 * r + this.style.height, -1 * e];
        n = {
          clip: "rect(" + i[0] + "px, " + i[1] + "px, " + i[2] + "px, " + i[3] + "px)"
        };
      }
      var o = this.sums_.url ? {
        width: "100%",
        height: "100%"
      } : {},
          s = Zr(_qe(_qe({
        position: "absolute",
        top: Dr(r),
        left: Dr(e)
      }, n), o));
      return '<img alt="' + this.sums_.text + '" aria-hidden="true" src="' + this.style.url + '" style="' + s + '"/>';
    }, e.prototype.useStyle = function (t) {
      this.sums_ = t;
      var e = Math.max(0, t.index - 1);
      e = Math.min(this.styles_.length - 1, e), this.style = this.sums_.url ? _qe(_qe({}, this.styles_[e]), {
        url: this.sums_.url
      }) : this.styles_[e], this.anchorText_ = this.style.anchorText || [0, 0], this.anchorIcon_ = this.style.anchorIcon || [Math.floor(this.style.height / 2), Math.floor(this.style.width / 2)], this.className_ = this.cluster_.getMarkerClusterer().getClusterClass() + " " + (this.style.className || "cluster-" + e);
    }, e.prototype.setCenter = function (t) {
      this.center_ = t;
    }, e.prototype.createCss_ = function (t) {
      return Zr({
        "z-index": "" + this.cluster_.getMarkerClusterer().getZIndex(),
        top: Dr(t.y),
        left: Dr(t.x),
        width: Dr(this.style.width),
        height: Dr(this.style.height),
        cursor: "pointer",
        position: "absolute",
        "-webkit-user-select": "none",
        "-khtml-user-select": "none",
        "-moz-user-select": "none",
        "-o-user-select": "none",
        "user-select": "none"
      });
    }, e.prototype.getPosFromLatLng_ = function (t) {
      var e = this.getProjection().fromLatLngToDivPixel(t);
      return e.x = Math.floor(e.x - this.anchorIcon_[1]), e.y = Math.floor(e.y - this.anchorIcon_[0]), e;
    }, e;
  }(Br),
      Hr = function () {
    function t(t) {
      this.markerClusterer_ = t, this.map_ = this.markerClusterer_.getMap(), this.minClusterSize_ = this.markerClusterer_.getMinimumClusterSize(), this.averageCenter_ = this.markerClusterer_.getAverageCenter(), this.markers_ = [], this.center_ = null, this.bounds_ = null, this.clusterIcon_ = new Fr(this, this.markerClusterer_.getStyles());
    }

    return t.prototype.getSize = function () {
      return this.markers_.length;
    }, t.prototype.getMarkers = function () {
      return this.markers_;
    }, t.prototype.getCenter = function () {
      return this.center_;
    }, t.prototype.getMap = function () {
      return this.map_;
    }, t.prototype.getMarkerClusterer = function () {
      return this.markerClusterer_;
    }, t.prototype.getBounds = function () {
      for (var t = new google.maps.LatLngBounds(this.center_, this.center_), e = this.getMarkers(), r = 0; r < e.length; r++) {
        t.extend(e[r].getPosition());
      }

      return t;
    }, t.prototype.remove = function () {
      this.clusterIcon_.setMap(null), this.markers_ = [], delete this.markers_;
    }, t.prototype.addMarker = function (t) {
      if (this.isMarkerAlreadyAdded_(t)) return !1;

      if (this.center_) {
        if (this.averageCenter_) {
          var e = this.markers_.length + 1,
              r = (this.center_.lat() * (e - 1) + t.getPosition().lat()) / e,
              n = (this.center_.lng() * (e - 1) + t.getPosition().lng()) / e;
          this.center_ = new google.maps.LatLng(r, n), this.calculateBounds_();
        }
      } else this.center_ = t.getPosition(), this.calculateBounds_();

      t.isAdded = !0, this.markers_.push(t);
      var i = this.markers_.length,
          o = this.markerClusterer_.getMaxZoom();
      if (null !== o && this.map_.getZoom() > o) t.getMap() !== this.map_ && t.setMap(this.map_);else if (i < this.minClusterSize_) t.getMap() !== this.map_ && t.setMap(this.map_);else if (i === this.minClusterSize_) for (var s = 0; s < i; s++) {
        this.markers_[s].setMap(null);
      } else t.setMap(null);
      return !0;
    }, t.prototype.isMarkerInClusterBounds = function (t) {
      return this.bounds_.contains(t.getPosition());
    }, t.prototype.calculateBounds_ = function () {
      var t = new google.maps.LatLngBounds(this.center_, this.center_);
      this.bounds_ = this.markerClusterer_.getExtendedBounds(t);
    }, t.prototype.updateIcon = function () {
      var t = this.markers_.length,
          e = this.markerClusterer_.getMaxZoom();
      if (null !== e && this.map_.getZoom() > e) this.clusterIcon_.hide();else if (t < this.minClusterSize_) this.clusterIcon_.hide();else {
        var r = this.markerClusterer_.getStyles().length,
            n = this.markerClusterer_.getCalculator()(this.markers_, r);
        this.clusterIcon_.setCenter(this.center_), this.clusterIcon_.useStyle(n), this.clusterIcon_.show();
      }
    }, t.prototype.isMarkerAlreadyAdded_ = function (t) {
      if (this.markers_.indexOf) return -1 !== this.markers_.indexOf(t);

      for (var e = 0; e < this.markers_.length; e++) {
        if (t === this.markers_[e]) return !0;
      }

      return !1;
    }, t;
  }(),
      Ur = function Ur(t, e, r) {
    return void 0 !== t[e] ? t[e] : r;
  };

  return function (t) {
    function e(r, n, i) {
      void 0 === n && (n = []), void 0 === i && (i = {});
      var o = t.call(this) || this;
      return o.options = i, o.markers_ = [], o.clusters_ = [], o.listeners_ = [], o.activeMap_ = null, o.ready_ = !1, o.ariaLabelFn = o.options.ariaLabelFn || function () {
        return "";
      }, o.zIndex_ = o.options.zIndex || Number(google.maps.Marker.MAX_ZINDEX) + 1, o.gridSize_ = o.options.gridSize || 60, o.minClusterSize_ = o.options.minimumClusterSize || 2, o.maxZoom_ = o.options.maxZoom || null, o.styles_ = o.options.styles || [], o.title_ = o.options.title || "", o.zoomOnClick_ = Ur(o.options, "zoomOnClick", !0), o.averageCenter_ = Ur(o.options, "averageCenter", !1), o.ignoreHidden_ = Ur(o.options, "ignoreHidden", !1), o.enableRetinaIcons_ = Ur(o.options, "enableRetinaIcons", !1), o.imagePath_ = o.options.imagePath || e.IMAGE_PATH, o.imageExtension_ = o.options.imageExtension || e.IMAGE_EXTENSION, o.imageSizes_ = o.options.imageSizes || e.IMAGE_SIZES, o.calculator_ = o.options.calculator || e.CALCULATOR, o.batchSize_ = o.options.batchSize || e.BATCH_SIZE, o.batchSizeIE_ = o.options.batchSizeIE || e.BATCH_SIZE_IE, o.clusterClass_ = o.options.clusterClass || "cluster", -1 !== navigator.userAgent.toLowerCase().indexOf("msie") && (o.batchSize_ = o.batchSizeIE_), o.setupStyles_(), o.addMarkers(n, !0), o.setMap(r), o;
    }

    return Xe(e, t), e.prototype.onAdd = function () {
      var t = this;
      this.activeMap_ = this.getMap(), this.ready_ = !0, this.repaint(), this.prevZoom_ = this.getMap().getZoom(), this.listeners_ = [google.maps.event.addListener(this.getMap(), "zoom_changed", function () {
        var e = t.getMap(),
            r = e.minZoom || 0,
            n = Math.min(e.maxZoom || 100, e.mapTypes[e.getMapTypeId()].maxZoom),
            i = Math.min(Math.max(t.getMap().getZoom(), r), n);
        t.prevZoom_ != i && (t.prevZoom_ = i, t.resetViewport_(!1));
      }), google.maps.event.addListener(this.getMap(), "idle", function () {
        t.redraw_();
      })];
    }, e.prototype.onRemove = function () {
      for (var t = 0; t < this.markers_.length; t++) {
        this.markers_[t].getMap() !== this.activeMap_ && this.markers_[t].setMap(this.activeMap_);
      }

      for (t = 0; t < this.clusters_.length; t++) {
        this.clusters_[t].remove();
      }

      this.clusters_ = [];

      for (t = 0; t < this.listeners_.length; t++) {
        google.maps.event.removeListener(this.listeners_[t]);
      }

      this.listeners_ = [], this.activeMap_ = null, this.ready_ = !1;
    }, e.prototype.draw = function () {}, e.prototype.setupStyles_ = function () {
      if (!(this.styles_.length > 0)) for (var t = 0; t < this.imageSizes_.length; t++) {
        var r = this.imageSizes_[t];
        this.styles_.push(e.withDefaultStyle({
          url: this.imagePath_ + (t + 1) + "." + this.imageExtension_,
          height: r,
          width: r
        }));
      }
    }, e.prototype.fitMapToMarkers = function (t) {
      for (var e = this.getMarkers(), r = new google.maps.LatLngBounds(), n = 0; n < e.length; n++) {
        !e[n].getVisible() && this.getIgnoreHidden() || r.extend(e[n].getPosition());
      }

      this.getMap().fitBounds(r, t);
    }, e.prototype.getGridSize = function () {
      return this.gridSize_;
    }, e.prototype.setGridSize = function (t) {
      this.gridSize_ = t;
    }, e.prototype.getMinimumClusterSize = function () {
      return this.minClusterSize_;
    }, e.prototype.setMinimumClusterSize = function (t) {
      this.minClusterSize_ = t;
    }, e.prototype.getMaxZoom = function () {
      return this.maxZoom_;
    }, e.prototype.setMaxZoom = function (t) {
      this.maxZoom_ = t;
    }, e.prototype.getZIndex = function () {
      return this.zIndex_;
    }, e.prototype.setZIndex = function (t) {
      this.zIndex_ = t;
    }, e.prototype.getStyles = function () {
      return this.styles_;
    }, e.prototype.setStyles = function (t) {
      this.styles_ = t;
    }, e.prototype.getTitle = function () {
      return this.title_;
    }, e.prototype.setTitle = function (t) {
      this.title_ = t;
    }, e.prototype.getZoomOnClick = function () {
      return this.zoomOnClick_;
    }, e.prototype.setZoomOnClick = function (t) {
      this.zoomOnClick_ = t;
    }, e.prototype.getAverageCenter = function () {
      return this.averageCenter_;
    }, e.prototype.setAverageCenter = function (t) {
      this.averageCenter_ = t;
    }, e.prototype.getIgnoreHidden = function () {
      return this.ignoreHidden_;
    }, e.prototype.setIgnoreHidden = function (t) {
      this.ignoreHidden_ = t;
    }, e.prototype.getEnableRetinaIcons = function () {
      return this.enableRetinaIcons_;
    }, e.prototype.setEnableRetinaIcons = function (t) {
      this.enableRetinaIcons_ = t;
    }, e.prototype.getImageExtension = function () {
      return this.imageExtension_;
    }, e.prototype.setImageExtension = function (t) {
      this.imageExtension_ = t;
    }, e.prototype.getImagePath = function () {
      return this.imagePath_;
    }, e.prototype.setImagePath = function (t) {
      this.imagePath_ = t;
    }, e.prototype.getImageSizes = function () {
      return this.imageSizes_;
    }, e.prototype.setImageSizes = function (t) {
      this.imageSizes_ = t;
    }, e.prototype.getCalculator = function () {
      return this.calculator_;
    }, e.prototype.setCalculator = function (t) {
      this.calculator_ = t;
    }, e.prototype.getBatchSizeIE = function () {
      return this.batchSizeIE_;
    }, e.prototype.setBatchSizeIE = function (t) {
      this.batchSizeIE_ = t;
    }, e.prototype.getClusterClass = function () {
      return this.clusterClass_;
    }, e.prototype.setClusterClass = function (t) {
      this.clusterClass_ = t;
    }, e.prototype.getMarkers = function () {
      return this.markers_;
    }, e.prototype.getTotalMarkers = function () {
      return this.markers_.length;
    }, e.prototype.getClusters = function () {
      return this.clusters_;
    }, e.prototype.getTotalClusters = function () {
      return this.clusters_.length;
    }, e.prototype.addMarker = function (t, e) {
      this.pushMarkerTo_(t), e || this.redraw_();
    }, e.prototype.addMarkers = function (t, e) {
      for (var r in t) {
        Object.prototype.hasOwnProperty.call(t, r) && this.pushMarkerTo_(t[r]);
      }

      e || this.redraw_();
    }, e.prototype.pushMarkerTo_ = function (t) {
      var e = this;
      t.getDraggable() && google.maps.event.addListener(t, "dragend", function () {
        e.ready_ && (t.isAdded = !1, e.repaint());
      }), t.isAdded = !1, this.markers_.push(t);
    }, e.prototype.removeMarker = function (t, e) {
      var r = this.removeMarker_(t);
      return !e && r && this.repaint(), r;
    }, e.prototype.removeMarkers = function (t, e) {
      for (var r = !1, n = 0; n < t.length; n++) {
        var i = this.removeMarker_(t[n]);
        r = r || i;
      }

      return !e && r && this.repaint(), r;
    }, e.prototype.removeMarker_ = function (t) {
      var e = -1;
      if (this.markers_.indexOf) e = this.markers_.indexOf(t);else for (var r = 0; r < this.markers_.length; r++) {
        if (t === this.markers_[r]) {
          e = r;
          break;
        }
      }
      return -1 !== e && (t.setMap(null), this.markers_.splice(e, 1), !0);
    }, e.prototype.clearMarkers = function () {
      this.resetViewport_(!0), this.markers_ = [];
    }, e.prototype.repaint = function () {
      var t = this.clusters_.slice();
      this.clusters_ = [], this.resetViewport_(!1), this.redraw_(), setTimeout(function () {
        for (var e = 0; e < t.length; e++) {
          t[e].remove();
        }
      }, 0);
    }, e.prototype.getExtendedBounds = function (t) {
      var e = this.getProjection(),
          r = new google.maps.LatLng(t.getNorthEast().lat(), t.getNorthEast().lng()),
          n = new google.maps.LatLng(t.getSouthWest().lat(), t.getSouthWest().lng()),
          i = e.fromLatLngToDivPixel(r);
      i.x += this.gridSize_, i.y -= this.gridSize_;
      var o = e.fromLatLngToDivPixel(n);
      o.x -= this.gridSize_, o.y += this.gridSize_;
      var s = e.fromDivPixelToLatLng(i),
          a = e.fromDivPixelToLatLng(o);
      return t.extend(s), t.extend(a), t;
    }, e.prototype.redraw_ = function () {
      this.createClusters_(0);
    }, e.prototype.resetViewport_ = function (t) {
      for (var e = 0; e < this.clusters_.length; e++) {
        this.clusters_[e].remove();
      }

      this.clusters_ = [];

      for (e = 0; e < this.markers_.length; e++) {
        var r = this.markers_[e];
        r.isAdded = !1, t && r.setMap(null);
      }
    }, e.prototype.distanceBetweenPoints_ = function (t, e) {
      var r = (e.lat() - t.lat()) * Math.PI / 180,
          n = (e.lng() - t.lng()) * Math.PI / 180,
          i = Math.sin(r / 2) * Math.sin(r / 2) + Math.cos(t.lat() * Math.PI / 180) * Math.cos(e.lat() * Math.PI / 180) * Math.sin(n / 2) * Math.sin(n / 2);
      return 6371 * (2 * Math.atan2(Math.sqrt(i), Math.sqrt(1 - i)));
    }, e.prototype.isMarkerInBounds_ = function (t, e) {
      return e.contains(t.getPosition());
    }, e.prototype.addToClosestCluster_ = function (t) {
      for (var e = 4e4, r = null, n = 0; n < this.clusters_.length; n++) {
        var i,
            o = (i = this.clusters_[n]).getCenter();

        if (o) {
          var s = this.distanceBetweenPoints_(o, t.getPosition());
          s < e && (e = s, r = i);
        }
      }

      r && r.isMarkerInClusterBounds(t) ? r.addMarker(t) : ((i = new Hr(this)).addMarker(t), this.clusters_.push(i));
    }, e.prototype.createClusters_ = function (t) {
      var e = this;

      if (this.ready_) {
        var r;
        0 === t && (google.maps.event.trigger(this, "clusteringbegin", this), void 0 !== this.timerRefStatic && (clearTimeout(this.timerRefStatic), delete this.timerRefStatic)), r = this.getMap().getZoom() > 3 ? new google.maps.LatLngBounds(this.getMap().getBounds().getSouthWest(), this.getMap().getBounds().getNorthEast()) : new google.maps.LatLngBounds(new google.maps.LatLng(85.02070771743472, -178.48388434375), new google.maps.LatLng(-85.08136444384544, 178.00048865625));

        for (var n = this.getExtendedBounds(r), i = Math.min(t + this.batchSize_, this.markers_.length), o = t; o < i; o++) {
          var s = this.markers_[o];
          !s.isAdded && this.isMarkerInBounds_(s, n) && (!this.ignoreHidden_ || this.ignoreHidden_ && s.getVisible()) && this.addToClosestCluster_(s);
        }

        if (i < this.markers_.length) this.timerRefStatic = window.setTimeout(function () {
          e.createClusters_(i);
        }, 0);else {
          delete this.timerRefStatic, google.maps.event.trigger(this, "clusteringend", this);

          for (o = 0; o < this.clusters_.length; o++) {
            this.clusters_[o].updateIcon();
          }
        }
      }
    }, e.CALCULATOR = function (t, e) {
      for (var r = 0, n = t.length, i = n; 0 !== i;) {
        i = Math.floor(i / 10), r++;
      }

      return r = Math.min(r, e), {
        text: n.toString(),
        index: r,
        title: ""
      };
    }, e.withDefaultStyle = function (t) {
      return _qe({
        textColor: "black",
        textSize: 11,
        textDecoration: "none",
        textLineHeight: t.height,
        fontWeight: "bold",
        fontStyle: "normal",
        fontFamily: "Arial,sans-serif",
        backgroundPosition: "0 0"
      }, t);
    }, e.BATCH_SIZE = 2e3, e.BATCH_SIZE_IE = 500, e.IMAGE_PATH = "../images/m", e.IMAGE_EXTENSION = "png", e.IMAGE_SIZES = [53, 56, 66, 78, 90], e;
  }(Br);
}();
'use strict';

window.LocatorMap = function () {
  var IMAGE_PATH = '/content/dam/global-images';
  var ICON_PATH = "".concat(IMAGE_PATH, "/map-pin.png");
  var HOVER_ICON_PATH = "".concat(IMAGE_PATH, "/map-pin-hover.png");
  var DEFAULT_LINE_OPTIONS = {
      strokeColor: 'gray',
      strokeOpacity: 0.5,
      strokeWeight: 4
  };
  var HIGHLIGHT_LINE_OPTIONS = {
      strokeColor: 'blue',
      strokeOpacity: 0.6,
      strokeWeight: 6
  };
  var opts, $loadingIndicator;
  var gmap, mel;
  var markerBounds,
      markers = [];
  var _private = {
    init: function init() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      opts = options; // Clear previous markers, if any:

      _private.hideAllMarkers();

      markers = []; // Ensure we have legit map object:

      if (!gmap) {
        gmap = new google.maps.Map($('#map').get(0), {
        disableDefaultUI: true,
        zoomControl: true,
        maxZoom: 17,
        styles: [{
          featureType: "poi.business",
          stylers: [{
            visibility: "off"
          }]
        }, {
          featureType: "transit",
          elementType: "labels.icon",
          stylers: [{
            visibility: "off"
          }]
        }]
      });
        mel = google.maps.event.addListener(gmap, 'dragend', _private.getDragResultUpdate);
        $loadingIndicator = $('.loading-indicator');
      }

      if (opts.viewport) {
        // iff viewport provided, set initial map view
        gmap.fitBounds(opts.viewport);
        gmap.setZoom(gmap.getZoom() * 1.2); // we need a fudge factor here 'cause returned viewports for states are too big
      }
    },
    getDragResultUpdate: function getDragResultUpdate() {
        $loadingIndicator.show();

      _private.hideAllMarkers();

      opts.dragendCallback && opts.dragendCallback(gmap.getCenter().toJSON()).catch(function (err) {
        return err.code == 'OVER_QUERY_LIMIT' && mel.remove();
      });
    },
    createMarker: function createMarker(lat, lng) {
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      // The marker itself:
      var pos = new google.maps.LatLng(lat, lng);
      var markerOptions = {
        position: pos,
        title: options.title
      };

      switch (options.mode) {
        case 'STATE':
          var symbol = {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#7C6992',
            fillOpacity: 1,
            strokeWeight: 0,
            scale: 12
          };
          Object.assign(markerOptions, {
            icon: symbol,
            originalIcon: symbol,
            hoverIcon: symbol
          });
          options.label && (markerOptions.label = {
            text: options.label,
        color: 'white'
      });
          break;

        default:
          Object.assign(markerOptions, {
            icon: ICON_PATH,
            originalIcon: ICON_PATH,
            hoverIcon: HOVER_ICON_PATH
        });
          options.label && (markerOptions.label = {
            text: options.label,
            color: 'white'
        });
      }

      var marker = new google.maps.Marker(markerOptions);
      markers.push(marker); // Event handlers:

      options.$item && google.maps.event.addListener(marker, 'click', function (ev) {
        ev.domEvent.target.setAttribute('alt', options.title); // $( '.gm-style div' ).removeAttr( 'title' );

        return options.$item.trigger('marker');
      });
      google.maps.event.addListener(marker, 'mouseover', function (ev) {
        ev.domEvent.target.setAttribute('alt', options.title);
        this.setIcon(this.hoverIcon); // $( '.gm-style div' ).removeAttr( 'title' );
      });
      google.maps.event.addListener(marker, 'mouseout', function (ev) {
        ev.domEvent.target.setAttribute('alt', options.title);
        this.setIcon(this.originalIcon); // $( '.gm-style div' ).removeAttr( 'title' );
      });
    },
    showMarkerSlice: function showMarkerSlice(start, end) {
      // TODO: CONSIDER ESTABISHING MULTIPLE COLLECTIONS OF MARKERS (AND/OR MARKERBOUNDS) CORRELATING TO EACH EXPANSION OF CARD LIST, SO WE DON'T HAVE TO RECOMPUTE HERE EACH TIME
      markerBounds = new google.maps.LatLngBounds();
      markers.forEach(function (marker, i) {
      if (!marker) return;
        var show = start <= i && i < end;
        marker.setMap(show ? gmap : null);
        show && markerBounds.extend(marker.getPosition());
      });

      _private.rebound();
    },
    hideAllMarkers: function hideAllMarkers(i) {
      _private.showMarkerSlice(0, 0);
    },
    markerTrigger: function markerTrigger() {
      var i = $(this).data('ord') - 1;
      google.maps.event.trigger(markers[i], 'click');
    },
    clusterMarkers: function clusterMarkers() {
      // TODO: IF WE RE-FACTOR MARKER CREATION AND SHOWING AS SUGGESTED ABOVE, WE CAN UTILIZE BOUNDS FOR LARGEST COLLECTION HERE TOO
      if (!markers.length) return;
      markerBounds = new google.maps.LatLngBounds();
      markers.forEach(function (marker) {
        return markerBounds.extend(marker.getPosition());
      });

      _private.rebound();

      new MarkerClusterer(gmap, markers, {
        averageCenter: true,
        styles: [{
          width: 30,
          height: 30,
          className: 'cluster-marker',
          anchorText: [5, 0]
        }],
        calculator: function calculator(markers) {
          var reducer = function reducer(sum, marker) {
            return sum + (parseInt(marker.getLabel().text) || 0);
          };

          var locationCount = markers.reduce(reducer, 0);
          return {
            text: String(locationCount),
            index: 1
          };
        }
      });
    },
    route: function () {
      var ready = false;
      var directionsService;
      var textDirectionsRenderer;
      var altRoutesRenderers = [];
      var intervals = [];
      var $directionsPanel, $routePickers, $routePanels;

      function init() {
        gmap || _private.init();
        directionsService = new google.maps.DirectionsService();
        $directionsPanel = $('#auto-direction');
        textDirectionsRenderer = new google.maps.DirectionsRenderer({
          panel: $directionsPanel.get(0)
        });
        setTimeout(function () {
          // TODO: find a better way...
          var $directionPanelTable = $directionsPanel.children().children().children().find('.adp-directions');
          $directionPanelTable.attr('role', 'list');
          $directionPanelTable.find('tbody >tr').attr("role", "listitem");
        }, 2000);
        $routePanels = $('.js-pickers');
        CommonUtils.initClickChain($routePanels, '>span', handleSelectRoute);
        CommonUtils.initClickChain($routePanels, '.js-toggle-details', toggleDetails);
        ready = true;
      }

      function route(origin, destination) {
        ready || init();
        $directionsPanel.empty();
        $routePanels.empty();
        var request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.DirectionsTravelMode.DRIVING,
        provideRouteAlternatives: true
      };
        directionsService.route(request, handleRouteResponse);
        }

      function handleRouteResponse(response, status) {
        if (status != google.maps.DirectionsStatus.OK) {
          return;
        }

        textDirectionsRenderer.setOptions({
          directions: response
        }); // TODO: need to associate this w/ map after all, so that click on item in directions panel can be shown at corresponding map location -- so let's reconsider handling of alt routes vs currently selected...

        var routes = response.routes;
        altRoutesRenderers.forEach(function (dr) {
          return dr.setMap(null);
        });
        markerBounds = new google.maps.LatLngBounds();
        altRoutesRenderers = routes.map(function (route, i) {
          markerBounds.union(route.bounds);
          return new google.maps.DirectionsRenderer({
          map: gmap,
          directions: response,
          routeIndex: i,
            polylineOptions: DEFAULT_LINE_OPTIONS,
            markerOptions: {
              visible: i == 0
            }
          });
        });
        intervals.push(setInterval(initHandleSelectRoute, 750, routes)); // TODO: IS THIS REALLY BEST WAY?
      }

      function initHandleSelectRoute(routes) {
        var $routeClickers = routes.length == 1 ? $directionsPanel.find('div[data-leg-index]') : $directionsPanel.find('td[data-route-index]');
        if (!$routeClickers.length) return;

        while (intervals.length) {
        clearInterval(intervals.pop());
        }

        $routePickers = $();
        routes.forEach(function (rte, i) {
          var leg = rte.legs[0];
          var minutes = Math.round(leg.duration.value / 60);
          var davis = leg.distance.value / 1609.344;
          var content = [rte.summary, Math.round(davis * 10) / 10, minutes ? "".concat(minutes, " min") : '', i == 0 ? 'Best route now due to traffic conditions' : ' ']; 
          $routePickers = $routePickers.add($('.js-cloners >span.adp-listinfo').clone().data('voodoo', $routeClickers.eq(i)).data('index', i).html(function (i, was) {
            return CommonUtils.fillTemplate(was, content);
          }));
        });
        $routePickers.first().one('click', handleSelectRoute).click();
      }

      function toggleDetails(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var $me = $(this);
        $me.closest('.adp-listinfo').click();
        $me.closest('.js-details-wrapper').toggleClass('js-details-expanded', $me.hasClass('expand-details'));
        $me.siblings().focus();
      }

      function handleSelectRoute() {
        var $me = $(this);
        var index = $me.data('index');
        var $below = $routePickers.filter(function (i) {
          return i > index;
        });
        var $above = $routePickers.not($below);
        $me.data('voodoo').click();
        $directionsPanel.prev().append($above);
        $directionsPanel.next().append($below);
        highlightRoute(index);
      }

      function highlightRoute(routeIndex) {
        altRoutesRenderers.forEach(function (rr, i) {
          return rr.setOptions({
          map: gmap,
            polylineOptions: i == routeIndex ? HIGHLIGHT_LINE_OPTIONS : DEFAULT_LINE_OPTIONS
          });
        });
        setTimeout(function () {
          return $('#map').find('[aria-label="Map"] div[role="button"] img').attr('alt', 'address direction');
        }, 1500);
      }

      return route;
    }(),
    rebound: function rebound() {
      markerBounds && (markerBounds.isEmpty() || gmap.fitBounds(markerBounds));
    }
  };
  var _public = {
    init: _private.init,
    createMarker: _private.createMarker,
    showMarkerSlice: _private.showMarkerSlice,
    hideAllMarkers: _private.hideAllMarkers,
    markerTrigger: _private.markerTrigger,
    clusterMarkers: _private.clusterMarkers,
    route: _private.route,
    rebound: _private.rebound
  };
  return _public;
}();
'use strict';
/*
NOTES:
- In some cases, we reference object members as ['name'] rather than .name because the latter trips up YUI compressor.
- TODO: reassess scoping of *everything*
*/

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

window.Locator = function () {
  var AUTHOR_MODE = /^(cms|localhost)/.test(location.hostname); // TODO: surely there is a better way to check this?

  var EDIT_MODE = /^\/editor\.html\//.test(top.location.pathname);
  var LOCATOR_HOME_PATH = '/locations';
  var DISPLAY_MODE_ATTR = 'data-mode';
  var RESULTS_MODE = 'results';
  var NO_RESULTS_MODE = 'noresults';
  var WAITING_MODE = 'waiting';
  var CITY_LIST_MODE = 'city-list';
  var BASE_PARAMS = {
    // sensible defaults, I think...
    returnBranchATMStatus: 'Y',
    maxResults: 100
  };
  var PAGE_URL = new URL(location);
  var trgUrl = new URL(location); // may be manipulated later, whereas PAGE_URL is constant

  var urlRecheck = false;
  var $cmp, $innerCmp, $filterFormContainer, $filterForm;
  var filterParams = LocatorUtils.safeParse(sessionStorage.getItem('locatorFilters'));
  var applyFilter = false;
  var searchButtonClick = false;
  var filterButtonClick = false;
  var lmu = LocatorMobileUtils();
  var $resultListWrapper, $resultList, $loadMoreButton, $showLessButton;
  var blockSize = 15; // default in case the component doesn't provide a value
  //===\/\/\/=== CITY LIST ===\/\/\/===   (TODO: factor out "CITY LIST" parts into a separate source file)

  var ST_CITY_RGX = new RegExp('/(branch|atm)/([a-z]{2})(/([\\w\\-\\s]+))?(/([0-9]{5}))?/?$');
  var TYPE_REPLACE_RGX = new RegExp('(//.*?/).*?/');
  var $cityWrapper = $();
  var $cityLinks = $(); //===/\/\/\=== CITY LIST ===/\/\/\===
  //---------------------------------------

  var _private = {
    //---------------------------------------
    //--- INIT/SETUP ---
    init: function init() {
      // Contain yourself!
      $cmp = $('.branch-locator-component').first(); // TODO: use site-wide component helper instead

      $cmp.find('a[data-href]').attr('href', function () {
        return $(this).data('href');
      }); // needful because some clonable elements use numeric placeholders which would trigger removal by link checker if place directly in href

      $innerCmp = $cmp.find('.locator-component');
      AUTHOR_MODE && trgUrl.searchParams.set('wcmmode', 'disabled'); // Analytics:

      if ($cmp.find('.statelist-content')[0]) {
        var cdata = {};
 		    var urlpath = window.location.pathname;
        urlpath = urlpath.replace(/\//g, '|').replace(/-/g, '_');
        cdata.pageName = "truist|com" + urlpath;
        var searchterm = urlpath.split('|').pop();
             cdata.locatorSearchTerm = searchterm; // capture the search term

             cdata.locatorSearchType = "locator_search"; //capture the search type

             cdata.events = "event78"; // All branch locator searches

           marTech.trackState(cdata);
      } // Result list event handling:


      $resultListWrapper = $cmp.find('.result-list-item-view >.resultlist-index');
      $resultListWrapper.on('marker', '.card', _private.handleMarker); // delegated custom event handler!

      lmu.init($resultListWrapper, 'a.get-direction');
      CommonUtils.initClickChain($resultListWrapper, 'a.detail-button, a.get-direction, a.js-detail-link', _private.handleGetDirection);
      CommonUtils.initClickChain($resultListWrapper, '.see-more-accordion a', _private.seeMoreToggle);
      CommonUtils.initClickChain($resultListWrapper, '.js-location-status', _private.openStatusModal);
      CommonUtils.initClickChain($resultListWrapper, '.js-location-status-msg', function (ev) {
        return ev.stopPropagation();
      });
      CommonUtils.initClickChain($resultListWrapper, '.closed-popup-close-icon', function () {
        return $(document).click();
      });
      blockSize = parseInt($resultListWrapper.data('block-size')) || blockSize;
      $loadMoreButton = $cmp.find('.load-more-button >a').click(function (ev) {
        ev.preventDefault();

        _private.reveal(1);
      });
      $showLessButton = $cmp.find('.show-less-button >a').click(function (ev) {
        ev.preventDefault();

        _private.reveal(-1);
      }); // Filter form event handling:

      $filterFormContainer = $('.filter-popup-container');
      $filterForm = $filterFormContainer.find('>form');
      $cmp.find('.google-search-button').click(function () {
        searchButtonClick = true;
      });
      var $locationType = $filterForm.find('input[name="locationType"]').click(_private.handleLocationTypeChange);
      $filterForm.find('.flex-format-container ul li').on('keyup focusin', _private.handleServiceKeyupEvent).on('keydown focusout', _private.handleServicefocusEvent);
      $filterForm.find('.filter-popup-close-icon svg').on('click keydown', _private.closeFilterPopup);
      $filterForm.find('.filter-popup-close-icon svg').on('keydown', _private.closeFilterFocus);
      $filterForm.find('.reset-filter >a').click(_private.handleReset);
      $filterForm.find('button').click(_private.handleApplyFilters);
      $filterForm.find('button').on('keydown', _private.handleApplyKeydowFilter); // Also:

      $('.get-filter-location').click(_private.filterClosePopupEvent);
      $('#show-filter').click(_private.filterPopupEvent);
      $('.map-view-toggle').on('click', _private.mapViewToggle);
      $('.back-view-toggle').on('click', _private.listViewToggle);
      $(window).resize(_private.toggleMapListButton); // Initialize filters:

      Object.keys(filterParams).forEach(function (key) {
        // TODO: write a more robust version of this (handling all input types, etc), and place in CommonUtils (or similar shared library)
        var nameSelector = "[name=".concat(key, "]");
        var values = filterParams[key].split(',');
        values.forEach(function (value) {
          $filterForm.find("input".concat(nameSelector, "[value=\"").concat(value, "\"]")).click();
          $filterForm.find("select".concat(nameSelector)).val(value);
        });
      }); // Gather info re: footprint states:

      var footprint = $('#cloners >#footprint >span').get().reduce(function (acc, tag) {
        var $tag = $(tag);
        acc[$tag.data('name')] = acc[$tag.data('abbr')] = $tag.data();
        return acc;
      }, {}); //===\/\/\/=== CITY LIST ===\/\/\/===

      var parts = decodeURI(PAGE_URL.pathname).match(ST_CITY_RGX) || [];
      var type = parts[1];
      var st = parts[2];
      var city = parts[4];
      var zip = parts[6];
      var searchTerm = zip || (city && st ? "".concat(CommonUtils.getTitleCase(city), ", ").concat(st.toUpperCase()) : '');
      searchTerm && $cmp.find("#cloners >#titles >span[".concat(DISPLAY_MODE_ATTR, "=").concat(RESULTS_MODE, "]")).text("Truist Branches in ".concat(searchTerm));
      searchTerm || (searchTerm = PAGE_URL.searchParams.get('searchTerm'));
      var auto = true;
      trgUrl.searchParams['delete']('searchTerm');
      $locationType.filter("[value=".concat(type, "]")).click();

      if (footprint[st] && !searchTerm) {
        LocatorMap.init({
          viewport: footprint[st].viewport
        });
        var countProp = "".concat(type, "count");
        $cityWrapper = $cmp.find('.result-list-item-view >.statelist-index'); // Remove cities that are known to have 0 locations of current type:

        $cityWrapper.find('ul.statelist-content').each(function () {
          var $me = $(this);
          $me.find("a[data-".concat(countProp, "=0]")).closest('li').remove();
          !$me.children().length && $me.closest('.statelist-container').remove();
        }); // Do the needful with remaining cities:

        setTimeout(function () {
          $cityWrapper.find('ul.statelist-container li.remove-href').each(function () {
              $(this).find('a').attr('href', 'javascript:void(0)');
            });
        }, 1000);
        CommonUtils.initClickChain($cityWrapper, 'ul.statelist-container >li:last-child', function (ev) {
          ev.preventDefault();
          var $me = $(this);
          var $trigger = $me.find('a');
          $trigger.attr('aria-expanded', $trigger.attr('aria-expanded') != 'true');
          $me.find('svg').toggleClass('is-rotated');
          $me.closest('.statelist-container').find('.statelist-content').toggleClass('show-statelist').find('li:first-child a').focus();
        });
        $cityLinks = $cityWrapper.find('a').on('marker', function (ev) {
          return ev.currentTarget.click();
        });
        $cityLinks.each(function () {
          var $me = $(this);
          trgUrl.pathname = "/".concat(type, "/").concat(st, "/").concat($me.text()).toLowerCase();
          $me.attr('href', trgUrl.toString());
          var lat = $me.data('lat');
          var lng = $me.data('long');
          isFinite(lat) && isFinite(lng) && LocatorMap.createMarker(lat, lng, {
            mode: 'STATE',
            $item: $me,
            label: String($me.data(countProp)),
            title: $me.text()
          });
        }); // Populate map, set some flags, etc:

        LocatorMap.clusterMarkers();
        searchTerm = st.toUpperCase();
        auto = false;
        urlRecheck = !EDIT_MODE;

        _private.updateResultStatus("".concat($cityLinks.length, " Results in ").concat(footprint[st].displayName));

        _private.setDisplayMode(CITY_LIST_MODE);
      } //===/\/\/\=== CITY LIST ===/\/\/\===
      // Fire up the good ol' Autocomplete:


      LocatorAutocomplete.init({
        callback: _private.doLocationSearch,
          searchTerm: searchTerm,
        footprint: footprint,
        auto: auto
        });
    },
    //---------------------------------------
    //--- SEARCH CALLOUT ---
    doLocationSearch: function () {
      var jqxhr, timeoutId;

      function doLocationSearch() {
        var originParams = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        // (0) Clear any prior results:
        $resultList && $resultList.remove(); // (1) Check our filter situation:

          var sp = new URLSearchParams($filterForm.serialize());
          filterParams = Array.from(new Set(sp.keys())).reduce(function (acc, key) {
            acc[key] = sp.getAll(key).join();
            return acc;
          }, {});
          sessionStorage.setItem('locatorFilters', JSON.stringify(filterParams));
        var hominy = $filterForm.find('input:checkbox:enabled:checked').length;
        $('.badge-count').toggleClass('hide', hominy == 0).text(hominy); // (2) Should we stay or should we go?

        if (urlRecheck || originParams.state) {
          trgUrl.pathname = originParams.state ? "/".concat(filterParams.locationType == 'BOTH' ? 'branch' : filterParams.locationType, "/").concat(originParams.state).toLowerCase() : AUTHOR_MODE ? $innerCmp.data('locatorPage') : LOCATOR_HOME_PATH;
          var reload = trgUrl.pathname != PAGE_URL.pathname;
          reload && (window.location = trgUrl.toString());
          if (reload || originParams.state) return;
        } // (3) If we're still here, prepare to do the things:


        urlRecheck = !EDIT_MODE;
        $filterFormContainer.hide();

        var params = _objectSpread(_objectSpread(_objectSpread({}, BASE_PARAMS), filterParams), originParams);

        var query = Object.keys(params).map(function (key) {
          return "".concat(key, "=").concat(encodeURIComponent(params[key]));
        }).join('&'); // TODO: maybe use URLSearchParams for this instead?

        clearTimeout(timeoutId);
        timeoutId = setTimeout(_private.setDisplayMode, 1000, WAITING_MODE);
        jqxhr && jqxhr.abort(); // (4) Do the things:

        jqxhr = $.get({
          url: "".concat(LocatorUtils.LOCATIONS_API_PATH, "?").concat(query),
        dataType: 'json',
        cache: false,
        success: _private.handleLocationSearchResults,
          error: _private.handleError,
          complete: function complete() {
            return clearTimeout(timeoutId);
          }
        });
      }

      return doLocationSearch;
    }(),
    //---------------------------------------
    //--- SEARCH CALLBACK ---
    handleLocationSearchResults: function handleLocationSearchResults(data) {
      var locations = data.location;

      if (data.error) {
        _private.handleError(data.error);

        return;
      }

      if (!(locations && locations.length) && !applyFilter) {
    	  // Analytics when no search results:
        makeAnalyticsCall('noresult', LocatorAutocomplete.getLocatorText(), filterParams);
      } else if (applyFilter) {
        // Apply button click
        makeAnalyticsCall('apply', LocatorAutocomplete.getLocatorText(), filterParams);
      } else {
        // Analytics on click of search button when we have results
        makeAnalyticsCall('results', LocatorAutocomplete.getLocatorText(), filterParams);
      }

      if (!(locations && locations.length)) {
        // if no results, inform the user, then bail out -- nothing more to do here
        _private.updateResultStatus('0 Result(s)');

        $('.toggle-switch-map').hide(); 

        _private.setDisplayMode(NO_RESULTS_MODE);

        return;
      }

      var $cardCloner = $('#cloners >.card');
      var cardTemplate = $cardCloner.html().replace(/\$\{.*?\b(\w+)\}/g, '${$1}'); // workaround for unprocessed htm

      var schedTemplate = $cmp.find('#cloners >#sched-row').html(); // TODO: refactor so template-related objects can be static

      var alreadyGotOne = {};
      var $chosenCard;
      var chosenBlock = 1;
      var chosen = LocatorUtils.safeParse(sessionStorage.getItem('locatorChosen'));
      var saddr = encodeURIComponent(LocatorAutocomplete.getLocatorText());

      _private.setDisplayMode(RESULTS_MODE);

      LocatorMap.init({
        dragendCallback: LocatorAutocomplete.handleGeoLocation
      });
      $resultListWrapper.prepend(locations.map(function (loc, index) {
        // TODO: factor this out as a separate function (because handleLocationSearchResults is WAY too long!)
        var locAddr = loc.locationAddress;
        locAddr.zipCode = (locAddr.zipCode || '').replace(/-0000$/, ''); // remove placeholder zip+4, iff present

        loc.detailUrl = LocatorUtils.getDetailUrl(loc.locationType, locAddr);
        if (alreadyGotOne[loc.detailUrl]) return;
        $cmp.find('.loading-indicator').hide();
        alreadyGotOne[loc.detailUrl] = true;
        var scheds = {};
        loc.displayType = loc.locationType.toUpperCase();
        loc.displayType == 'BRANCH' && (loc.atmDetail || []).length && (loc.displayType += '/ATM');
        loc.displayName = "".concat(loc.locationName, " ").concat(loc.displayType);
        locAddr.streetAddress = TextFormatUtils.format(locAddr.address1, 'streetAddress');
        locAddr.address2 && loc.displayType == 'ATM' && (locAddr.streetAddress += '<br/>' + TextFormatUtils.format(locAddr.address2, 'streetAddress'));
        locAddr.city = TextFormatUtils.format(locAddr.city, 'title');
        var daddr = encodeURIComponent("".concat(locAddr.address1, ", ").concat(locAddr.city, ", ").concat(locAddr.state, " ").concat(locAddr.zipCode));
        loc.phone = loc.phone || ''; // ensure phone number is valid string

        var digits = loc.phone.replace(/\D+/g, ''); // extract digits from phone number

        /^0+$/.test(digits) && (loc.phone = ''); // iff digits are all 0, blank out phone number

        var $card = $cardCloner.clone().html(CommonUtils.fillTemplate(cardTemplate, [// TODO: factor this out as a separate function (maybe)
          index + 1, // 0
          loc.displayName, // 1   KUJO?
        locAddr.streetAddress, // 2
          locAddr.city, // 3
          locAddr.state, // 4
          locAddr.zipCode, // 5
        loc.phone.replace(/\)\s*/, ') '), // 6
          loc.locationDistance, // 7
          "".concat(loc.detailUrl).concat(trgUrl.search), // 8
          "".concat(loc.locationName, "_").concat(loc.locationType).toLowerCase().replace(/\s/g, '_').replace(/\W/g, ''), // 9
          lmu.getMobileDirectionsUrl(saddr, daddr), //10
          loc.locationType.toLowerCase() //11
        ]));
        $card.find('.tel-syntax a').each(function () {
          var $me = $(this);
          $me.text() || $me.parent().remove();
        });
        $card.find('[data-sched-key]').each(function () {
          // TODO: suppose we generate schedules BEFORE populating card template, along with a hide/show designator to embed within class attribute for each section...  then we could simply stuff all of this into fillTemplate array, instead manipulating $card afterward...
          var $me = $(this);
          var key = $me.data('sched-key');
          var $where = $me.parent();
          scheds[key] || (scheds[key] = LocatorUtils.getFormattedSchedule({
            key: key,
            loc: loc,
            schedTemplate: schedTemplate,
            linkTemplate: $('#cloners >.location-status-link').html(),
            showToday: true
          }));

          switch (true) {
            case !(scheds[key] && scheds[key].schedWeekly):
              $me.remove();
              break;

            case $where.is('div.address'):
              $me.append(scheds[key].schedToday);
                break;

            case $where.is('div.card-title-row'):
              $me.append(scheds[key].schedWeekly);
            }
        });
        $card.find('[data-sched-key]').length || $card.find('.seeMore-data').next().addBack().remove(); // remove hours section altogether iff nothing to show

        $card.data('locatorChosen', loc);
        LocatorMap.createMarker(locAddr.lat, locAddr['long'], {
          $item: $card,
          title: locAddr.address1
        });

        if (loc.detailUrl == chosen.detailUrl) {
          $chosenCard = $card;
          chosenBlock = Math.ceil((index + 1) / blockSize);
        }

        return $card;
      })); 
      $resultList = $resultListWrapper.find('.card');

      _private.reveal(0, chosenBlock); 

      $chosenCard && $chosenCard.trigger('marker');
      LocatorUtils.autoScroll($cmp);
    },
    //---------------------------------------
    //--- SHOWING AND HIDING, ETC ---
    reveal: function () {
      var blocks = 1;

      function reveal(inc) {
        var bl = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        bl > 0 ? blocks = bl : blocks += inc; 
        var end = Math.min(blocks * blockSize, $resultList.length);
        $resultList.each(function (i, elm) {
          return $(elm).toggleClass('hide', i >= end);
        });
        LocatorMap.showMarkerSlice(0, end); // really really!

        var showingResultsForTxt = $cmp.find('.show-results-number').attr('data-showing-results-txt') || 'Showing results for';

        _private.updateResultStatus("".concat(showingResultsForTxt, " \"").concat(LocatorAutocomplete.getLocatorText().replace(/([A-Z]{2}\s+\d{5}).*/, '$1'), "\""), // kujo?
        "1 - ".concat(end, " of ").concat($resultList.length));

        $loadMoreButton.parent().toggleClass('hide', end >= $resultList.length);
        $showLessButton.toggleClass('hide', blocks <= 1);
      }

      return reveal;
    }(),
    setDisplayMode: function setDisplayMode() {
        var mode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var $parts = $cmp.find("[".concat(DISPLAY_MODE_ATTR, "]"));
      var $show = $parts.filter("[".concat(DISPLAY_MODE_ATTR, "~=").concat(mode, "]")).removeClass('hide');
      $parts.not($show).addClass('hide');
      $cmp.find('.locator-header-title').text($cmp.find("#cloners >#titles >span[".concat(DISPLAY_MODE_ATTR, "=").concat(mode, "]")).text());
    },
    updateResultStatus: function () {
      var $spans;

      function updateResultStatus() {
      var fore = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var aft = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
        $cmp.find('.google-search-button').removeAttr('disabled').focus();
        $spans || ($spans = $cmp.find('.show-results-number h2'));
        $spans.text(fore);
        $spans.next().text(aft);
      }

      return updateResultStatus;
    }(),
    //---------------------------------------
    //--- EVENT HANDLERS ---
    handleLocationTypeChange: function handleLocationTypeChange() {
      var locationType = $(this).val().toLowerCase();
      var locationClass = "js-".concat(locationType);
      var isBoth = locationType == 'both';
      $filterForm.find('.branch-atm-validation input').each(function () {
        var $me = $(this);
        var active = isBoth || $me.hasClass(locationClass);
        $me.attr('disabled', !active).closest('li').toggle(active);
      }); //===\/\/\/=== CITY LIST ===\/\/\/===

      !isBoth && $cityLinks.attr('href', function (i, was) {
        return was.replace(TYPE_REPLACE_RGX, "$1".concat(locationType, "/"));
      }); //===/\/\/\=== CITY LIST ===/\/\/\===
    },
    closeFilterPopup: function closeFilterPopup(ev) {
      if (!(ev.type == 'click' || ev.keyCode === 13 || ev.keyCode === 32)) return;
          $(this).closest('.filter-popup-container').hide();
          $('.filter-button-with-badge').focus();
          $('.locator-header-title').show();
          filterButtonClick = false;
          $('.group-filter-search').find('.filter-button-badge').removeClass('filterActiveColor');
      $innerCmp.find('.search-navigation').show();
          $resultListWrapper.show();
          $('.result-list-item-view').show();
          $cityWrapper.show();
    },
    closeFilterFocus: function closeFilterFocus(e) {
      if (e.type == 'click' || e.keyCode === 13 || e.keyCode === 32) {
        $(this).closest('form').get(0).reset();
        $('.filter-button-with-badge').focus();
      }
    },
    mapViewToggle: function mapViewToggle(ev) {
      ev.preventDefault();
      $resultListWrapper.parent().hide().next().show();
      LocatorMap.rebound(); // correct map scale, now that container has a defined width and height

      $innerCmp.find('.search-navigation').hide();
      var $me = $(this);
      $me.closest('.toggle-switch-map').find('.get-filter-location').show();
      $me.hide().next().show();
    },
    listViewToggle: function listViewToggle(ev) {
      ev.preventDefault();
      $innerCmp.find('.search-navigation').show();
      var $me = $(this);
      $me.closest('.toggle-switch-map').find('.get-filter-location').hide();
      $innerCmp.find('.result-list-item-view').show();
      $innerCmp.find('.resultlist-index').show();
      $innerCmp.find('.statelist-index').show();
      $innerCmp.find('.google-map-view').hide();
      $me.hide().prev().show();
    },
    toggleMapListButton: function toggleMapListButton() {
      if ($(window).width() > 815) {
        $resultListWrapper.show();
        $('.map-view').show();
      }

      if (filterButtonClick == true) {
        if ($(window).width() < 1023) {
          $innerCmp.find('.search-navigation').hide();
          $resultListWrapper.hide();
        }
      }
    },
    filterClosePopupEvent: function filterClosePopupEvent() {
      $('.map-view-toggle').show();
      $(this).hide().closest('.filter-button-center-align').prev().hide();
      $innerCmp.find(".main-container").children().first().show();
      $innerCmp.find('.map-view').hide();
    },
    filterPopupEvent: function filterPopupEvent(ev) {
      ev.preventDefault();
      $(this).addClass('filterActiveColor');
      $filterFormContainer.show();
      filterButtonClick = true;

      if (ev.type == 'click' || ev.keyCode === 13 || ev.keyCode === 32) {
        $('.filter-popup-container').attr('tabindex', 0).focus();
      }

      var small = $(window).width() < 1023;
      $resultListWrapper.parent().toggle(!small);
      $innerCmp.find('.search-navigation').toggle(!small);
    },
    handleServiceKeyupEvent: function handleServiceKeyupEvent(e) {
      if (e.keyCode === 9) {
        $(this).find('span').css('border', '1px solid #2e1a47').focus();
        /* Need to add border in CSS */
      }
    },
    handleServicefocusEvent: function handleServicefocusEvent(e) {
      if (e.keyCode === 9) {
        $(this).find('span').css('border', '1px solid #ccc');
        /* Need to add border in CSS */
      }
    },
    handleReset: function handleReset(ev) {
      ev.preventDefault();
      $(this).closest('form').get(0).reset(); // reset explicitly here, rather than allow default, to ensure it happens before we re-compute visibility of checkboxes

      $filterForm.find('input:radio:checked').click();
      sessionStorage.removeItem('locatorFilters');
      applyFilter = false;
    },
    handleApplyFilters: function handleApplyFilters(ev) {
      ev.preventDefault();
      applyFilter = true;
      $innerCmp.find('.search-navigation').show();
      $resultListWrapper.parent().show();
      $cityWrapper.show();
      $('.group-filter-search').find('.filter-button-badge').removeClass('filterActiveColor');
      LocatorAutocomplete.activate();
    },
    handleApplyKeydowFilter: function handleApplyKeydowFilter(ev) {
      if (ev.keyCode === 9) {
        ev.preventDefault();
        $('.close-icon-popup').focus();
      }
    },
    openStatusModal: function openStatusModal(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var $me = $(this);
      var $modal = $me.next();
      var status = $me.data('status');
      $('.js-location-status-msg').not($modal).addClass('hide'); // TODO: refactor to use a single modal (instead of one following each info button), so we can skip this step

      $modal.removeClass('hide').find('[data-status]').each(function () {
        var $mine = $(this);
        $mine.toggleClass('hide', $mine.data('status') != status);
      });
      $(document).one('click keydown', function (ev) {
        return (ev.type == 'click' || ev.keyCode == 13 || ev.keyCode == 32) && $modal.addClass('hide');
      });
    },
    seeMoreToggle: function seeMoreToggle(ev) {
      ev.preventDefault();
      var $me = $(this);
      $me.add($me.siblings()).add($me.closest('.grid-item').next()).toggleClass('hide');
    },
    handleGetDirection: function handleGetDirection() {
      var chosen = $(this).closest('.card').data('locatorChosen');
      chosen.searchUrl = PAGE_URL.href;
      sessionStorage.setItem('locatorChosen', JSON.stringify(chosen));
    },
    handleMarker: function handleMarker() {
      var $me = $(this);
      CommonUtils.rollTo($me, 0, function () {
        return $me.find('a').first().focus();
      });
    },
    handleError: function handleError(jqxhr, status, err) {
      if (status == 'abort') return; // this just means we cancelled one request to start another -- no need for error message

      console.error(err);
      window.location = '/locator-error'; // TODO: obtain configured path instead
    }
  }; //---------------------------------------
  //--- WA HELPERS ---

  function makeAnalyticsCall(mode, searchKeyword, filterParams) {
    var searchterm = searchKeyword.replace(/[^A-Z0-9]+/ig, '_').toLowerCase();
    if (searchterm == sessionStorage.getItem('locatorWAsearchterm') && mode != 'apply') return; // bail out iff repeating prior searchterm and not applying filter

    sessionStorage.setItem('locatorWAsearchterm', searchterm);
    var cdata = {};

    switch (mode) {
        case 'noresult':
        cdata.pageName = "truist|com|locator_search_results";
        cdata.locatorSearchType = "locator_search"; //capture the search type

             cdata.locatorSearchTerm = searchterm;  // capture the search term

             var filteroptions = getAnalyticsFilterParam(filterParams);
             cdata.locatorSearchExtraInfo = filteroptions.join(","); // filter details

             cdata.events = "event78,event79";
        searchButtonClick ? marTech.trackAction(cdata) : marTech.trackState(cdata);
             return;

        case 'apply':
        	var filteroptions = getAnalyticsFilterParam(filterParams);

        if (window.location.pathname.includes(LOCATOR_HOME_PATH)) {
	          cdata.pageName = "truist|com|locator_search_results";
        } else {
          // city page
	        	var urlpath = window.location.pathname;
          urlpath = urlpath.replace(/\//g, '|');
          cdata.pageName = "truist|com" + urlpath;
	        }

        cdata.linkName = "apply";
        cdata.linkType = "interaction";
        cdata.linkPositon = "locator_search|narrow_down_search";
        cdata.linkExtraInfo = filteroptions.join(",");
        marTech.trackAction(cdata);
        applyFilter = false; //reset apply filter

           return;

        default:
        	// Analytics on click of search button - when results are available
        if (window.location.pathname.includes(LOCATOR_HOME_PATH)) {
	          cdata.pageName = "truist|com|locator_search_results";
	          cdata.locatorSearchType = "locator_search"; //capture the search type

	          cdata.locatorSearchTerm = searchterm; // capture the search term

	          var filteroptions = getAnalyticsFilterParam(filterParams);
	          cdata.locatorSearchExtraInfo = filteroptions.join(","); // filter details

	          cdata.events = "event78"; // All branch locator searches

          searchButtonClick ? marTech.trackAction(cdata) : marTech.trackState(cdata);
        } else {
	        	 	//city page
		        	var urlpath = window.location.pathname;
		        	urlpath = urlpath.replace(/\//g, '|');
		        	cdata.pageName = "truist|com" + urlpath;
		        	cdata.locatorSearchType = "locator_search"; //capture the search type

		            cdata.locatorSearchTerm = searchterm; // capture the search term

		            var filteroptions = getAnalyticsFilterParam(filterParams);
		            cdata.locatorSearchExtraInfo = filteroptions.join(","); // filter details

		            cdata.events = "event78"; // All branch locator searches

          searchButtonClick ? marTech.trackAction(cdata) : marTech.trackState(cdata);
	        }

      }
  }

  function getAnalyticsFilterParam(filterParams) {
    var filteroptions = [];

    if (filterParams.options) {
    	var options = filterParams.options.split(',');
  	    options.forEach(function (op) {
	          var option = op.trim();
        var filterelement = $(".filter-popup-container input[value='" + option + "']").data('analytics');
	          filteroptions.push('fl:' + filterelement);
	          });
    }

    if (filterParams.locationType) {
    	filteroptions.push("opt:" + filterParams.locationType.toLowerCase());
    }

    if (filterParams.searchRadius) {
    	filteroptions.push("rad:" + filterParams.searchRadius);
    }

    return filteroptions;
  } //---------------------------------------
  //--- API ---


  var _public = {
    init: _private.init
  };
  return _public;
}();
$(function () {  
    
    var index = $('.filter-button-text').text();
    var cropped = index;

    onResizeFilter = function() {
        var winWidth = $(window).width();
         if(winWidth < 1023) {
                $('.google-map-view ').hide()
                if(index.indexOf(" ")>=0) cropped = index.substr(0,index.indexOf(" "));
                $('#show-filter').find('.filter-button-text').text(cropped);
         }

         else {
            $('.google-map-locator-component').find('.search-navigation').show()
            $('#show-filter').find('.filter-button-text').text(index);
         }
    }

    $('.branch-detail-component').find('.input-svg-color svg').attr("tabindex", -1);
    
    $('.branch-detail-component .google-locator-input').on('keydown', function(e) {
                 if(e.keyCode == 9) {
                        $(this).closest('.input-svg-color').find('.bg-svg svg ').attr("tabindex", 1);
                        $(this).closest('.input-svg-color').find('.bg-svg').attr("tabindex", 1).focus()
                 }
    });
    
    
    $('.branch-detail-component .bg-svg').on('keydown', function(e) {
        if(e.keyCode == 9) {
         var disabledDirection =  $(this).closest('.group-filter-search').find('.btn').attr('disabled');

            if(disabledDirection) {
                             $(this).closest('.get-direction-page').find('.reverse-trip').focus();
            }

            else {
                            $(this).closest('.group-filter-search').find('.btn').focus();

            }   
        }
    });




    window.onscroll = function() { MapButtonEvent()};
    
    
    function MapButtonEvent() {
        if($(window).width() < 1023) {
            if($(window).height()+$('.details-view-component').height() < $(window).scrollTop()) { 
                    $('.toggle-map-detail-view').css("display","none");
            }
            else {
                   $('.toggle-map-detail-view').css("display","block");
            }

            if($('.back-view-toggle').is(":visible")) {
                $('.google-map-locator-component').find('.google-map-view').show();     
             }
             else {
                  $('.google-map-locator-component').find('.google-map-view').hide();          
             }

             if($('.back-view-toggle-detail').is(":visible")) {
                $('.map-details-container').find('.google-map-view').show();      
             }
             else {
                 $('.map-details-container').find('.google-map-view').hide();    
             }

        }
    }
    


    
    $(document).ready(onResizeFilter);
    $(window).resize(onResizeFilter); 

});
'use strict';

window.LocatorDetail = function () {
  var $cmp, $getDirectionLinks, $locationName;
  var lmu = LocatorMobileUtils();
  var origin, destination;
  var reverse = false;
  var chosen = LocatorUtils.safeParse(sessionStorage.getItem('locatorChosen')); //console.log( chosen, chosen.displayName );

  chosen.detailUrl == location.pathname || (chosen = {}); // COMMENT OUT FOR LOCAL UNIT-TESTING

  var _private = {
    init: function init() {
      $cmp = $('.branch-detail-component').first(); // TODO: use site-wide component helper instead

      $cmp.find('.get-direction-page').find('.input-svg-color >.placeholder').text('Get Directions');
      chosen.searchUrl && $cmp.find('a.back-btn').attr('href', chosen.searchUrl).removeClass('hide');
      $locationName = $cmp.find('.js-location-name'); // Analytics call for branch/atm detail page:
           
      if ($cmp.length) {
        var cdata = {};
        var urlpath = window.location.pathname.replace(/\//g, '|').replace(/-/g, '_');
        cdata.pageName = "truist|com".concat(urlpath);
        marTech.trackState(cdata);
      }  // Destination coordinates:


      var $geo = $('[itemprop=geo]');
      destination = LocatorUtils.getLatLngLiteral($geo.find('meta[itemprop=latitude]').attr('content'), $geo.find('meta[itemprop=longitude]').attr('content'));
      console.log('destination:', destination); // Event handling:

      CommonUtils.initClickChain($cmp, '.reversi >a', function (ev) {
                ev.preventDefault();
        $(this).attr('aria-label', 'Reverse trip map updated');
                reverse = !reverse;

                _private.updateDirections();
      });
            $cmp.find('.map-view-detail-toggle').on('click', _private.mapViewToggle);
      $cmp.find('.back-view-toggle').on('click', _private.backViewToogle);
      $(window).resize(_private.toggleDetailMapList);
      $getDirectionLinks = $cmp.find('a.get-direction, a.get-direction-view-toggle');
      lmu.init($getDirectionLinks);
      CommonUtils.initClickChain($cmp, '.js-location-status', _private.openStatusModal);
      CommonUtils.initClickChain($cmp, '.js-location-status-msg', function (ev) {
        return ev.stopPropagation();
      });
      CommonUtils.initClickChain($cmp, '.closed-popup-close-icon', function () {
        return $(document).click();
      }); // Temp workaround for missing info...

      $.get({
        url: "".concat(LocatorUtils.LOCATIONS_API_PATH, "?returnBranchATMStatus=Y&maxResults=1&locationType=").concat(location.pathname.split('/')[1].toUpperCase(), "&searchRadius=1&lat=").concat(destination.lat, "&long=").concat(destination.lng),
        dataType: 'json',
        complete: _private.moreInit
      }); // Initialize autocomplete, etc:

      LocatorAutocomplete.init({
        callback: _private.updateOrigin,
        remember: false
      });
    },
    moreInit: function moreInit(jqxhr) {
      console.log(jqxhr);
      var loc;

      try {
        loc = jqxhr.responseJSON.location.shift();
      } catch (err) {
        loc = chosen;
      }

      var schedTemplate = $cmp.find('.js-cloners >.js-locator-sched-row').html();
      var linkTemplate = $cmp.find('.js-cloners >.location-status-link').html();
      var $hmdc = $cmp.find('.hours-map-details-container');
      $hmdc.children().each(function () {
        var $me = $(this);
        var key = $me.data('sched-key');
        loc[key] || (loc[key] = ($me.data(key.toLowerCase()) || '').split(/,(?=mon|tue|wed|thu|fri|sat|sun)/i));
        console.log(loc);
        var html = LocatorUtils.getFormattedSchedule({
          key: key,
          loc: loc,
          schedTemplate: schedTemplate,
          linkTemplate: linkTemplate
        }).schedWeekly;
        html ? $me.append(html) : $me.remove();
      });
      $hmdc.children().length == 0 && $hmdc.parent().remove();
      LocatorUtils.autoScroll($cmp);
    },
    updateOrigin: function updateOrigin(params) {
      origin = LocatorUtils.getSearchOrigin(params);
      console.log('origin:', origin);
      reverse = false;

      _private.updateDirections();

      $getDirectionLinks.attr('href', lmu.getMobileDirectionsUrl(encodeURIComponent(LocatorAutocomplete.getLocatorText()), encodeURIComponent($cmp.find('.branch-details-address').text().trim().replace(/\s*\n\s*/, ', '))));
    },
    updateDirections: function updateDirections() {
      if (origin) {
        // $locationName.first().toggleClass( 'hide', !reverse );
        // $locationName.last().toggleClass( 'hide', reverse );
        $locationName.toggleClass('js-direction-reverse', reverse);
        reverse ? LocatorMap.route(destination, origin) : LocatorMap.route(origin, destination);
      } else {
        $locationName.addClass('hide');
        LocatorMap.createMarker(destination.lat, destination.lng);
        LocatorMap.showMarkerSlice(0, 1);
      }
    },
    mapViewToggle: function mapViewToggle() {
      // TODO: find some way to consolidate this with backViewToggle, since they reference many of same elements...
      $(this).closest('.map-details-container').find('.details-view-component').hide().next().addClass("map-view-show").find('.map-view').show();
      LocatorMap.rebound();
      $(this).closest('.toggle-map-detail-view').find('.get-direction-view-toggle').show();
      $('.popup-container-hide').hide();
      $('.breadcurb-nav').hide();
      $(this).hide().next().show();
    },
    backViewToogle: function backViewToogle() {
      $(this).closest('.map-details-container').find('.map-view').hide();
      $(this).closest('.map-details-container').find('.details-view-component').show().next().removeClass("map-view-show");
      $(this).closest('.toggle-map-detail-view').find('.get-direction-view-toggle').hide();
      $('.popup-container-hide').show();
      $('.breadcurb-nav').show();
      $(this).hide().prev().show();
    },
    toggleDetailMapList: function toggleDetailMapList() {
      if ($(window).width() > 815) {
        $cmp.find('.details-view-component').show();
        $cmp.find('.map-view').show();
      }
    },
    openStatusModal: function openStatusModal(ev) {
      // TODO: this is duplicated from Locator.js -- should be in common library instead
      ev.preventDefault();
      ev.stopPropagation();
      var $me = $(this);
      var $modal = $me.next();
      var status = $me.data('status');
      console.log(status);
      $modal.removeClass('hide').find('[data-status]').each(function () {
        var $mine = $(this);
        $mine.toggleClass('hide', $mine.data('status') != status);
      });
      $(document).one('click keydown', function (ev) {
        return (ev.type == 'click' || ev.keyCode == 13 || ev.keyCode == 32) && $modal.addClass('hide');
      });
    }
  };
  var _public = {
    init: _private.init
  };
  return _public;
}();
