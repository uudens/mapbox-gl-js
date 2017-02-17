'use strict';
// @flow

type Config = {|
  API_URL: string,
  REQUIRE_ACCESS_TOKEN: boolean,
  ACCESS_TOKEN: ?string
|};

const config: Config = {
    API_URL: 'https://api.mapbox.com',
    REQUIRE_ACCESS_TOKEN: true,
    ACCESS_TOKEN: 'pk.eyJ1IjoiZ3JhcGhvbWFwMTIzIiwiYSI6IjY5M2E1MTliMmI4NDZmZTgyMjBjYWUxNWI2YWVlMGU2In0.pqdnBjCQKFRSaopLs6SKNA'
};

module.exports = config;
