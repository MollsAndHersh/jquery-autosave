/* global module:false */
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
                    "src/handler.js",
                    "src/namespacer.js",
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
                jshintrc: true
            },
            basic: {
                src: "<%= concat.basic.dest %>"
            },
            grunt: {
                src: "Gruntfile.js"
            },
            test: {
                src: "test/unit/*.js"
            }
        },
        qunit: {
            all: {
                src: "test/**/*.html"
            }
        },
        uglify: {
            options: {
                mangle: false,
                preserveComments: "some"
            },
            basic: {
                src: "<%= concat.basic.dest %>",
                dest: "dist/<%= pkg.name %>.min.js"
            }
        },
        watch: {
            src: {
                files: [
                    "Gruntfile.js",
                    "src/**/*.js"
                ],
                tasks: [
                    "default"
                ]
            },
            test: {
                files: "<%= jshint.test.src %>",
                tasks: [
                    "jshint",
                    "qunit"
                ]
            }
        }
    });

    // Load plugins from npm
    grunt.task.loadNpmTasks( "grunt-contrib-concat" );
    grunt.task.loadNpmTasks( "grunt-contrib-jshint" );
    grunt.task.loadNpmTasks( "grunt-contrib-qunit" );
    grunt.task.loadNpmTasks( "grunt-contrib-uglify" );
    grunt.task.loadNpmTasks( "grunt-contrib-watch" );

    // Dev build
    grunt.task.registerTask( "default", [
        "concat",
        "jshint",
        "qunit"
    ]);

    // Full build
    grunt.task.registerTask( "build", [
        "default",
        "uglify"
    ]);
};
