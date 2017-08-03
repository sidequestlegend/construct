/**
 * Created by autoc on 30/07/2017.
 */
/**
 * Created by Shane Harris on 29/05/2017. - based on https://gist.github.com/danharper/3ca2273125f500429945 but upgraded to add tsify
 */
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var tsify = require("tsify");
var watchify = require('watchify');
var babel = require('babelify');
var rename = require("gulp-rename");
var browserSync = require('browser-sync').create();
var bundle = function(bundler) {
	bundler.bundle()
		.on('error', function(err) { console.error(err); this.emit('end'); })
		.pipe(source('main.ts'))
		.pipe(buffer())
		.pipe(sourcemaps.init({ loadMaps: true }))
		.pipe(sourcemaps.write())
		.pipe(rename('index.js'))
		.pipe(gulp.dest('./static'))
		.pipe(browserSync.stream({once: true}));

};

var compile = function(shouldWatch){
	var bundler = watchify(browserify('./src/main.ts', { debug: true }).plugin(tsify, { target: 'es2015'  }).transform(babel, {
		presets: ['es2015'],
		extensions: ['.js', '.ts']
	}));
	if (shouldWatch) {
		bundler.on('update', function() {
			bundle(bundler);
		});
	}
	bundle(bundler);
};
gulp.task('noVNC', function() {
	gulp.src(['./noVNC/core/**/*.js'])
		.pipe(gulp.dest('./vendor/noVNC/core/'));
	return gulp.src(['./noVNC/vendor/**/*.js'])
		.pipe(gulp.dest('./vendor/noVNC/vendor/'));

});
gulp.task('browser-sync', function() {
	browserSync.init({
		server: {
			baseDir: "./static/"
		}
	});
});

gulp.task('build', function() { return compile(); });
gulp.task('watch', function() {   return compile(true); });

gulp.task('default', ['watch','browser-sync','noVNC']);