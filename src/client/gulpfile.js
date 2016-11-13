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
    './jquery-3.1.0.min.js',
    './vue2.js',
    './cookie.js',
    './nouislider.min.js',

    './grid.js',
    './login.js',
    './modal.js',

    './qtime.js',
    './durationSlider.js',

    './app.js'

    ])
    .pipe(concat('bundle.js'))
    // .pipe(stripDebug())
    .pipe(uglify())
    .pipe(gulp.dest('./build/'));


    // bundle for style.css
    gulp.src([
        './*.css'
        ])
        .pipe(concat('bundle.css'))
        .pipe(minifyCSS())
        .pipe(gulp.dest('./build/'));


});