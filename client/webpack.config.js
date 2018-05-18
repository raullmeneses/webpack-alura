const path = require('path');
const babiliPlugin = require('babili-webpack-plugin');
const extractTextPlugin = require('extract-text-webpack-plugin');
const optimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const webpack = require('webpack');

/*
    Utilizado para gerar o index.html a partir do main.html, injetando todas as
    dependências automaticamente.
    
    "Lembrando que atualmente o index.html ainda não vai ser gravado na pasta dist, 
    mas com essa mudança, o public path configurado no webpack.config.js não poderá 
    mais conter a a pasta dist. Porque se estamos dentro desta pasta e importamos os 
    bundles.js da mesma pasta, teremos um problema. Não existe a pasta dist dentro 
    de dist. A solução será remover o public path, porque os arquivos serão importado 
    na raiz de dist."
*/
const HtmlWebpackPlugin = require('html-webpack-plugin');

let plugins = [];

plugins.push(new HtmlWebpackPlugin({
    
    hash: true,
    minify: {
        html5: true,
        collapseWhitespace: true,
        removeComments: true
    },
    filename: 'index.html',
    template: __dirname + '/main.html'

}));
plugins.push(new extractTextPlugin('styles.css'));

/*
Para disponibilizar o jQuery globalmente, e assim resolver plugins
externos que dependem dele, plodemos usar o webpack.ProvidePlugin.
*/
plugins.push(new webpack.ProvidePlugin({
    '$': 'jquery/dist/jquery.js',
    'jQuery': 'jquery/dist/jquery.js'
}));

/*
Separando os bundles em 2: código que foi programado por mim
e código programado por terceiros.
*/
plugins.push(new webpack.optimize.CommonsChunkPlugin({
    
    name: 'vendor', //utilizado como chave em exports.entry.
    filename: 'vendor.bundle.js',

}));


let SERVICE_URL = JSON.stringify('http://localhost:3000');
if (process.env.NODE_ENV == 'production'){
    
    //SERVICE_URL = JSON.stringify('http://endereco-da-sua-api');

    /*
    Cada módulo do nosso bundle é envolvido por um wrapper, que resumidamente se trata de uma função. 
    Contudo, a existência desses wrappers tornam a execução do script um pouco mais lenta no navegador .

    Entretanto, a partir do Webpack 3, podemos ativar o Scope Hoisting. 
    Ele consiste em concatenar o escopo de todos os módulos em um único wrapper, 
    permitindo assim que nosso código seja executado mais rapidamente no navegador.
    */
    plugins.push(new webpack.optimize.ModuleConcatenationPlugin()); // ativando o Scope Hoisting

    plugins.push(new babiliPlugin());

    plugins.push(new optimizeCSSAssetsPlugin({
        cssProcessor: require('cssnano'),
        cssProcessosOptions: {
            discardComments:{
                removeAll: true
            }
        },
        canPrint: true
    }));
}

// Adicionando constante global
plugins.push(new webpack.DefinePlugin({ SERVICE_URL }));

module.exports = {
    entry: {
        app: './app-src/app.js',
        vendor: ['jquery', 'bootstrap', 'reflect-metadata']
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.css$/,
                use: extractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader'
                })
            },
            { 
                test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/, 
                loader: 'url-loader?limit=10000&mimetype=application/font-woff' 
            },
            { 
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/, 
                loader: 'url-loader?limit=10000&mimetype=application/octet-stream'
            },
            { 
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/, 
                loader: 'file-loader' 
            },
            { 
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/, 
                loader: 'url-loader?limit=10000&mimetype=image/svg+xml' 
            }         
        ]
    },
    plugins
}