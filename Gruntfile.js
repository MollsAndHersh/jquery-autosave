/*global module:false*/
module.exports = function( grunt ) {
    "use strict";

    grunt.config.init({
        pkg: grunt.file.readJSON( "package.json" ),
        concat: {
            basic: {
                options: {
                    process: true,
                    separator: "\n"
                },
                src: [
                    "src/intro.js",
                    "src/utility.js",
                    "src/handler.js",
                    "src/sequence.js",
                    "src/autosave.js",
                    "src/jquery-bridge.js",
                    "src/outro.js"
                ],
                dest: "dist/<%= pkg.name %>.js"
            }
        },
        jshint: {
            options: {
                camelcase: true,
                curly: true,
                eqeqeq: true,
                latedef: true,
                maxlen: 120,
                newcap: true,
                trailing: true,
                undef: true,
                unused: true
            },
            basic: {
                options: {
                    browser: true,
                    globals: {
                        console: true,
                        jQuery: true
                    }
                },
                src: [
                    "<%= concat.basic.dest %>"
                ]
            },
            grunt: {
                src: [
                    "gruntfile.js"
                ]
            }
        },
        uglify: {
            options: {
                mangle: false,
                preserveComments: "some"
            },
            basic: {
                src: [
                    "<%= concat.basic.dest %>"
                ],
                dest: "dist/<%= pkg.name %>.min.js"
            }
        },
        watch: {
            scripts: {
                files: [
                    "gruntfile.js",
                    "src/**/*.js"
                ],
                options: {
                    interval: 100,
                    forceWatchMethod: 'old'
                },
                tasks: [
                    "default"
                ]
            }
        }
    });

    // Load plugins from npm
    grunt.task.loadNpmTasks( "grunt-contrib-concat" );
    grunt.task.loadNpmTasks( "grunt-contrib-jshint" );
    grunt.task.loadNpmTasks( "grunt-contrib-uglify" );
    grunt.task.loadNpmTasks( "grunt-contrib-watch" );

    // Dev build
    grunt.task.registerTask( "default", [
        "concat",
        "jshint"
    ]);

    // Full build
    grunt.task.registerTask( "build", [
        "default",
        "uglify"
    ]);
};
