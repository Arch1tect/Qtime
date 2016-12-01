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
    './js/lib/*.js',
    './js/utils.js',

    './js/grid.js',
    './js/addEntry.js',
    './js/login.js',
    './js/modal.js',

    './js/footer.js',
    './js/qtime.js',
    './js/durationSlider.js',

    './js/app.js'

    ])
    .pipe(concat('bundle.js'))
    // .pipe(stripDebug())
    .pipe(uglify())
    .pipe(gulp.dest('./build/'));


    // bundle for style.css
    gulp.src([
        './style/*.css'
        ])
        .pipe(concat('bundle.css'))
        .pipe(minifyCSS())
        .pipe(gulp.dest('./build/'));


});