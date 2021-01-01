var webpack = require('webpack')

module.exports = {
  lintOnSave: false,
  configureWebpack: {
      plugins: [
          new webpack.DefinePlugin({
              'process.env': {
                  'MAX_IMAZE_KB_SIZE': JSON.stringify(process.env.MAX_IMAZE_KB_SIZE),
                  'MAX_AUDIO_MB_SIZE': JSON.stringify(process.env.MAX_AUDIO_MB_SIZE)
              }
          })
      ]
  },
  transpileDependencies: ["vuetify"]
};
