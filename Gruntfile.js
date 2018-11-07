
const { existsSync } = require( 'fs' );

const sassBuildSpec = [
	'style',
	'editor',
];

// If vars file is detected, will automatically compile target.
const sassBuildFiles = sassBuildSpec.reduce( ( acc, file ) => {
	const varFile = `${file}-css-vars.scss`;
	if ( existsSync( varFile ) ) {
		acc[ `${file}.css` ] = varFile;
	} else {
		acc[ `${file}.css` ] = `${file}.scss`;
	}
	return acc;
}, {});

module.exports = function( grunt ) {
	'use strict';
	
	grunt.initConfig({
		sass: {
			build: {
				options: {
					outputStyle: 'expanded',
					require: 'susy',
					sourcemap: 'none',
					includePaths: require( 'node-bourbon' ).includePaths
				},
				files: [ sassBuildFiles ]
			},
		},
		watch: {
			sass: {
				files: [ "stylesheets/*.scss", "stylesheets/*/*.scss", "*.scss" ],
				tasks: [
					'sass'
				]
			},
		}
	});
	
	// Load NPM tasks to be used here
	grunt.loadNpmTasks( 'grunt-sass' );
	grunt.loadNpmTasks( 'grunt-contrib-watch' );

	grunt.registerTask( 'default', [
		'build',
		'watch',
	]);

	grunt.registerTask( 'css', [
		'sass',
	] );

	grunt.registerTask( 'build', [
		'css',
	]);
	
};