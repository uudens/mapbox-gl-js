'use strict';

var parseColor = require('./parse_color');
var styleSpec = require('./style_spec');
var interpolate = require('../util/interpolate');
var util = require('../util/util');
var Evented = require('../util/evented');
var validateStyle = require('./validate_style');
var StyleDeclaration = require('./style_declaration');
var StyleTransition = require('./style_transition');

/**
 * Controls the light used to light extruded features.
 *
 * @typedef {Object} LightOptions
 * @property {string} anchor Whether the light direction should be oriented based on the map or viewport. Options are `'map'`, `'viewport'`.
 * @property {Color} color The color to tint the extrusion light.
 * @property {Array<number>} direction The direction of the light source, in [r radial coordinate, θ azimuthal angle, φ polar angle], where r indicates the distance from the center of an object to its light, θ indicates the position of the light relative to 0° (like a clock), and φ indicates the height of the light source (from 0°, directly above, to 180°, directly below).
 * @property {number} intensity The intensity with which to light extruded features.
 * @property {number} duration The light animation's duration, measured in milliseconds.
 * @property {Function} easing The light animation's easing function.
 * @property {boolean} animate If `false`, no light animation will occur.
 */

module.exports = Light;

var TRANSITION_SUFFIX = '-transition';

function Light(lightOptions) {
    this.set(lightOptions);
}

Light.prototype = util.inherit(Evented, {
    activeLightTransitions: {},

    properties: ['anchor', 'color', 'direction', 'intensity'],

    _specifications: styleSpec.$root.light,

    set: function(lightOpts) {
        // if (this._validate(validateStyle.light, 'light', lightOpts)) return this;
        this._declarations = {};
        this._transitions = {};
        this._transitionOptions = {};
        this.calculated = {};

        lightOpts = util.extend(lightOpts, {
            anchor: this._specifications.anchor.default,
            color: this._specifications.color.default,
            direction: this._specifications.direction.default,
            intensity: this._specifications.intensity.default
        });
        // TODO make sure this util.extends goes the right way

        for (var p in this.properties) {
            var prop = this.properties[p];

            this._declarations[prop] = new StyleDeclaration(this._specifications[prop], lightOpts[prop]);

            this.calculated[prop] = this.getLightValue(prop);
        }

        return this;
    },

    getLight: function() {
        // TODO delete this method??

        return {
            anchor: this.getLightProperty('anchor'),
            color: this.getLightProperty('color'),
            direction: this.getLightProperty('direction'),
            intensity: this.getLightProperty('intensity')
        };
    },

    getLightProperty: function(property) {
        if (util.endsWith(property, TRANSITION_SUFFIX)) {
            return (
                this._transitionOptions[property]
            );
        } else {
            return (
                this._declarations[property] &&
                this._declarations[property].value
            );
        }
    },




    getLightValue: function(property, globalProperties, featureProperties) {
        if (property === 'direction') {
            var calculated = this._declarations[property].calculate(globalProperties, featureProperties),
                cartesian = util.sphericalToCartesian(calculated);
            return {
                x: cartesian[0],
                y: cartesian[1],
                z: cartesian[2]
            }
        }

        return this._declarations[property].calculate(globalProperties, featureProperties);
    },

    setLight: function(options) {
        for (var key in options) {
            var value = options[key];

            if (util.endsWith(key, TRANSITION_SUFFIX)) {
                // !!! TODO !!!!
                // if (this._handleErrors(validateStyle.light, key, value)) return;
                this._transitionOptions[key] = value;
            } else {
                if (value === null || value === undefined) {
                    delete this._declarations[key];
                } else {
                    /// !!!! TODO !!!!
                    // if (this._handleErrors(validateStyle.light, key, value)) return;
                    this._declarations[key] = new StyleDeclaration(this._specifications[key], value);
                }
            }
        }
    },

    recalculate: function(zoom, zoomHistory) {
        for (var property in this._declarations) {
            this.calculated[property] = this.getLightValue(property, {zoom: zoom, zoomHistory: zoomHistory});
        }
    },

    _lightEnd: function(eventData) {
        this.activeLightTransitions.color = false;
        this.activeLightTransitions.direction = false;
        this.activeLightTransitions.intensity = false;

        this.fire('lightend', eventData);
    },

    _applyLightDeclaration: function(property, declaration, options, globalOptions, animationLoop) {
        var oldTransition = options.transition ? this._transitions[property] : undefined;
        var spec = this._specifications[property];
if (property === 'color') debugger;

        if (declaration === null || declaration === undefined) {
            declaration = new StyleDeclaration(spec, spec.default);
        }

        if (oldTransition && oldTransition.declaration.json === declaration.json) return;

        var transitionOptions = util.extend({
            duration: 300,
            delay: 0
        }, globalOptions, this.getLightProperty(property + TRANSITION_SUFFIX));
        var newTransition = this._transitions[property] =
            new StyleTransition(spec, declaration, oldTransition, transitionOptions);
        if (!newTransition.instant()) {
            newTransition.loopID = animationLoop.set(newTransition.endTime - Date.now());
        }

        if (oldTransition) {
            animationLoop.cancel(oldTransition.loopID);
        }
    },

    updateLightTransitions: function(options, globalOptions, animationLoop) {
        var property;
        for (property in this._declarations) {
            this._applyLightDeclaration(property, this._declarations[property], options, globalOptions, animationLoop);
        }
    },
});
