const { merge } = require("webpack-merge");
const singleSpaDefaults = require("webpack-config-single-spa-react-ts");
const Dotenv = require("dotenv-webpack");

module.exports = (webpackConfigEnv, argv) => {
  const defaultConfig = singleSpaDefaults({
    orgName: "jembi",
    projectName: "reprocessor-mediator-microfrontend",
    webpackConfigEnv,
    argv,
  });

  return merge(defaultConfig, {
    plugins: [new Dotenv()],
    // modify the webpack config however you'd like to by adding to this object
  });
};
