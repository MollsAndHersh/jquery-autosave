module.exports = function( grunt ) {
    var rDefineBegin = /^define\([^{]*?{\s*/,
        rDefineEnd = /\}\);\s*$/,
        rModuleExport = /\s*return\s+[^}]+(\}\);\s*)$/;

    // Strip out AMD definitions on build
    function processBuildContents( name, path, contents ) {
        return contents
            .replace( rModuleExport, "$1" )
            .replace( rDefineBegin, "" )
            .replace( rDefineEnd, "\n" );
    }

    grunt.config.init({
        pkg: grunt.file.readJSON( "package.json" ),

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
                    baseUrl: "./src",
                    name: "jquery-bridge",
                    onBuildWrite: processBuildContents,
                    optimize: "none",
                    out: "dist/jquery.autosave.js",
                    paths: {
                        jquery: "empty:"
                    },
                    skipSemiColonInsertion: true,
                    wrap: {
                        start: grunt.file.read( "build/start.jst" ),
                        end: grunt.file.read( "build/end.jst" )
                    }
                }
            }
        },

        // JavaScript minification for distribution files.
        uglify: {
            options: {
                mangle: false,
                preserveComments: "some"
            },
            basic: {
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
    grunt.task.loadNpmTasks( "grunt-contrib-jshint" );
    grunt.task.loadNpmTasks( "grunt-contrib-qunit" );
    grunt.task.loadNpmTasks( "grunt-contrib-requirejs" );
    grunt.task.loadNpmTasks( "grunt-contrib-uglify" );
    grunt.task.loadNpmTasks( "grunt-contrib-watch" );

    // Dev build
    grunt.task.registerTask( "default", [
        "jshint",
        "requirejs",
        // TODO don't use dist file in qunit so we can run it before compiling
        "qunit"
    ]);

    // Production ready build
    grunt.task.registerTask( "build", [
        "default",
        "uglify"
    ]);
};
