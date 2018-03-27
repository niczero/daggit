const tier = process.env.NODE_ENV;
const path = require('path');

module.exports = {
  entry: {
    'daggit': path.join(__dirname, 'daggit.js')
  },

  output: {
    filename: '[name].[hash:7].min.js',
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/dist/'
  }
};
