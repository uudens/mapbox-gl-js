'use strict';

const util = require('../util/util');
const ajax = require('../util/ajax');
const Evented = require('../util/evented');
const loadTileJSON = require('./load_tilejson');
const normalizeURL = require('../util/mapbox').normalizeTileURL;
const {DEMPyramid, Level} = require('../geo/dem_pyramid');

class RasterTileSource extends Evented {

    constructor(id, options, dispatcher, eventedParent) {
        super();
        this.id = id;
        this.dispatcher = dispatcher;

        this.minzoom = 0;
        this.maxzoom = 22;
        this.roundZoom = true;
        this.scheme = 'xyz';
        this.tileSize = 512;
        this._loaded = false;
        util.extend(this, util.pick(options, ['url', 'scheme', 'tileSize']));

        this.setEventedParent(eventedParent);
        this.fire('dataloading', {dataType: 'source'});
        loadTileJSON(options, (err, tileJSON) => {
            if (err) {
                return this.fire('error', err);
            }
            util.extend(this, tileJSON);
            this.fire('data', {dataType: 'source'});
            this.fire('source.load');
        });
    }

    onAdd(map) {
        this.map = map;
    }

    serialize() {
        return {
            type: 'raster',
            url: this.url,
            tileSize: this.tileSize,
            tiles: this.tiles
        };
    }

    loadTile(tile, callback) {
        const url = normalizeURL(tile.coord.url(this.tiles, null, this.scheme), this.url, this.tileSize);
        tile.request = ajax.getImage(url, done.bind(this));

        function done(err, img) {
            delete tile.request;

            if (tile.aborted) {
                this.state = 'unloaded';
                return callback(null);
            }

            if (err) {
                this.state = 'errored';
                return callback(err);
            }

            const gl = this.map.painter.gl;
            var dem;
            if (this.id==='terrain') {
                dem = new DEMPyramid();
                dem.loadFromImage(img);
            }

            tile.texture = this.map.painter.getTileTexture(img.width);
            if (tile.texture) {
                gl.bindTexture(gl.TEXTURE_2D, tile.texture);
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, dem ? dem.levels[0].data : img);
            } else {
                console.log(dem.levels[0].data);
                tile.texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, tile.texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, dem ? dem.levels[0].data : img);
                tile.texture.size = dem ? dem.levels[0].width : img.width;
            }
            gl.generateMipmap(gl.TEXTURE_2D);


            tile.state = 'loaded';

            callback(null);
        }
    }

    abortTile(tile) {
        if (tile.request) {
            tile.request.abort();
            delete tile.request;
        }
    }

    unloadTile(tile) {
        if (tile.texture) this.map.painter.saveTileTexture(tile.texture);
    }
}

module.exports = RasterTileSource;
