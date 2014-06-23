/* jshint camelcase: false */
module.exports = function( grunt ) {
    grunt.config.init({
        pkg: grunt.file.readJSON( "package.json" ),

        // Front-end dependency management
        bowercopy: {
            vendor: {
                options: {
                    destPrefix: "vendor"
                },
                files: {
                    "fixture.js": "fixture/dist/fixture.js",
                    "jquery.js": "jquery/dist/jquery.js",
                    "jquery.deferred.sequence.js": "jquery-deferred-sequence/jquery.deferred.sequence.js",
                    "poly/lib": "poly/lib/*",
                    "poly/function.js": "poly/function.js",
                    "qunit": "qunit/qunit/*",
                    "require.js": "requirejs/require.js"
                }
            }
        },

        // Version management
        bump: {
            options: {
                commitFiles: [
                    "dist/*",
                    "bower.json",
                    "package.json"
                ],
                files: [
                    "bower.json",
                    "package.json"
                ],
                pushTo: "origin master",
                tagName: "%VERSION%",
                updateConfigs: [ "pkg" ]
            }
        },

        // Clean up files and folders before build
        clean: {
            dependencies: [
                "bower_components",
                "vendor"
            ],
            build: [
                "dist"
            ]
        },

        // TODO
        //jscs: {},

        // JavaScript linting. Configuration options are defined in .jshintrc
        jshint: {
            options: {
                jshintrc: true
            },
            grunt: {
                src: "Gruntfile.js"
            },
            source: {
                src: "src/**/*.js"
            },
            test: {
                src: "test/unit/**/*.js"
            }
        },

        // TODO
        //jsonlint: {},

        // JavaScript unit tests.
        qunit: {
            all: {
                src: "test/**/*.html"
            }
        },

        // Require.js optimization. Processes multiple AMD compliant files into one.
        requirejs: {
            compile: {
                options: {
                    baseUrl: "./",
                    exclude: [
                        "vendor/fixture",
                        "vendor/jquery.deferred.sequence"
                    ],
                    name: "src/jquery-bridge",
                    optimize: "none",
                    out: "dist/jquery.autosave.js",
                    paths: {
                        "jquery": "empty:"
                    },
                    skipSemiColonInsertion: true,
                    wrap: {
                        start: grunt.file.read( "build/start.jst" ),
                        end: grunt.file.read( "build/end.jst" )
                    }
                }
            }
        },

        // Remove development-only code segments (mostly AMD stuff)
        strip_code: {
            build: {
                options: {
                    start_comment: "start-build-ignore",
                    end_comment: "end-build-ignore"
                },
                src: "dist/jquery.autosave.js"
            }
        },

        // JavaScript minification for distribution files.
        uglify: {
            options: {
                banner: grunt.file.read( "build/banner.jst" ),
                preserveComments: false
            },
            dist: {
                src: "<%= requirejs.compile.options.out %>",
                dest: "dist/<%= pkg.name %>.min.js"
            }
        },

        // Run grunt tasks when files change.
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
    grunt.loadNpmTasks( "grunt-bowercopy" );
    grunt.loadNpmTasks( "grunt-contrib-clean" );
    grunt.loadNpmTasks( "grunt-contrib-jshint" );
    grunt.loadNpmTasks( "grunt-contrib-qunit" );
    grunt.loadNpmTasks( "grunt-contrib-requirejs" );
    grunt.loadNpmTasks( "grunt-contrib-uglify" );
    grunt.loadNpmTasks( "grunt-contrib-watch" );
    grunt.loadNpmTasks( "grunt-strip-code" );

    // Dev
    grunt.registerTask( "default", [
        "jshint",
        "qunit"
    ] );

    // Dependencies
    grunt.registerTask( "dependencies", [
        "clean:dependencies",
        "bowercopy"
    ] );

    // Build
    grunt.registerTask( "build", [
        "default",
        "dependencies",
        "clean:build",
        "requirejs",
        "strip_code",
        "uglify"
    ] );

    // Release
    grunt.registerTask( "release", function() {
        var type = this.args.shift() || "patch";
        grunt.task.run( [
            "bump:" + type + ":bump-only",
            "build",
            "bump:" + type + ":commit-only"
        ] );
    });
};
