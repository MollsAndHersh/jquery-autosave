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
                browser: true,
                camelcase: true,
                curly: true,
                devel: true,
                eqeqeq: true,
                jquery: true,
                latedef: true,
                maxlen: 120,
                newcap: true,
                trailing: true,
                undef: true,
                unused: true
            },
            basic: {
                src: "<%= concat.basic.dest %>"
            },
            grunt: {
                src: "Gruntfile.js"
            },
            test: {
                options: {
                    globals: {
                        asyncTest: false,
                        deepEqual: false,
                        equal: false,
                        expect: false,
                        module: false,
                        notDeepEqual: false,
                        notEqual: false,
                        notStrictEqual: false,
                        ok: false,
                        QUnit: false,
                        raises: false,
                        start: false,
                        stop: false,
                        strictEqual: false,
                        test: false,
                        throws: false
                    }
                },
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
