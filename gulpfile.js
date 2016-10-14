var gulp = require('gulp'); 
// include plug-ins
var concat = require('gulp-concat');
// var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');

var minifyCSS = require('gulp-minify-css');


// JS concat, strip debugging and minify
gulp.task('default', function() {

    // bundle for bundle.js 
    gulp.src([
    './client/jquery-3.1.0.min.js',
    './client/vue2.js',
    './client/nouislider.min.js',

    './client/grid.js',
    './client/modal.js',

    './client/qtime.js',
    './client/durationSlider.js',

    './client/app.js'

    ])
    .pipe(concat('bundle.js'))
    // .pipe(stripDebug())
    .pipe(uglify())
    .pipe(gulp.dest('./client/'));


    // bundle for style.css
    gulp.src([
        './client/*.css'
        ])
        .pipe(concat('bundle.css'))
        .pipe(minifyCSS())
        .pipe(gulp.dest('./client/'));


});